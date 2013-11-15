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

    var FREQ_NTSC = { clock: 7159090.5*4 };
    var FREQ_PAL =  { clock: 7093789.2*4 };


    jssynth.MOD.MOD_FINETUNE_TABLE = [ 0, 1, 2, 3, 4, 5, 6, 7, -8, -7, -6, -5, -4, -3, -2, -1 ];

    jssynth.MOD.MOD_PERIOD_TABLE = {
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
            for (i = 0; i < jssynth.MOD.MOD_PERIOD_TABLE.PERIODS.length - 1; i++) {
                var p = jssynth.MOD.MOD_PERIOD_TABLE.PERIODS[i];
                var p1 = jssynth.MOD.MOD_PERIOD_TABLE.PERIODS[i+1];
                if (Math.abs(p - period) < Math.abs(p1 - period)) {
                    return i;
                }
            }
            return -1;
        },
        getPeriod : function(note) {
            return jssynth.MOD.MOD_PERIOD_TABLE.PERIODS[note] || -1;
        },
        getName : function(note) {
            if (note == 254) {
                return "oFF";
            } else {
                return jssynth.MOD.MOD_PERIOD_TABLE.NOTE_NAMES[note] || "---";
            }
        }

    }

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
        }
    }

    var AMIGA_FILTERS = [ new Amiga_Lowpass_Filter_3300_12dB_per_octave(), new Amiga_Lowpass_Filter_3300_12dB_per_octave() ];

    jssynth.MOD.Player = function(song, extraChannels) {

        this.loggingEnabled = false;
        this.song = song;

        this.stateCallback = null;

        this.effectMap = song.effectMap || jssynth.MOD.MOD_EFFECT_MAP;

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

        /*
         * SONG PLAYER ...
         */

        var bufferChannels = extraChannels || 2;
        this.mixer = new jssynth.Mixer({numChannels: (this.song.channels + bufferChannels), volume: this.playerState.globalVolume});

        this.channelState = [];
        for (var i = 0; i < (song.channels + extraChannels); i++) {
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

        this.mixer.setPreMixCallback(this.preSampleMix, this);

    }

    jssynth.MOD.Player.prototype.getMixer = function() {
        return this.mixer;
    }

    jssynth.MOD.Player.prototype.preSampleMix = function(mixer, sampleRate) {
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
    }

    /**
     * Jump to the next position in the song
     */
    jssynth.MOD.Player.prototype.nextPos = function() {
        this.advancePos();
        this.playerState.row = 0;
        this.playerState.tick = 0;
    }

    /**
     * Jump to the previous position in the song
     */
    jssynth.MOD.Player.prototype.previousPos = function() {
        this.decrementPos();
        this.playerState.row = 0;
        this.playerState.tick = 0;
    }

    jssynth.MOD.Player.prototype.advancePos = function() {
        var state = this.playerState;
        var song = this.song;

        do {
            state.pos = state.pos + 1;
        } while (song.orders[state.pos] == 254)

        if (state.pos >= song.songLength || song.orders[state.pos] == 255) {
            state.pos = 0;
        }
    }
    jssynth.MOD.Player.prototype.decrementPos = function() {
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
    }

    jssynth.MOD.Player.prototype.advanceRow = function() {
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
    }

    jssynth.MOD.Player.prototype.advanceTick = function() {
        var state = this.playerState;
        state.tick += 1;
        if (state.tick >= state.speed) {
            state.tick = 0;
            this.advanceRow();
        }
    }

    jssynth.MOD.Player.prototype.handleTick = function(row, tick, sampleRate) {
        for (var chan = 0; chan < this.song.channels; chan++) {
            var chanState = this.channelState[chan];
            var effectParameter = chanState.effectParameter;
            var effectHandler = chanState.effect;
            var volumeEffectHandler, volumeEffectParameter;
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
                var noteNum = jssynth.MOD.MOD_PERIOD_TABLE.getNote(periodToPlay);
                periodToPlay = jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(noteNum);
            }
            var freqHz = (this.playerState.freq.clock / (periodToPlay * 2)) * chanState.pitchOfs;
            this.mixer.setFrequency(chan, freqHz);
            this.mixer.setVolume(chan, chanState.volume);
        }
    }

    jssynth.MOD.Player.prototype.handleNote = function(chan, note, sampleRate) {
        var parms = this.channelState[chan];
        var period = 0;
        if (note.note > 0 && note.note !== 254) {
            period = jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(note.note);
        }
        var sampleNumber = note.sampleNumber - 1;
        parms.effectParameter = note.parameter;
        var effectHandler = this.effectMap[note.effect].effect;
        var volumeEffectHandler, volumeEffectParameter;
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
                noteToPlay = jssynth.MOD.MOD_PERIOD_TABLE.getNote(parms.period);
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
            volumeEffectHandler.div(this.mixer, chan, volumeEffectParameter, this.playerState, parms, period, note, song);
        }
        if (effectHandler) {
            effectHandler.div(this.mixer, chan, parms.effectParameter, this.playerState, parms, period, note, song);
        }
        var periodToPlay = parms.period;
        if (this.playerState.glissandoControl > 0) {
            var noteNum = jssynth.MOD.MOD_PERIOD_TABLE.getNote(periodToPlay);
            periodToPlay = jssynth.MOD.MOD_PERIOD_TABLE.getPeriod(noteNum);
        }

        this.mixer.setVolume(chan, parms.volume);
        var freqHz = this.playerState.freq.clock / (periodToPlay * 2) * parms.pitchOfs;
        this.mixer.setFrequency(chan, freqHz);

    }



    jssynth.MOD.Player.prototype.handleDiv = function(row, sampleRate) {
        if (this.loggingEnabled) {
            console.log(this.rowToText(row));
        }
        for (var chan = 0; chan < this.song.channels; chan++) {
            var note = row[chan];
            this.handleNote(chan, note, sampleRate);
        }
    }


    jssynth.MOD.Player.prototype.rowToText = function(row) {
        var text = "" + ("000"+this.playerState.pos.toString(16)).slice(-3) + "/" + ("00"+this.playerState.row.toString(16)).slice(-2) + ": | ";
        for (chan = 0; chan < this.song.channels; chan++) {
            var note = row[chan];
            if (note.note > 0) {
                text = text + jssynth.MOD.MOD_PERIOD_TABLE.getName(note.note) + " ";
            } else {
                text = text + "--- "
            }
            if (note.sampleNumber > 0) {
                text = text + ("0"+note.sampleNumber.toString(16)).slice(-2) + " ";
            } else {
                text = text + "-- "
            }
            if (note.volume > 0) {
                text = text + ("0"+note.volume.toString(16)).slice(-2) + " ";
            } else {
                text = text + "-- "
            }

            text = text + this.effectMap[note.effect].code + " ";
            text = text + ("0"+note.parameter.toString(16)).slice(-2);
            text = text + " | ";
        }
        return text;
    }

    jssynth.MOD.Player.prototype.registerCallback = function(callback) {
        this.stateCallback = callback;
    }


})();

