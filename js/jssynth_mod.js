/* Thanks Marc @ stackoverflow for this module definition pattern
 * http://stackoverflow.com/questions/13673346/supporting-both-commonjs-and-amd
 */
(function(name, deps, definition) {
    if (typeof module != 'undefined') {
        module.exports = definition();
    } else if (typeof define == 'function' && typeof define.amd == 'object') {
        define(name, deps, definition);
    } else {
        this[name] = definition();
    }
}('jssynth_mod', ['jssynth_core'], function() {
    "use strict";

    var jssynth_mod = {};

    var VIBRATO_TABLE = [
        /* Waveform #0: SINE WAVE TABLE ~~~~~~~~.  */
        [   0,  24,  49,  74,  97, 120, 141, 161, 180, 197, 212, 224, 235, 244, 250, 253,
            255, 253, 250, 244, 235, 224, 212, 197, 180, 161, 141, 120,  97,  74,  49,  24,
            0, -24, -49, -74, -97,-120,-141,-161, -180,-197,-212,-224,-235,-244,-250,-253,
            -255,-253,-250,-244,-235,-224,-212,-197, -180,-161,-141,-120, -97, -74, -49, -24],

        /* Waveform #1: RAMP DOWN:  |`._|`._|`._ */
        [ 255, 246, 238, 230, 222, 214, 206, 198, 190, 182, 173, 165, 157, 149, 141, 133,
            125, 117, 109, 100,  92,  84,  76,  68, 60,  52,  44,  36,  27,  19,  11,   3,
            -4, -12, -20, -28, -36, -45, -53, -61,-69, -77, -85, -93,-101,-109,-118,-126,
            -134,-142,-150,-158,-166,-174,-182,-191, -199,-207,-215,-223,-231,-239,-247,-255],

        /*                             _   _
         * Waveform #2: SQUARE WAVE |_| |_| |_
         */
        [ 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            -255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,
            -255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255,-255 ],

        /* random - obviously not true, but hopefully close enough */
        [ 81, -123, 63, -138, 153, -84, 208, 97, 160, -195, 173, -94, 162, 30, 34, -135,
            -102, -82, 24, -141, -167, -137, -232, -229, 224, 145, -212, 181, 60, 64, -55, 36,
            -26, 46, 120, 163, -132, -16, -208, -87, 179, 122, 244, 91, 179, -175, 202, -207,
            168, 191, -241, 236, -192, -146, -185, 12, 6, 81, 214, 151, 196, -10, -95, -155]
    ];

    var INVERT_LOOP_TABLE = [ 0,5,6,7,8,10,11,13,16,19,22,26,32,43,64,128 ];

    var MIN_SLIDE_PERIOD = 54;
    var MAX_SLIDE_PERIOD = 1712*4;

    var TEMPLATE_EFFECT = {
        div: function(param, playerState, channelState, period) {},
        tick: function(param, playerState, channelState, period) {},
        allowSampleTrigger: true,
        allowVolumeChange: true,
        allowPeriodChange: true
    };

    var S3M_RETRIG_TABLE = [
        function(vol) { return vol; },
        function(vol) { return vol-1; },
        function(vol) { return vol-2; },
        function(vol) { return vol-4; },
        function(vol) { return vol-8; },
        function(vol) { return vol-16; },
        function(vol) { return vol*2/3; },
        function(vol) { return vol/2; },
        function(vol) { return vol; },
        function(vol) { return vol+1; },
        function(vol) { return vol+2; },
        function(vol) { return vol+4; },
        function(vol) { return vol+8; },
        function(vol) { return vol+16; },
        function(vol) { return vol*3/2; },
        function(vol) { return vol*2; }
    ];

    jssynth_mod.EFFECTS = {
        'MOD_ARPEGGIO': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                var currentNote = jssynth_mod.MOD_PERIOD_TABLE.getNote(channelState.lastPeriod);
                if (param != 0x00) {
                    if (currentNote < 0 || currentNote > 108) {
                        channelState.effectState.arpTable = [ channelState.period, channelState.period, channelState.period];
                    } else {
                        var a = (param & 0xf0) / 16;
                        var b = (param & 0x0f);
                        channelState.effectState.arpTable = [
                            jssynth_mod.MOD_PERIOD_TABLE.getPeriod(currentNote),
                            jssynth_mod.MOD_PERIOD_TABLE.getPeriod(currentNote+a),
                            jssynth_mod.MOD_PERIOD_TABLE.getPeriod(currentNote+b)
                        ];
                        channelState.effectState.arpPos = 0;
                    }
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                if (param != 0x00) {
                    channelState.effectState.arpPos = (channelState.effectState.arpPos + 1) % 3;
                    channelState.period = channelState.effectState.arpTable[channelState.effectState.arpPos];
                }
            }
        }),
        'MOD_PORTA_UP': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.portAmt = param * 4;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                channelState.period -= channelState.effectState.portAmt;
                if (channelState.period < MIN_SLIDE_PERIOD) {
                    channelState.period = MIN_SLIDE_PERIOD;
                }
            }
        }),
        'MOD_PORTA_DOWN': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.portAmt = param * 4;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                channelState.period += channelState.effectState.portAmt;
                if (channelState.period > MAX_SLIDE_PERIOD) {
                    channelState.period = MAX_SLIDE_PERIOD;
                }
            }
        }),
        'MOD_PORTA_TO_NOTE': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (period != 0) {
                    channelState.effectState.portToNoteDestPeriod = period;
                    if (!channelState.effectState.portToNoteSpeed) {
                        channelState.effectState.portToNoteSpeed = 0x00;
                    }
                    channelState.lastPeriod = period;
                }
                if (param != 0x00) {
                    channelState.effectState.portToNoteSpeed = param * 4;
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {

                if (channelState.effectState.portToNoteDestPeriod && channelState.effectState.portToNoteSpeed) {
                    if (channelState.effectState.portToNoteDestPeriod > channelState.period) {
                        channelState.period += channelState.effectState.portToNoteSpeed;
                        if (channelState.period > channelState.effectState.portToNoteDestPeriod) {
                            channelState.period = channelState.effectState.portToNoteDestPeriod;
                            channelState.lastPeriod = channelState.period;
                        }
                    }
                    if (channelState.effectState.portToNoteDestPeriod < channelState.period) {
                        channelState.period -= channelState.effectState.portToNoteSpeed;
                        if (channelState.period < channelState.effectState.portToNoteDestPeriod) {
                            channelState.period = channelState.effectState.portToNoteDestPeriod;
                            channelState.lastPeriod = channelState.period;
                        }
                    }
                }
            },
            allowPeriodChange: false
        }),
        'MOD_VIBRATO': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                var vibParams = channelState.effectState.vibratoParams || {
                    waveform: 0,
                    pos: 0,
                    depth: 0,
                    speed: 0
                };
                if (vibParams.waveform <= 3 && period > 0) {
                    vibParams.pos = 0;
                }
                if (param > 0x00) {
                    var newDepth = param & 0x0f;
                    if (newDepth > 0) {
                        vibParams.depth = newDepth;
                    }
                    var newSpeed = ((param & 0xf0) / 16);
                    if (newSpeed > 0) {
                        vibParams.speed = newSpeed;
                    }
                }
                channelState.effectState.vibratoParams = vibParams;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var lookupPeriodOffset = function(p) { return (VIBRATO_TABLE[p.waveform & 0x03][p.pos] * p.depth / 128); };
                var updatePos = function(p) { p.pos = (p.pos + p.speed) % 64; };
                var vibParams = channelState.effectState.vibratoParams;
                if (vibParams) {
                    updatePos(vibParams);
                    channelState.period = channelState.lastPeriod + lookupPeriodOffset(vibParams) * 4;
                }
            }

        }),
        'MOD_PORTA_PLUS_VOL_SLIDE': jssynth_core.merge(TEMPLATE_EFFECT, {
            // warning - copy pasted from effect #3
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (period != 0) {
                    channelState.effectState.portToNoteDestPeriod = period;
                    if (!channelState.effectState.portToNoteSpeed) {
                        channelState.effectState.portToNoteSpeed = 0x00;
                    }
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                jssynth_mod.EFFECTS.MOD_PORTA_TO_NOTE.tick(mixer, chan, param, playerState, channelState);
                jssynth_mod.EFFECTS.MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
            },
            allowPeriodChange: false
        }),
        'MOD_VIBRATO_PLUS_VOL_SLIDE': jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function() {
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                jssynth_mod.EFFECTS.MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
                jssynth_mod.EFFECTS.MOD_VIBRATO.tick(mixer, chan, param, playerState, channelState);
            }
        }),
        'MOD_TREMOLO': jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                var tremParams = channelState.effectState.tremoloParams || {
                    waveform: 0,
                    pos: 0,
                    depth: 0,
                    speed: 0
                };
                if (tremParams.waveform <= 3 && period > 0) {
                    tremParams.pos = 0;
                }
                if (param > 0x00) {
                    var newDepth = param & 0x0f;
                    if (newDepth > 0) {
                        tremParams.depth = newDepth;
                    }
                    var newSpeed = ((param & 0xf0) / 16);
                    if (newSpeed > 0) {
                        tremParams.speed = newSpeed;
                    }
                }
                channelState.effectState.tremoloParams = tremParams;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var lookupVolumeOffset = function(p) { return (VIBRATO_TABLE[p.waveform & 0x03][p.pos] * p.depth / 64); };
                var updatePos = function(p) { p.pos = (p.pos + p.speed) % 64; };
                var tremParams = channelState.effectState.tremoloParams;
                if (tremParams) {
                    updatePos(tremParams);
                    channelState.volume = channelState.lastVolume + lookupVolumeOffset(tremParams);
                    channelState.volume = Math.round(channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume);
                }
            }
        }),
        MOD_PAN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period) {
                if (param <= 0x80) {
                    channelState.panPos.left = (128-param)/128;
                    channelState.panPos.right = param / 128;
                } else if (param == 0xa4) {
                    channelState.panPos.left = 1;
                    channelState.panPos.right = -1;
                }
            }
        }),
        MOD_SAMPLE_OFFSET: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                mixer.setSamplePosition(chan, param * 256);
            }
        }),
        MOD_VOLUME_SLIDE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var upAmt = (param & 0xf0) / 16,  downAmt = param & 0x0f;
                if (upAmt !== 0x00 && downAmt !== 0x00) {
                    downAmt = 0x00;
                }
                channelState.volume += upAmt - downAmt;
                channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
                channelState.lastVolume = channelState.volume;
            }

        }),
        MOD_JUMP_TO_PATTERN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.jumpToPattern = param;
            }
        }),
        MOD_SET_VOLUME: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                channelState.volume = param < 0 ? 0 : param > 0x40 ? 0x40 : param;
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PATTERN_BREAK: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                var x = ((param & 0xf0) / 16);
                var y = param & 0x0f;
                var newRow = x * 10 + y;
                playerState.breakToRow = newRow;
            }
        }),
        MOD_PROTRACKER: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var newEffect = 0xe0 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth_mod.MOD_EFFECT_MAP[newEffect].div(mixer, chan, newParam, playerState, channelState, period, note, song);
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var newEffect = 0xe0 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth_mod.MOD_EFFECT_MAP[newEffect].tick(mixer, chan, newParam, playerState, channelState);
            }
        }),
        MOD_PT_SET_FILTER: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period) {
                playerState.filter = param;
            }
        }),
        MOD_PT_FINE_PORTA_UP: jssynth_core.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                channelState.period -= param * 4;
                channelState.lastPeriod = channelState.period;
            }
        }),
        MOD_PT_FINE_PORTA_DOWN: jssynth_core.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                channelState.period += param * 4;
                channelState.lastPeriod = channelState.period;
            }
        }),
        MOD_PT_GLISSANDO_CONTROL: jssynth_core.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                playerState.glissandoControl = param;
            }
        }),
        MOD_PT_SET_VIBRATO_WAVEFORM: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.vibratoParams.waveform = param & 0x07;
            }
        }),
        MOD_PT_SET_FINETUNE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                if (note.sampleNumber != 0) {
                    var instrument = song.instruments[note.sampleNumber - 1];
                    instrument.metadata.pitchOfs = Math.pow(EIGHTH_SEMITONE_MULTIPLIER, (param < 8 ? param : (param - 16)));
                }
            }
        }),
        MOD_PT_PATTERN_LOOP: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var doLoop = function() {
                    channelState.effectState.patternLoop.count--;
                    playerState.l_breakToRow = channelState.effectState.patternLoop.row;
                    playerState.l_jumpToPattern = playerState.pos;
                };
                if (param == 0x00) {
                    /* start loop */
                    channelState.effectState.patternLoop.row = playerState.row;
                } else {
                    if (channelState.effectState.patternLoop.count == null) {
                        channelState.effectState.patternLoop.count = param;
                        doLoop();
                    } else {
                        if (channelState.effectState.patternLoop.count != 0) {
                            doLoop();
                        } else {
                            channelState.effectState.patternLoop.count = null;
                        }
                    }
                }
            }
        }),
        MOD_PT_SET_TREMOLO_WAVEFORM: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.tremoloParams.waveform = param & 0x07;
            }
        }),
        MOD_PT_16_POS_PAN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.panPos.left = (15 - param) / 15;
                channelState.panPos.right = param / 15;
            }
        }),
        MOD_PT_RETRIG_NOTE: jssynth_core.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                if ((playerState.tick + 1) % param == 0) {
                    mixer.setSamplePosition(chan, 0);
                }
            }
        }),
        MOD_PT_FINE_VOLSLIDE_UP: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.volume += param;
                if (channelState.volume >  64) {
                    channelState.volume = 64;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_FINE_VOLSLIDE_DOWN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.volume -= param;
                if (channelState.volume < 0) {
                    channelState.volume = 0;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_CUT_NOTE: jssynth_core.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                if (playerState.tick >= param) {
                    channelState.volume = 0;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_DELAY_NOTE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var noteToPlay = note.note;
                if (noteToPlay < 0) {
                    noteToPlay = jssynth_mod.MOD_PERIOD_TABLE.getNote(parms.period);
                }
                var instrument = note.sampleNumber > 0 ? song.instruments[note.sampleNumber - 1] : null;
                var sample = null;
                if (instrument && noteToPlay > 0) {
                    var sampleNum = instrument.metadata.noteToSampleMap[noteToPlay];
                    sample = instrument.samples[sampleNum];
                }
                channelState.effectState.noteDelay = {
                    delay: param,
                    note: note,
                    sample: sample
                };
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                if (playerState.tick == (param - 1)) {
                    var note = channelState.effectState.noteDelay.note;

                    var period = note.note < 0 ? 0 : jssynth_mod.MOD_PERIOD_TABLE.getPeriod(note.note);
                    var volume = note.volume;
                    var sample =  channelState.effectState.noteDelay.sample;
                    if (sample) {
                        mixer.setSample(chan, sample);
                        channelState.volume = sample.metadata.volume;
                        channelState.lastVolume = sample.metadata.volume;
                    }
                    if (period > 0) {
                        channelState.period = period;
                        channelState.lastPeriod = period;
                        mixer.setSamplePosition(chan, 0);
                    }
                    if (volume >= 0) {
                        channelState.volume = volume;
                        channelState.lastVolume = volume;
                    }
                }
            },
            allowPeriodChange: false,
            allowSampleTrigger: false,
            allowVolumeChange: false
        }),
        MOD_PT_DELAY_PATTERN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState) {
                playerState.patternDelay = param * playerState.speed;
            },
            tick:function(mixer, chan, param, playerState, channelState) {
            }
        }),
        MOD_PT_INVERT_LOOP: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                channelState.effectState.invertLoop.delay = 0;
                var ins = channelState.sample;
                if (ins > 0) {
                    channelState.effectState.invertLoop.sample = song.instruments[ins];
                }
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var currentSample = channelState.effectState.invertLoop.sample;

                channelState.effectState.invertLoop.delay += INVERT_LOOP_TABLE[param];
                if (currentSample && currentSample.metadata.repeatLength > 2 && channelState.effectState.invertLoop.delay >= 128) {
                    channelState.effectState.invertLoop.delay = 0;

                    channelState.effectState.invertLoop.pos ++;
                    if (channelState.effectState.invertLoop.pos > currentSample.metadata.repeatLength) {
                        channelState.effectState.invertLoop.pos = 0;
                    }

                    currentSample.data[currentSample.metadata.repeatStart+channelState.effectState.invertLoop.pos] =
                        (0 - currentSample.data[currentSample.metadata.repeatStart+channelState.effectState.invertLoop.pos]);
                }
            }
        }),
        MOD_SET_SPEED: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                if (param <= 0x20) {
                    playerState.speed = param;
                } else {
                    playerState.bpm = param;
                }
            }
        }),
        S3M_SET_SPEED: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.speed = param;
            }
        }),
        S3M_SET_TEMPO: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.bpm = param;
            }
        }),
        S3M_VOLUME_SLIDE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param == 0x00) {
                    param = channelState.effectState.lastS3MVolSlide || 0x00;
                }
                channelState.effectState.lastS3MVolSlide = param;
                var a = (param & 0xf0) / 16;
                var b = param & 0x0f;
                if (playerState.fastS3MVolumeSlides) {
                    if (b === 0x00 && a !== 0x00) {
                        channelState.volume += a;
                    } else if (a === 0x00 && b !== 0x00) {
                        channelState.volume -= b;
                    }
                }
                if (b === 0x0f) {
                    channelState.volume += a;
                } else if (a === 0x0f) {
                    channelState.volume -= b;
                }
                channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
                channelState.lastVolume = channelState.volume;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var slideAmt = channelState.effectState.lastS3MVolSlide;
                var a = (slideAmt & 0xf0) / 16;
                var b = (slideAmt & 0x0f);
                if (b === 0x00 && a !== 0x00) {
                    channelState.volume += a;
                } else if (a === 0x00 && b !== 0x00) {
                    channelState.volume -= b;
                }
                channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
                channelState.lastVolume = channelState.volume;
            }
        }),
        S3M_PORTA_DOWN: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param == 0x00) {
                    param = channelState.effectState.lastS3MPortDown || 0x00;
                }
                channelState.effectState.lastS3MPortDown = param;
                var a = (param & 0xf0) / 16;
                var b = param & 0x0f;
                if (a == 0x0f) {
                    channelState.period += b * 4;
                } else if (a == 0x0e) {
                    channelState.period += b;
                }
                if (channelState.period > MAX_SLIDE_PERIOD) {
                    channelState.period = MAX_SLIDE_PERIOD;
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var slideAmt = channelState.effectState.lastS3MPortDown;
                var a = (slideAmt & 0xf0) / 16;
                var b = (slideAmt & 0x0f);
                if (a < 0x0e) {
                    channelState.period += ((a * 16) + b) * 4;
                }
                if (channelState.period > MAX_SLIDE_PERIOD) {
                    channelState.period = MAX_SLIDE_PERIOD;
                }
            }
        }),
        S3M_PORTA_UP: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param == 0x00) {
                    param = channelState.effectState.lastS3MPortDown || 0x00;
                }
                channelState.effectState.lastS3MPortDown = param;
                var a = (param & 0xf0) / 16;
                var b = param & 0x0f;
                if (a == 0x0f) {
                    channelState.period -= b * 4;
                } else if (a == 0x0e) {
                    channelState.period -= b;
                }
                if (channelState.period < MIN_SLIDE_PERIOD) {
                    channelState.period = MIN_SLIDE_PERIOD;
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var slideAmt = channelState.effectState.lastS3MPortDown;
                var a = (slideAmt & 0xf0) / 16;
                var b = (slideAmt & 0x0f);
                if (a < 0x0e) {
                    channelState.period -= ((a * 16) + b) * 4;
                }
                if (channelState.period < MIN_SLIDE_PERIOD) {
                    channelState.period = MIN_SLIDE_PERIOD;
                }
            }
        }),
        S3M_RETRIG_PLUS_VOLUME_SLIDE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param & 0xf0 != 0x00) {
                    channelState.effectState.lastS3MRetrigVolSldParam = (param & 0xf0) / 16;
                }
                if (param & 0x0f != 0x00) {
                    channelState.effectState.lastS3MRetrigRetrigTickParam = (param & 0x0f);
                }

            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var retrigTicks = channelState.effectState.lastS3MRetrigRetrigTickParam || 0x00;
                var volSld = channelState.effectState.lastS3MRetrigVolSldParam || 0x00;
                if ((playerState.tick + 1) % retrigTicks == 0) {
                    mixer.setSamplePosition(chan, 0);
                    channelState.volume = S3M_RETRIG_TABLE[volSld](channelState.volume);
                }
                channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
                channelState.lastVolume = channelState.volume;
            }
        }),
        S3M_EXTENDED: jssynth_core.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var newEffect = 0x130 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth_s3m.S3M_EFFECT_MAP[newEffect].effect.div(mixer, chan, newParam, playerState, channelState, period, note, song);
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var newEffect = 0x130 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth_s3m.S3M_EFFECT_MAP[newEffect].effect.tick(mixer, chan, newParam, playerState, channelState);
            }
        }),
        S3M_FINE_VIBRATO: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                var vibParams = channelState.effectState.vibratoParams || {
                    waveform: 0,
                    pos: 0,
                    depth: 0,
                    speed: 0
                };
                if (vibParams.waveform <= 3 && period > 0) {
                    vibParams.pos = 0;
                }
                if (param > 0x00) {
                    var newDepth = param & 0x0f;
                    if (newDepth > 0) {
                        vibParams.depth = newDepth;
                    }
                    var newSpeed = ((param & 0xf0) / 16);
                    if (newSpeed > 0) {
                        vibParams.speed = newSpeed;
                    }
                }
                channelState.effectState.vibratoParams = vibParams;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var lookupPeriodOffset = function(p) { return (VIBRATO_TABLE[p.waveform & 0x03][p.pos] * p.depth / 128); };
                var updatePos = function(p) { p.pos = (p.pos + p.speed) % 64; };
                var vibParams = channelState.effectState.vibratoParams;
                if (vibParams) {
                    updatePos(vibParams);
                    channelState.period = channelState.lastPeriod + lookupPeriodOffset(vibParams) ;
                }
            }

        }),
        S3M_TREMOR: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                console.log("S3M Tremor; Does this sound okay?!");
                if (param > 0x00) {
                    channelState.effectState.tremorParam = param;
                }
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.tremorCount = ((channelState.effectState.tremorCount + 1) % (x+y));
                var x = (param & 0xf0) / 16;
                var y = param & 0x0f;
                if (channelState.effectState.tremorCount < x) {
                    channelState.volume = channelState.lastVolume;
                } else {
                    channelState.volume = 0;
                }
            }
        }),
        S3M_SET_GLOBAL_VOLUME: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.globalVolume = param;
            }
        }),
        S3M_STEREO_CONTROL: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                if (param > 7) {
                    param = param - 16;
                }
                param = param + 8;
                channelState.panPos.left = (15 -  param) / 15;
                channelState.panPos.right = param / 15;
            }
        }),
        XM_GLOBAL_VOLUME_SLIDE: jssynth_core.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param == 0x00) {
                    param = channelState.effectState.lastXMGlobalVolSlide || 0x00;
                }
                channelState.effectState.lastXMGlobalVolSlide = param;
                var a = (param & 0xf0) / 16;
                var b = param & 0x0f;
                if (playerState.fastS3MVolumeSlides) {
                    if (b === 0x00 && a !== 0x00) {
                        playerState.globalVolume += a;
                    } else if (a === 0x00 && b !== 0x00) {
                        playerState.globalVolume -= b;
                    }
                }
                if (b === 0x0f) {
                    playerState.globalVolume += a;
                } else if (a === 0x0f) {
                    playerState.globalVolume -= b;
                }
                playerState.globalVolume = playerState.globalVolume < 0 ? 0 : playerState.globalVolume > 64 ? 64 : playerState.globalVolume;
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                var slideAmt = channelState.effectState.lastXMGlobalVolSlide;
                var a = (slideAmt & 0xf0) / 16;
                var b = (slideAmt & 0x0f);
                if (b === 0x00 && a !== 0x00) {
                    playerState.globalVolume += a;
                } else if (a === 0x00 && b !== 0x00) {
                    playerState.globalVolume -= b;
                }
                playerState.globalVolume = playerState.globalVolume < 0 ? 0 : playerState.globalVolume > 64 ? 64 : playerState.globalVolume;
            }
        })

    };


    jssynth_mod.MOD_EFFECT_MAP = {
        0x00: { code: '0', effect: jssynth_mod.EFFECTS.MOD_ARPEGGIO },
        0x01: { code: '1', effect: jssynth_mod.EFFECTS.MOD_PORTA_UP },
        0x02: { code: '2', effect: jssynth_mod.EFFECTS.MOD_PORTA_DOWN },
        0x03: { code: '3', effect: jssynth_mod.EFFECTS.MOD_PORTA_TO_NOTE },
        0x04: { code: '4', effect: jssynth_mod.EFFECTS.MOD_VIBRATO },
        0x05: { code: '5', effect: jssynth_mod.EFFECTS.MOD_PORTA_PLUS_VOL_SLIDE },
        0x06: { code: '6', effect: jssynth_mod.EFFECTS.MOD_VIBRATO_PLUS_VOL_SLIDE },
        0x07: { code: '7', effect: jssynth_mod.EFFECTS.MOD_TREMOLO },
        0x08: { code: '8', effect: jssynth_mod.EFFECTS.MOD_PAN },
        0x09: { code: '9', effect: jssynth_mod.EFFECTS.MOD_SAMPLE_OFFSET },
        0x0a: { code: 'a', effect: jssynth_mod.EFFECTS.MOD_VOLUME_SLIDE },
        0x0b: { code: 'b', effect: jssynth_mod.EFFECTS.MOD_JUMP_TO_PATTERN },
        0x0c: { code: 'c', effect: jssynth_mod.EFFECTS.MOD_SET_VOLUME },
        0x0d: { code: 'd', effect: jssynth_mod.EFFECTS.MOD_PATTERN_BREAK },
        0x0e: { code: 'e', effect: jssynth_mod.EFFECTS.MOD_PROTRACKER },
        0x0f: { code: 'f', effect: jssynth_mod.EFFECTS.MOD_SET_SPEED },
        0x10: { code: 'g', effect: TEMPLATE_EFFECT },
        0x11: { code: 'h', effect: TEMPLATE_EFFECT },
        0x12: { code: 'i', effect: TEMPLATE_EFFECT },
        0x13: { code: 'j', effect: TEMPLATE_EFFECT },
        0x14: { code: 'k', effect: TEMPLATE_EFFECT },
        0x15: { code: 'l', effect: TEMPLATE_EFFECT },
        0x16: { code: 'm', effect: TEMPLATE_EFFECT },
        0x17: { code: 'n', effect: TEMPLATE_EFFECT },
        0x18: { code: 'o', effect: TEMPLATE_EFFECT },
        0x19: { code: 'p', effect: TEMPLATE_EFFECT },
        0x1a: { code: 'q', effect: TEMPLATE_EFFECT },
        0x1b: { code: 'r', effect: TEMPLATE_EFFECT },
        0x1c: { code: 's', effect: TEMPLATE_EFFECT },
        0x1d: { code: 't', effect: TEMPLATE_EFFECT },
        0x1e: { code: 'u', effect: TEMPLATE_EFFECT },
        0x1f: { code: 'v', effect: TEMPLATE_EFFECT },
        0x20: { code: 'w', effect: TEMPLATE_EFFECT },
        0x21: { code: 'x', effect: TEMPLATE_EFFECT },
        0x22: { code: 'y', effect: TEMPLATE_EFFECT },
        0x23: { code: 'z', effect: TEMPLATE_EFFECT },

        /* protracker commands */
        0xe0: jssynth_mod.EFFECTS.MOD_PT_SET_FILTER,
        0xe1: jssynth_mod.EFFECTS.MOD_PT_FINE_PORTA_UP,
        0xe2: jssynth_mod.EFFECTS.MOD_PT_FINE_PORTA_DOWN,
        0xe3: jssynth_mod.EFFECTS.MOD_PT_GLISSANDO_CONTROL,
        0xe4: jssynth_mod.EFFECTS.MOD_PT_SET_VIBRATO_WAVEFORM,
        0xe5: jssynth_mod.EFFECTS.MOD_PT_SET_FINETUNE,
        0xe6: jssynth_mod.EFFECTS.MOD_PT_PATTERN_LOOP,
        0xe7: jssynth_mod.EFFECTS.MOD_PT_SET_TREMOLO_WAVEFORM,
        0xe8: jssynth_mod.EFFECTS.MOD_PT_16_POS_PAN,
        0xe9: jssynth_mod.EFFECTS.MOD_PT_RETRIG_NOTE,
        0xea: jssynth_mod.EFFECTS.MOD_PT_FINE_VOLSLIDE_UP,
        0xeb: jssynth_mod.EFFECTS.MOD_PT_FINE_VOLSLIDE_DOWN,
        0xec: jssynth_mod.EFFECTS.MOD_PT_CUT_NOTE,
        0xed: jssynth_mod.EFFECTS.MOD_PT_DELAY_NOTE,
        0xee: jssynth_mod.EFFECTS.MOD_PT_DELAY_PATTERN,
        0xef: jssynth_mod.EFFECTS.MOD_PT_INVERT_LOOP
    };

    /*
     * ======================================== PLAYER ===========================================
     */

    var FREQ_NTSC = { clock: 7159090.5*4 };
    var FREQ_PAL =  { clock: 7093789.2*4 };


    jssynth_mod.MOD_FINETUNE_TABLE = [ 0, 1, 2, 3, 4, 5, 6, 7, -8, -7, -6, -5, -4, -3, -2, -1 ];

    jssynth_mod.MOD_PERIOD_TABLE = {
        PERIODS: [
            27392,25856,24384,23040,21696,20480,19328,18240,17216,16256,15360,14496,
            13696,12928,12192,11520,10848,10240, 9664, 9120, 8608, 8128, 7680, 7248,
            6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3624,
            3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1812,
            1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016,  960,  906,
            856,  808,  762,  720,  678,  640,  604,  570,  538,  508,  480,  453,
            428,  404,  381,  360,  339,  320,  302,  285,  269,  254,  240,  226,
            214,  202,  190,  180,  170,  160,  151,  143,  135,  127,  120,  113,
            107,  101,   95,   90,   85,   80,   75,   71,   67,   63,   60,   56
        ],
        NOTE_NAMES: [
            "C-0", "C#0", "D-0", "D#0", "E-0", "F-0", "F#0", "G-0", "G#0", "A-0", "A#0", "B-0",
            "C-1", "C#1", "D-1", "D#1", "E-1", "F-1", "F#1", "G-1", "G#1", "A-1", "A#1", "B-1",
            "C-2", "C#2", "D-2", "D#2", "E-2", "F-2", "F#2", "G-2", "G#2", "A-2", "A#2", "B-2",
            "C-3", "C#3", "D-3", "D#3", "E-3", "F-3", "F#3", "G-3", "G#3", "A-3", "A#3", "B-3",
            "C-4", "C#4", "D-4", "D#4", "E-4", "F-4", "F#4", "G-4", "G#4", "A-4", "A#4", "B-4",
            "C-5", "C#5", "D-5", "D#5", "E-5", "F-5", "F#5", "G-5", "G#5", "A-5", "A#5", "B-5",
            "C-6", "C#6", "D-6", "D#6", "E-6", "F-6", "F#6", "G-6", "G#6", "A-6", "A#6", "B-6",
            "C-7", "C#7", "D-7", "D#7", "E-7", "F-7", "F#7", "G-7", "G#7", "A-7", "A#7", "B-7",
            "C-8", "C#8", "D-8", "D#8", "E-8", "F-8", "F#8", "G-8", "G#8", "A-8", "A#8", "B-8"
        ],
        getNote : function (period) {
            var i = 0;
            if (period <= 0) {
                return -1;
            }
            for (i = 0; i < jssynth_mod.MOD_PERIOD_TABLE.PERIODS.length - 1; i++) {
                var p = jssynth_mod.MOD_PERIOD_TABLE.PERIODS[i];
                var p1 = jssynth_mod.MOD_PERIOD_TABLE.PERIODS[i+1];
                if (Math.abs(p - period) < Math.abs(p1 - period)) {
                    return i;
                }
            }
            return -1;
        },
        getPeriod : function(note) {
            return jssynth_mod.MOD_PERIOD_TABLE.PERIODS[note] || -1;
        },
        getName : function(note) {
            if (note == 254) {
                return "oFF";
            } else {
                return jssynth_mod.MOD_PERIOD_TABLE.NOTE_NAMES[note] || "---";
            }
        }

    };

    var Amiga_Lowpass_Filter_3300_12dB_per_octave = function() {
        var NZEROS = 2;
        var NPOLES = 2;
        var GAIN = 24.33619312;

        var xv = [ 0, 0, 0 ], yv = [0, 0, 0];

        this.next = function(sample) {
            xv[0] = xv[1]; xv[1] = xv[2];
            xv[2] = sample / GAIN;
            yv[0] = yv[1]; yv[1] = yv[2];
            yv[2] = (xv[0] + xv[2]) + 2 * xv[1]
                + ( -0.5147540757 * yv[0] ) + ( 1.3503898310 * yv[1]);
            return yv[2];
        };
    };

    var AMIGA_FILTERS = [ new Amiga_Lowpass_Filter_3300_12dB_per_octave(), new Amiga_Lowpass_Filter_3300_12dB_per_octave() ];

    jssynth_mod.Player = function(mixer) {

        this.playing = true;
        this.loggingEnabled = false;
        this.song = null;

        this.stateCallback = null;



        /*
         * SONG PLAYER ...
         */

        this.mixer = mixer;


        this.mixer.setPreMixCallback(this.preSampleMix, this);

    };

    jssynth_mod.Player.prototype.setSong = function(song) {
        this.song = song;
        this.effectMap = song.effectMap || jssynth_mod.MOD_EFFECT_MAP;
        this.playerState = {
            freq: song.defaultFreq || FREQ_PAL,

            pos: 0,
            row: -1,
            tick: 6,
            speed: song.initialSpeed || 6,
            bpm: song.initialBPM || 125,
            globalVolume: song.globalVolume || 64,
            patternDelay: 0,
            glissandoControl: 0,  /* 1 means that slides are locked to note values */
            breakToRow: null,
            jumpToPattern: null,
            l_breakToRow: null,  /* for pattern loop */
            l_jumpToPattern: null,
            fastS3MVolumeSlides: song.fastS3MVolumeSlides || false,
            filter: 0
        };

        var defaultPanPos = song.defaultPanPos || [ -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8];
        this.channelState = [];
        for (var i = 0; i < song.channels; i++) {
            this.channelState[i] = {
                chan: i,
                panPos: defaultPanPos[i],
                volume: 64,
                lastVolume: undefined,  /* last officially set volume - base volume for tremolo */
                period: 0,
                pitchOfs: 1,
                lastPeriod: 0,  /* last officially set period - base period for vibrato */
                effect: 0,
                effectParameter: 0,
                effectState: {
                    tremorCount: 0,
                    tremorParam: 0,
                    arpPos: 0,
                    noteDelay: -1,
                    vibratoParams: {
                        waveform: 0,
                        pos: 0,
                        depth: 0,
                        speed: 0
                    },
                    tremoloParams: {
                        waveform: 0,
                        pos: 0,
                        depth: 0,
                        speed: 0
                    },
                    patternLoop: {
                        row: 0,
                        count: null
                    },
                    invertLoop: {
                        pos: 0,
                        delay: 0,
                        sample: null
                    }
                }
            };
            this.mixer.setPanPosition(i, this.channelState[i].panPos);
        }

    }

    jssynth_mod.Player.prototype.start = function() {
        this.playing = true;
    };

    jssynth_mod.Player.prototype.stop = function() {
        // stop any further notes from being played
        this.playing = false;

        // and cut output from all song player related channels
        for (var chan = 0; chan < this.song.channels; chan++) {
            this.mixer.cut(chan);
        }
    }

    jssynth_mod.Player.prototype.preSampleMix = function(mixer, sampleRate) {
        if (!this.playing) {
            return;
        }
        var state = this.playerState;
        var song = this.song;
        if (state.patternDelay > 0) {
            state.patternDelay--;
            this.handleTick(song.patterns[song.orders[state.pos]][state.row], state.tick, sampleRate);
        } else {
            if (state.tick == 0) {
                if (this.stateCallback) {
                    this.stateCallback(this.playerState, this.channelState);
                }
                this.handleDiv(song.patterns[song.orders[state.pos]][state.row], sampleRate);
            } else {
                this.handleTick(song.patterns[song.orders[state.pos]][state.row], state.tick, sampleRate);
            }
            this.advanceTick();
        }
        if (state.tick === 0) {
            /*
             * l_jumpToPattern and l_breakToRow are used for pattern loops;
             * these are processed _before_ normal jump to pattern/row commands
             */
            if (state.l_jumpToPattern !== null) {
                state.jumpToPattern = state.l_jumpToPattern;
                state.breakToRow = state.l_breakToRow;
                state.l_jumpToPattern = null;
                state.l_breakToRow = null;
            }
            if (state.jumpToPattern !== null) {
                state.pos = state.jumpToPattern;
                state.jumpToPattern = null;
                if (state.breakToRow !== null) {
                    state.row = state.breakToRow;
                    state.breakToRow = null;
                } else {
                    state.row = 0;
                }
            }
            if (state.breakToRow !== null) {
                if (state.row !== 0) {
                    this.advancePos();
                }
                state.row = state.breakToRow;
                state.breakToRow = null;
            }
        }
        if (this.playerState.filter > 0) {
            this.mixer.setFilters(AMIGA_FILTERS);
        } else {
            this.mixer.setFilters(null);
        }
        this.mixer.setGlobalVolume(state.globalVolume);
        this.mixer.setSecondsPerMix(1 / (state.bpm * 2 / 5));
    };

    /**
     * Jump to the next position in the song
     */
    jssynth_mod.Player.prototype.nextPos = function() {
        this.advancePos();
        this.playerState.row = 0;
        this.playerState.tick = 0;
    };

    /**
     * Jump to the previous position in the song
     */
    jssynth_mod.Player.prototype.previousPos = function() {
        this.decrementPos();
        this.playerState.row = 0;
        this.playerState.tick = 0;
    };

    jssynth_mod.Player.prototype.advancePos = function() {
        var state = this.playerState;
        var song = this.song;

        do {
            state.pos = state.pos + 1;
        } while (song.orders[state.pos] == 254)

        if (state.pos >= song.songLength || song.orders[state.pos] == 255) {
            state.pos = 0;
        }
    };
    jssynth_mod.Player.prototype.decrementPos = function() {
        var state = this.playerState;
        var song = this.song;

        do {
            state.pos -= 1;
        } while (song.orders[state.pos] == 254);

        if (state.pos < 0) {
            state.pos = song.songLength;
            do {
                state.pos -= 1;
            } while (song.orders[state.pos] == 254);
        }
    };

    jssynth_mod.Player.prototype.advanceRow = function() {
        var state = this.playerState;
        var song = this.song;

        var numRows = song.patterns[song.orders[state.pos]].length;
        state.row = state.row + 1;

        if (state.row >= numRows) {
            var chan;
            for (chan = 0; chan < song.channels; chan++) {
                this.channelState[chan].effectState.patternLoop.row = 0;
            }
            state.row = 0;
            this.advancePos();
        }
    };

    jssynth_mod.Player.prototype.advanceTick = function() {
        var state = this.playerState;
        state.tick += 1;
        if (state.tick >= state.speed) {
            state.tick = 0;
            this.advanceRow();
        }
    };

    jssynth_mod.Player.prototype.handleTick = function(row, tick, sampleRate) {
        for (var chan = 0; chan < this.song.channels; chan++) {
            var chanState = this.channelState[chan];
            var effectParameter = chanState.effectParameter;
            var effectHandler = chanState.effect;
            var volumeEffectHandler = null, volumeEffectParameter = null;
            if (row && row[chan] && row[chan].volumeEffect) {
                volumeEffectHandler = this.effectMap[row[chan].volumeEffect].effect;
                volumeEffectParameter = row[chan].volumeEffectParameter;
            }
            if (volumeEffectHandler) {
                volumeEffectHandler.tick(this.mixer, chan, volumeEffectParameter, this.playerState, chanState, null, null, this.song);
            }
            if (effectHandler) {
                effectHandler.tick(this.mixer, chan, effectParameter, this.playerState, chanState, null, null, this.song);
            }
            var periodToPlay = chanState.period;
            if (this.playerState.glissandoControl > 0) {
                var noteNum = jssynth_mod.MOD_PERIOD_TABLE.getNote(periodToPlay);
                periodToPlay = jssynth_mod.MOD_PERIOD_TABLE.getPeriod(noteNum);
            }
            var freqHz = (this.playerState.freq.clock / (periodToPlay * 2)) * chanState.pitchOfs;
            this.mixer.setFrequency(chan, freqHz);
            this.mixer.setVolume(chan, chanState.volume);
        }
    };

    jssynth_mod.Player.prototype.handleNote = function(chan, note, sampleRate) {
        var parms = this.channelState[chan];
        var period = 0;
        if (note.note > 0 && note.note !== 254) {
            period = jssynth_mod.MOD_PERIOD_TABLE.getPeriod(note.note);
        }
        var sampleNumber = note.sampleNumber - 1;
        parms.effectParameter = note.parameter;
        var effectHandler = this.effectMap[note.effect].effect;
        var volumeEffectHandler = null, volumeEffectParameter = null;
        if (note.volumeEffect) {
            volumeEffectHandler = this.effectMap[note.volumeEffect].effect;
            volumeEffectParameter = note.volumeEffectParameter;
        }
        if (!effectHandler && this.loggingEnabled) {
            console.log("no effect handler for effect "+note.effect.toString(16)+"/"+note.parameter.toString(16));
        }
        parms.effect = effectHandler;

        if (sampleNumber >= 0 && this.song.instruments[sampleNumber]) {

            var instrument = this.song.instruments[sampleNumber];

            var noteToPlay = note.note;
            if (noteToPlay < 0) {
                noteToPlay = jssynth_mod.MOD_PERIOD_TABLE.getNote(parms.period);
            }
            if (noteToPlay > 0) {
                var sampleNum = instrument.metadata.noteToSampleMap[noteToPlay];
                var sample = instrument.samples[sampleNum];

                // set sample (& volume)
                this.mixer.setSample(chan, sample);

                parms.pitchOfs = sample.metadata.pitchOfs || 1;
                if ((effectHandler && effectHandler.allowVolumeChange === true) || !effectHandler) {
                    parms.volume = sample.metadata.volume;
                    parms.lastVolume = sample.metadata.volume;
                }
            }

        }
        if (period > 0) {
            if ((effectHandler && effectHandler.allowPeriodChange === true) || !effectHandler) {
                parms.period = period;
                parms.lastPeriod = period;
                if ((effectHandler && effectHandler.allowSampleTrigger === true) || !effectHandler) {
                    this.mixer.setSamplePosition(chan, 0);
                }
            }
        }
        var volume = note.volume;
        if (volume >= 0) {
            if ((effectHandler && effectHandler.allowVolumeChange === true) || !effectHandler) {
                parms.volume = volume;
                parms.lastVolume = volume;
            }
        }
        if (note.note === 254) {  // 254 means note off
            this.mixer.cut(chan);
        }
        if (volumeEffectHandler) {
            volumeEffectHandler.div(this.mixer, chan, volumeEffectParameter, this.playerState, parms, period, note, this.song);
        }
        if (effectHandler) {
            effectHandler.div(this.mixer, chan, parms.effectParameter, this.playerState, parms, period, note, this.song);
        }
        var periodToPlay = parms.period;
        if (this.playerState.glissandoControl > 0) {
            var noteNum = jssynth_mod.MOD_PERIOD_TABLE.getNote(periodToPlay);
            periodToPlay = jssynth_mod.MOD_PERIOD_TABLE.getPeriod(noteNum);
        }

        this.mixer.setVolume(chan, parms.volume);
        var freqHz = this.playerState.freq.clock / (periodToPlay * 2) * parms.pitchOfs;
        this.mixer.setFrequency(chan, freqHz);

    };



    jssynth_mod.Player.prototype.handleDiv = function(row, sampleRate) {
        if (this.loggingEnabled) {
            console.log(this.rowToText(row));
        }
        for (var chan = 0; chan < this.song.channels; chan++) {
            var note = row[chan];
            this.handleNote(chan, note, sampleRate);
        }
    };


    jssynth_mod.Player.prototype.rowToText = function(row) {
        var chan, text = "" + ("000"+this.playerState.pos.toString(16)).slice(-3) + "/" + ("00"+this.playerState.row.toString(16)).slice(-2) + ": | ";
        for (chan = 0; chan < this.song.channels; chan++) {
            var note = row[chan];
            if (note.note > 0) {
                text = text + jssynth_mod.MOD_PERIOD_TABLE.getName(note.note) + " ";
            } else {
                text = text + "--- ";
            }
            if (note.sampleNumber > 0) {
                text = text + ("0"+note.sampleNumber.toString(16)).slice(-2) + " ";
            } else {
                text = text + "-- ";
            }
            if (note.volume > 0) {
                text = text + ("0"+note.volume.toString(16)).slice(-2) + " ";
            } else {
                text = text + "-- ";
            }

            text = text + this.effectMap[note.effect].code + " ";
            text = text + ("0"+note.parameter.toString(16)).slice(-2);
            text = text + " | ";
        }
        return text;
    };

    jssynth_mod.Player.prototype.registerCallback = function(callback) {
        this.stateCallback = callback;
    };


    /* =========== MOD reader ================= */
    jssynth_mod.MODTypes = {
        'M.K.': { key: 'M.K.', channels: 4, instruments: 31 },
        'M!K!': { key: 'M!K!', channels: 4, instruments: 31 },
        'FLT4': { key: 'FLT4', channels: 4, instruments: 31 },
        '4CHN': { key: '4CHN', channels: 4, instruments: 31 },
        '6CHN': { key: '6CHN', channels: 6, instruments: 31 },
        'FLT8': { key: 'FLT8', channels: 8, instruments: 31 },
        '8CHN': { key: '8CHN', channels: 8, instruments: 31 },
        '16CH': { key: '16CH', channels: 16, instruments: 31 }
    };

    var EIGHTH_SEMITONE_MULTIPLIER = Math.pow(2, 1/(12*8));


    jssynth_mod.readMODfile = function (data) {
        var readWord = function (ofs) {
            return (data.charCodeAt(ofs) * 256 + data.charCodeAt(ofs + 1) );
        };
        var modType = data.substring(1080, 1084);
        var modTypeData = jssynth_mod.MODTypes[modType] || { key: 'NOIS', channels: 4, instruments: 15 };
        var song = {};

        song.name = data.substring(0, 20);
        song.type = modTypeData.key;
        song.channels = modTypeData.channels;

        song.effectMap = jssynth_mod.MOD_EFFECT_MAP;
        var songLengthPos = 20 + (30 * modTypeData.instruments);

        song.songLength = data.charCodeAt(songLengthPos);
        song.orders = [];
        var maxPatternNum = 0;
        for (var i = 0; i < 128; i++) {
            song.orders[i] = data.charCodeAt(songLengthPos + 2 + i);
            if (song.orders[i] > maxPatternNum) {
                maxPatternNum = song.orders[i];
            }
        }

        var patternOfs = songLengthPos + 130;
        if (modTypeData.instruments > 15) {
            patternOfs += 4;
        }

        song.patterns = [];
        for (var i = 0; i <= maxPatternNum; i++) {
            var pattern = [];
            var ofs = patternOfs + (64 * 4 * modTypeData.channels * i);
            var row;
            for (row = 0; row < 64; row++) {
                var rowData = [];
                var chan;
                for (chan = 0; chan < modTypeData.channels; chan++) {
                    var note = { };
                    var chanOfs = ofs + (row * 4 * modTypeData.channels) + chan * 4;
                    var b1 = data.charCodeAt(chanOfs);
                    var b2 = data.charCodeAt(chanOfs + 1);
                    var b3 = data.charCodeAt(chanOfs + 2);
                    var b4 = data.charCodeAt(chanOfs + 3);
                    note.sampleNumber = (b1 & 0xf0) + ((b3 & 0xf0) / 16);
                    var period = (((b1 & 0x0f) * 256) + b2) * 4;
                    note.note = (period === 0) ? -1 : jssynth_mod.MOD_PERIOD_TABLE.getNote(period);
                    note.effect = b3 & 0x0f;
                    note.parameter = b4;
                    note.volume=-1;
                    rowData.push(note);
                }
                pattern.push(rowData);
            }
            song.patterns.push(pattern);
        }

        var sampleOfs = patternOfs + (64 * 4 * modTypeData.channels * (maxPatternNum + 1));

        var modInstruments = [];

        for (var i = 0; i < modTypeData.instruments; i++) {
            var insOffset = 20 + 30 * i;

            var sampleLength = readWord(insOffset + 22) * 2;
            var repeatLength = readWord(insOffset + 28) * 2;
            var sampleName = data.substring(insOffset, insOffset + 22);
            var sample = new jssynth_core.Sample(data, {
                name: sampleName,
                bits: 8,
                channels: 1,
                signed: true,
                sampleRate: 44100,
                representedFreq: 44100 * Math.pow(EIGHTH_SEMITONE_MULTIPLIER, jssynth_mod.MOD_FINETUNE_TABLE[data.charCodeAt(insOffset + 24)]),
                sampleLength: sampleLength,
                volume: data.charCodeAt(insOffset + 25),
                repeatType: repeatLength > 2 ? 'REP_NORMAL' : 'NON_REPEATING',
                repeatStart: readWord(insOffset + 26) * 2,
                repeatEnd: readWord(insOffset + 26) * 2 + repeatLength
            }, sampleOfs);
            sampleOfs += sampleLength;

            modInstruments[i] = new jssynth_core.Instrument({name: sampleName, numSamples: 1}, [sample]);
        }
        song.instruments = modInstruments;

        return song;
    };


    return jssynth_mod;
}));