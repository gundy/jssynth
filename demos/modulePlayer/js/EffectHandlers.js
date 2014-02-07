/*

 Copyright (c) 2013 David Gundersen

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions
 of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */
(function() {
    jssynth.ns("MOD");
    jssynth.ns("S3M");
    jssynth.ns("XM");

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

    jssynth.MOD.EFFECTS = {
        'MOD_ARPEGGIO': jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                var currentNote = jssynth.MOD.MOD_PERIOD_TABLE.getNote(channelState.lastPeriod);
                if (param != 0x00) {
                    if (currentNote < 0 || currentNote > 108) {
                        channelState.effectState.arpTable = [ channelState.period, channelState.period, channelState.period];
                    } else {
                        var a = (param & 0xf0) / 16;
                        var b = (param & 0x0f);
                        channelState.effectState.arpTable = [
                            jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(currentNote),
                            jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(currentNote+a),
                            jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(currentNote+b)
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
        'MOD_PORTA_UP': jssynth.merge(TEMPLATE_EFFECT, {
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
        'MOD_PORTA_DOWN': jssynth.merge(TEMPLATE_EFFECT, {
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
        'MOD_PORTA_TO_NOTE': jssynth.merge(TEMPLATE_EFFECT, {
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
        'MOD_VIBRATO': jssynth.merge(TEMPLATE_EFFECT, {
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
        'MOD_PORTA_PLUS_VOL_SLIDE': jssynth.merge(TEMPLATE_EFFECT, {
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
                jssynth.MOD.EFFECTS.MOD_PORTA_TO_NOTE.tick(mixer, chan, param, playerState, channelState);
                jssynth.MOD.EFFECTS.MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
            },
            allowPeriodChange: false
        }),
        'MOD_VIBRATO_PLUS_VOL_SLIDE': jssynth.merge(TEMPLATE_EFFECT, {
            div:function() {
            },
            tick: function(mixer, chan, param, playerState, channelState) {
                jssynth.MOD.EFFECTS.MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
                jssynth.MOD.EFFECTS.MOD_VIBRATO.tick(mixer, chan, param, playerState, channelState);
            }
        }),
        'MOD_TREMOLO': jssynth.merge(TEMPLATE_EFFECT, {
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
        MOD_PAN: jssynth.merge(TEMPLATE_EFFECT, {
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
        MOD_SAMPLE_OFFSET: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                mixer.setSamplePosition(chan, param * 256);
            }
        }),
        MOD_VOLUME_SLIDE: jssynth.merge(TEMPLATE_EFFECT, {
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
        MOD_JUMP_TO_PATTERN: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.jumpToPattern = param;
            }
        }),
        MOD_SET_VOLUME: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                channelState.volume = param < 0 ? 0 : param > 0x40 ? 0x40 : param;
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PATTERN_BREAK: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                var x = ((param & 0xf0) / 16);
                var y = param & 0x0f;
                var newRow = x * 10 + y;
                playerState.breakToRow = newRow;
            }
        }),
        MOD_PROTRACKER: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var newEffect = 0xe0 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth.MOD.MOD_EFFECT_MAP[newEffect].div(mixer, chan, newParam, playerState, channelState, period, note, song);
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var newEffect = 0xe0 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth.MOD.MOD_EFFECT_MAP[newEffect].tick(mixer, chan, newParam, playerState, channelState);
            }
        }),
        MOD_PT_SET_FILTER: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period) {
                playerState.filter = param;
            }
        }),
        MOD_PT_FINE_PORTA_UP: jssynth.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                channelState.period -= param * 4;
                channelState.lastPeriod = channelState.period;
            }
        }),
        MOD_PT_FINE_PORTA_DOWN: jssynth.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                channelState.period += param * 4;
                channelState.lastPeriod = channelState.period;
            }
        }),
        MOD_PT_GLISSANDO_CONTROL: jssynth.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                playerState.glissandoControl = param;
            }
        }),
        MOD_PT_SET_VIBRATO_WAVEFORM: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.effectParams.vibratoParams.waveform = param & 0x07;
            }
        }),
        MOD_PT_SET_FINETUNE: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                if (note.sampleNumber != 0) {
                    var instrument = song.instruments[note.sampleNumber - 1];
                    instrument.metadata.pitchOfs = Math.pow(EIGHTH_SEMITONE_MULTIPLIER, (param < 8 ? param : (param - 16)));
                }
            }
        }),
        MOD_PT_PATTERN_LOOP: jssynth.merge(TEMPLATE_EFFECT, {
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
        MOD_PT_SET_TREMOLO_WAVEFORM: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.effectState.tremoloParams.waveform = param & 0x07;
            }
        }),
        MOD_PT_16_POS_PAN: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.panPos.left = (15 - param) / 15;
                channelState.panPos.right = param / 15;
            }
        }),
        MOD_PT_RETRIG_NOTE: jssynth.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                if ((playerState.tick + 1) % param == 0) {
                    mixer.setSamplePosition(chan, 0);
                }
            }
        }),
        MOD_PT_FINE_VOLSLIDE_UP: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.volume += param;
                if (channelState.volume >  64) {
                    channelState.volume = 64;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_FINE_VOLSLIDE_DOWN: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState) {
                channelState.volume -= param;
                if (channelState.volume < 0) {
                    channelState.volume = 0;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_CUT_NOTE: jssynth.merge(TEMPLATE_EFFECT, {
            tick:function(mixer, chan, param, playerState, channelState) {
                if (playerState.tick >= param) {
                    channelState.volume = 0;
                }
                channelState.lastVolume = channelState.volume;
            }
        }),
        MOD_PT_DELAY_NOTE: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var noteToPlay = note.note;
                if (noteToPlay < 0) {
                    noteToPlay = jssynth.MOD.MOD_PERIOD_TABLE.getNote(parms.period);
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

                    var period = note.note < 0 ? 0 : jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(note.note);
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
        MOD_PT_DELAY_PATTERN: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState) {
                playerState.patternDelay = param * playerState.speed;
            },
            tick:function(mixer, chan, param, playerState, channelState) {
            }
        }),
        MOD_PT_INVERT_LOOP: jssynth.merge(TEMPLATE_EFFECT, {
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
        MOD_SET_SPEED: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                if (param <= 0x20) {
                    playerState.speed = param;
                } else {
                    playerState.bpm = param;
                }
            }
        }),
        S3M_SET_SPEED: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.speed = param;
            }
        }),
        S3M_SET_TEMPO: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.bpm = param;
            }
        }),
        S3M_VOLUME_SLIDE: jssynth.merge(TEMPLATE_EFFECT, {
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
        S3M_PORTA_DOWN: jssynth.merge(TEMPLATE_EFFECT, {
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
        S3M_PORTA_UP: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState, period) {
                if (param == 0x00) {
                    param = channelState.effectState.lastS3MPortUp || 0x00;
                }
                channelState.effectState.lastS3MPortUp = param;
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
                var slideAmt = channelState.effectState.lastS3MPortUp;
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
        S3M_RETRIG_PLUS_VOLUME_SLIDE: jssynth.merge(TEMPLATE_EFFECT, {
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
        S3M_EXTENDED: jssynth.merge(TEMPLATE_EFFECT, {
            div:function(mixer, chan, param, playerState, channelState, period, note, song) {
                var newEffect = 0x130 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth.S3M.S3M_EFFECT_MAP[newEffect].effect.div(mixer, chan, newParam, playerState, channelState, period, note, song);
            },
            tick:function(mixer, chan, param, playerState, channelState) {
                var newEffect = 0x130 + ((param & 0xf0) / 16);
                var newParam = param & 0x0f;
                jssynth.S3M.S3M_EFFECT_MAP[newEffect].effect.tick(mixer, chan, newParam, playerState, channelState);
            }
        }),
        S3M_FINE_VIBRATO: jssynth.merge(TEMPLATE_EFFECT, {
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
        S3M_TREMOR: jssynth.merge(TEMPLATE_EFFECT, {
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
        S3M_SET_GLOBAL_VOLUME: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                playerState.globalVolume = param;
            }
        }),
        S3M_STEREO_CONTROL: jssynth.merge(TEMPLATE_EFFECT, {
            div: function(mixer, chan, param, playerState, channelState) {
                if (param > 7) {
                    param = param - 16;
                }
                param = param + 8;
                channelState.panPos.left = (15 -  param) / 15;
                channelState.panPos.right = param / 15;
            }
        }),
        XM_GLOBAL_VOLUME_SLIDE: jssynth.merge(TEMPLATE_EFFECT, {
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


    jssynth.MOD.MOD_EFFECT_MAP = {
        0x00: { code: '0', effect: jssynth.MOD.EFFECTS.MOD_ARPEGGIO },
        0x01: { code: '1', effect: jssynth.MOD.EFFECTS.MOD_PORTA_UP },
        0x02: { code: '2', effect: jssynth.MOD.EFFECTS.MOD_PORTA_DOWN },
        0x03: { code: '3', effect: jssynth.MOD.EFFECTS.MOD_PORTA_TO_NOTE },
        0x04: { code: '4', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO },
        0x05: { code: '5', effect: jssynth.MOD.EFFECTS.MOD_PORTA_PLUS_VOL_SLIDE },
        0x06: { code: '6', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO_PLUS_VOL_SLIDE },
        0x07: { code: '7', effect: jssynth.MOD.EFFECTS.MOD_TREMOLO },
        0x08: { code: '8', effect: jssynth.MOD.EFFECTS.MOD_PAN },
        0x09: { code: '9', effect: jssynth.MOD.EFFECTS.MOD_SAMPLE_OFFSET },
        0x0a: { code: 'a', effect: jssynth.MOD.EFFECTS.MOD_VOLUME_SLIDE },
        0x0b: { code: 'b', effect: jssynth.MOD.EFFECTS.MOD_JUMP_TO_PATTERN },
        0x0c: { code: 'c', effect: jssynth.MOD.EFFECTS.MOD_SET_VOLUME },
        0x0d: { code: 'd', effect: jssynth.MOD.EFFECTS.MOD_PATTERN_BREAK },
        0x0e: { code: 'e', effect: jssynth.MOD.EFFECTS.MOD_PROTRACKER },
        0x0f: { code: 'f', effect: jssynth.MOD.EFFECTS.MOD_SET_SPEED },
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
        0xe0: jssynth.MOD.EFFECTS.MOD_PT_SET_FILTER,
        0xe1: jssynth.MOD.EFFECTS.MOD_PT_FINE_PORTA_UP,
        0xe2: jssynth.MOD.EFFECTS.MOD_PT_FINE_PORTA_DOWN,
        0xe3: jssynth.MOD.EFFECTS.MOD_PT_GLISSANDO_CONTROL,
        0xe4: jssynth.MOD.EFFECTS.MOD_PT_SET_VIBRATO_WAVEFORM,
        0xe5: jssynth.MOD.EFFECTS.MOD_PT_SET_FINETUNE,
        0xe6: jssynth.MOD.EFFECTS.MOD_PT_PATTERN_LOOP,
        0xe7: jssynth.MOD.EFFECTS.MOD_PT_SET_TREMOLO_WAVEFORM,
        0xe8: jssynth.MOD.EFFECTS.MOD_PT_16_POS_PAN,
        0xe9: jssynth.MOD.EFFECTS.MOD_PT_RETRIG_NOTE,
        0xea: jssynth.MOD.EFFECTS.MOD_PT_FINE_VOLSLIDE_UP,
        0xeb: jssynth.MOD.EFFECTS.MOD_PT_FINE_VOLSLIDE_DOWN,
        0xec: jssynth.MOD.EFFECTS.MOD_PT_CUT_NOTE,
        0xed: jssynth.MOD.EFFECTS.MOD_PT_DELAY_NOTE,
        0xee: jssynth.MOD.EFFECTS.MOD_PT_DELAY_PATTERN,
        0xef: jssynth.MOD.EFFECTS.MOD_PT_INVERT_LOOP
    };

    jssynth.S3M.S3M_EFFECT_MAP = {
        /* - */  0x00: { code: '-', effect: TEMPLATE_EFFECT },
        /* A */  0x01: { code: 'A', effect: jssynth.MOD.EFFECTS.S3M_SET_SPEED },
        /* B */  0x02: { code: 'B', effect: jssynth.MOD.EFFECTS.MOD_JUMP_TO_PATTERN },
        /* C */  0x03: { code: 'C', effect: jssynth.MOD.EFFECTS.MOD_PATTERN_BREAK },
        /* D */  0x04: { code: 'D', effect: jssynth.MOD.EFFECTS.S3M_VOLUME_SLIDE },  // ???
        /* E */  0x05: { code: 'E', effect: jssynth.MOD.EFFECTS.S3M_PORTA_DOWN },
        /* F */  0x06: { code: 'F', effect: jssynth.MOD.EFFECTS.S3M_PORTA_UP },
        /* G */  0x07: { code: 'G', effect: jssynth.MOD.EFFECTS.MOD_PORTA_TO_NOTE },
        /* H */  0x08: { code: 'H', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO },
        /* I */  0x09: { code: 'I', effect: jssynth.MOD.EFFECTS.S3M_TREMOR },
        /* J */  0x0a: { code: 'J', effect: jssynth.MOD.EFFECTS.MOD_ARPEGGIO },
        /* K */  0x0b: { code: 'K', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO_PLUS_VOL_SLIDE },
        /* L */  0x0c: { code: 'L', effect: jssynth.MOD.EFFECTS.MOD_PORTA_PLUS_VOL_SLIDE },
        /* M */  0x0d: { code: 'M', effect: TEMPLATE_EFFECT },
        /* N */  0x0e: { code: 'N', effect: TEMPLATE_EFFECT },
        /* O */  0x0f: { code: 'O', effect: jssynth.MOD.EFFECTS.MOD_SAMPLE_OFFSET },
        /* P */  0x10: { code: 'P', effect: TEMPLATE_EFFECT },
        /* Q */  0x11: { code: 'Q', effect: jssynth.MOD.EFFECTS.S3M_RETRIG_PLUS_VOLUME_SLIDE },
        /* R */  0x12: { code: 'R', effect: jssynth.MOD.EFFECTS.MOD_TREMOLO },
        /* S */  0x13: { code: 'S', effect: jssynth.MOD.EFFECTS.S3M_EXTENDED },
        /* S0 */0x130: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_SET_FILTER },
        /* S1 */0x131: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_GLISSANDO_CONTROL },
        /* S2 */0x132: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_SET_FINETUNE },
        /* S3 */0x133: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_SET_VIBRATO_WAVEFORM },
        /* S4 */0x134: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_SET_TREMOLO_WAVEFORM },
        /* S5 */0x135: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S6 */0x136: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S7 */0x137: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S8 */0x138: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_16_POS_PAN },
        /* S9 */0x139: { code: 'x', effect: TEMPLATE_EFFECT },
        /* SA */0x13a: { code: 'x', effect: jssynth.MOD.EFFECTS.S3M_STEREO_CONTROL },
        /* SB */0x13b: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_PATTERN_LOOP },
        /* SC */0x13c: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_CUT_NOTE },
        /* SD */0x13d: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_DELAY_NOTE },
        /* SE */0x13e: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_DELAY_PATTERN },
        /* SF */0x13f: { code: 'x', effect: jssynth.MOD.EFFECTS.MOD_PT_INVERT_LOOP }, /* should this be "funk loop"? */
        /* T */  0x14: { code: 'T', effect: jssynth.MOD.EFFECTS.S3M_SET_TEMPO },
        /* U */  0x15: { code: 'U', effect: jssynth.MOD.EFFECTS.S3M_FINE_VIBRATO },
        /* V */  0x16: { code: 'V', effect: jssynth.MOD.EFFECTS.S3M_SET_GLOBAL_VOLUME }

    };


    jssynth.XM.XM_EFFECT_MAP = {
        0x00: { code: '0', effect: jssynth.MOD.EFFECTS.MOD_ARPEGGIO },
        0x01: { code: '1', effect: jssynth.MOD.EFFECTS.MOD_PORTA_UP },
        0x02: { code: '2', effect: jssynth.MOD.EFFECTS.MOD_PORTA_DOWN },
        0x03: { code: '3', effect: jssynth.MOD.EFFECTS.MOD_PORTA_TO_NOTE },
        0x04: { code: '4', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO },
        0x05: { code: '5', effect: jssynth.MOD.EFFECTS.MOD_PORTA_PLUS_VOL_SLIDE },
        0x06: { code: '6', effect: jssynth.MOD.EFFECTS.MOD_VIBRATO_PLUS_VOL_SLIDE },
        0x07: { code: '7', effect: jssynth.MOD.EFFECTS.MOD_TREMOLO },
        0x08: { code: '8', effect: jssynth.MOD.EFFECTS.MOD_PAN },
        0x09: { code: '9', effect: jssynth.MOD.EFFECTS.MOD_SAMPLE_OFFSET },
        0x0a: { code: 'a', effect: jssynth.MOD.EFFECTS.MOD_VOLUME_SLIDE },
        0x0b: { code: 'b', effect: jssynth.MOD.EFFECTS.MOD_JUMP_TO_PATTERN },
        0x0c: { code: 'c', effect: jssynth.MOD.EFFECTS.MOD_SET_VOLUME },
        0x0d: { code: 'd', effect: jssynth.MOD.EFFECTS.MOD_PATTERN_BREAK },
        0x0e: { code: 'e', effect: jssynth.MOD.EFFECTS.MOD_PROTRACKER },
        0x0f: { code: 'f', effect: jssynth.MOD.EFFECTS.MOD_SET_SPEED },
        /*
         G      Set global volume
         H  (*) Global volume slide
         K      Key off
         L      Set envelope position
         P  (*) Panning slide
         R  (*) Multi retrig note
         T      Tremor
         X1 (*) Extra fine porta up
         X2 (*) Extra fine porta down

         */

        0x10: { code: 'G', effect: jssynth.MOD.EFFECTS.S3M_SET_GLOBAL_VOLUME },
        0x11: { code: 'H', effect: jssynth.MOD.EFFECTS.XM_GLOBAL_VOLUME_SLIDE },  // TODO GLOBAL VOLUME SLIDE
        0x12: { code: 'I', effect: TEMPLATE_EFFECT },  // NOTHING
        0x13: { code: 'J', effect: TEMPLATE_EFFECT },  // NOTHING
        0x14: { code: 'K', effect: TEMPLATE_EFFECT },  // TODO KEY OFF
        0x15: { code: 'L', effect: TEMPLATE_EFFECT },  // TODO SET ENVELOPE POSITION
        0x16: { code: 'M', effect: TEMPLATE_EFFECT },  // NOTHING
        0x17: { code: 'N', effect: TEMPLATE_EFFECT },  // NOTHING
        0x18: { code: 'O', effect: TEMPLATE_EFFECT },  // NOTHING
        0x19: { code: 'P', effect: TEMPLATE_EFFECT },  // TODO PANNING SLIDE
        0x1a: { code: 'R', effect: jssynth.MOD.EFFECTS.S3M_RETRIG_PLUS_VOLUME_SLIDE },  // TODO MULTI RETRIG NOTE
        0x1b: { code: 'S', effect: TEMPLATE_EFFECT },  // NOTHING
        0x1c: { code: 'T', effect: jssynth.MOD.EFFECTS.S3M_TREMOR },  // TODO TREMOR
        0x1d: { code: 'U', effect: TEMPLATE_EFFECT },  // NOTHING
        0x1e: { code: 'V', effect: TEMPLATE_EFFECT },  // NOTHING
        0x1f: { code: 'W', effect: TEMPLATE_EFFECT },  // NOTHING
        0x20: { code: 'X', effect: TEMPLATE_EFFECT },  // NOTHING

        /* protracker commands */
        0xe0: jssynth.MOD.EFFECTS.MOD_PT_SET_FILTER,
        0xe1: jssynth.MOD.EFFECTS.MOD_PT_FINE_PORTA_UP,
        0xe2: jssynth.MOD.EFFECTS.MOD_PT_FINE_PORTA_DOWN,
        0xe3: jssynth.MOD.EFFECTS.MOD_PT_GLISSANDO_CONTROL,
        0xe4: jssynth.MOD.EFFECTS.MOD_PT_SET_VIBRATO_WAVEFORM,
        0xe5: jssynth.MOD.EFFECTS.MOD_PT_SET_FINETUNE,
        0xe6: jssynth.MOD.EFFECTS.MOD_PT_PATTERN_LOOP,
        0xe7: jssynth.MOD.EFFECTS.MOD_PT_SET_TREMOLO_WAVEFORM,
        0xe8: jssynth.MOD.EFFECTS.MOD_PT_16_POS_PAN,
        0xe9: jssynth.MOD.EFFECTS.MOD_PT_RETRIG_NOTE,
        0xea: jssynth.MOD.EFFECTS.MOD_PT_FINE_VOLSLIDE_UP,
        0xeb: jssynth.MOD.EFFECTS.MOD_PT_FINE_VOLSLIDE_DOWN,
        0xec: jssynth.MOD.EFFECTS.MOD_PT_CUT_NOTE,
        0xed: jssynth.MOD.EFFECTS.MOD_PT_DELAY_NOTE,
        0xee: jssynth.MOD.EFFECTS.MOD_PT_DELAY_PATTERN,
        0xef: jssynth.MOD.EFFECTS.MOD_PT_INVERT_LOOP
    };

})();