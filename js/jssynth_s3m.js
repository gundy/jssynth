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
}('jssynth_s3m', ['jssynth_mod'], function() {
    "use strict";

    var jssynth_s3m = {};

    var TEMPLATE_EFFECT = {
        div: function(param, playerState, channelState, period) {},
        tick: function(param, playerState, channelState, period) {},
        allowSampleTrigger: true,
        allowVolumeChange: true,
        allowPeriodChange: true
    };
    
    jssynth_s3m.S3M_EFFECT_MAP = {
        /* - */  0x00: { code: '-', effect: TEMPLATE_EFFECT },
        /* A */  0x01: { code: 'A', effect: jssynth_mod.EFFECTS.S3M_SET_SPEED },
        /* B */  0x02: { code: 'B', effect: jssynth_mod.EFFECTS.MOD_JUMP_TO_PATTERN },
        /* C */  0x03: { code: 'C', effect: jssynth_mod.EFFECTS.MOD_PATTERN_BREAK },
        /* D */  0x04: { code: 'D', effect: jssynth_mod.EFFECTS.S3M_VOLUME_SLIDE },  // ???
        /* E */  0x05: { code: 'E', effect: jssynth_mod.EFFECTS.S3M_PORTA_DOWN },
        /* F */  0x06: { code: 'F', effect: jssynth_mod.EFFECTS.S3M_PORTA_UP },
        /* G */  0x07: { code: 'G', effect: jssynth_mod.EFFECTS.MOD_PORTA_TO_NOTE },
        /* H */  0x08: { code: 'H', effect: jssynth_mod.EFFECTS.MOD_VIBRATO },
        /* I */  0x09: { code: 'I', effect: jssynth_mod.EFFECTS.S3M_TREMOR },
        /* J */  0x0a: { code: 'J', effect: jssynth_mod.EFFECTS.MOD_ARPEGGIO },
        /* K */  0x0b: { code: 'K', effect: jssynth_mod.EFFECTS.MOD_VIBRATO_PLUS_VOL_SLIDE },
        /* L */  0x0c: { code: 'L', effect: jssynth_mod.EFFECTS.MOD_PORTA_PLUS_VOL_SLIDE },
        /* M */  0x0d: { code: 'M', effect: TEMPLATE_EFFECT },
        /* N */  0x0e: { code: 'N', effect: TEMPLATE_EFFECT },
        /* O */  0x0f: { code: 'O', effect: jssynth_mod.EFFECTS.MOD_SAMPLE_OFFSET },
        /* P */  0x10: { code: 'P', effect: TEMPLATE_EFFECT },
        /* Q */  0x11: { code: 'Q', effect: jssynth_mod.EFFECTS.S3M_RETRIG_PLUS_VOLUME_SLIDE },
        /* R */  0x12: { code: 'R', effect: jssynth_mod.EFFECTS.MOD_TREMOLO },
        /* S */  0x13: { code: 'S', effect: jssynth_mod.EFFECTS.S3M_EXTENDED },
        /* S0 */0x130: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_SET_FILTER },
        /* S1 */0x131: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_GLISSANDO_CONTROL },
        /* S2 */0x132: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_SET_FINETUNE },
        /* S3 */0x133: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_SET_VIBRATO_WAVEFORM },
        /* S4 */0x134: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_SET_TREMOLO_WAVEFORM },
        /* S5 */0x135: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S6 */0x136: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S7 */0x137: { code: 'x', effect: TEMPLATE_EFFECT },
        /* S8 */0x138: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_16_POS_PAN },
        /* S9 */0x139: { code: 'x', effect: TEMPLATE_EFFECT },
        /* SA */0x13a: { code: 'x', effect: jssynth_mod.EFFECTS.S3M_STEREO_CONTROL },
        /* SB */0x13b: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_PATTERN_LOOP },
        /* SC */0x13c: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_CUT_NOTE },
        /* SD */0x13d: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_DELAY_NOTE },
        /* SE */0x13e: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_DELAY_PATTERN },
        /* SF */0x13f: { code: 'x', effect: jssynth_mod.EFFECTS.MOD_PT_INVERT_LOOP }, /* should this be "funk loop"? */
        /* T */  0x14: { code: 'T', effect: jssynth_mod.EFFECTS.S3M_SET_TEMPO },
        /* U */  0x15: { code: 'U', effect: jssynth_mod.EFFECTS.S3M_FINE_VIBRATO },
        /* V */  0x16: { code: 'V', effect: jssynth_mod.EFFECTS.S3M_SET_GLOBAL_VOLUME }

    };

    jssynth_s3m.readS3Mfile = function (data) {
        var readWord = function (ofs) {
            return (data.charCodeAt(ofs+1) * 256 + data.charCodeAt(ofs) )
        }
        var readByte = function(ofs) {
            return (data.charCodeAt(ofs));
        }

        var s3mHeader = data.substring(0x2c, 0x30);
        if (s3mHeader !== 'SCRM' || readWord(0x1c) !== 0x101a ) {
            console.log("Invalid S3M file");
            return;
        }

        var song = {};
        var numOrders = readWord(0x20);
        var numInstruments = readWord(0x22);
        var numPatterns = readWord(0x24);
        var flags = readWord(0x26);
        var createdWithTrackerVersion = readWord(0x28);
        var fileFormatInformation = readWord(0x2a);

        song.name = data.substring(0, 0x1c);
        song.type = 'S3M';

        var masterVolume = readByte(0x33);
        song.masterVolume = masterVolume & 0x7f;
        song.globalVolume = readByte(0x30);
        song.initialSpeed = readByte(0x31);
        song.initialBPM = readByte(0x32);
        song.defaultFreq = { clock: 7159090.5*4 };  // NTSC
        song.effectMap = jssynth_s3m.S3M_EFFECT_MAP;
        song.fastS3MVolumeSlides = (createdWithTrackerVersion == 0x1300 || (flags && 0x40));

        var channelMap = [];
        var numChannels = 0;

        var defaultPanPos = [];
        var i;
        for (i = 0; i < 32; i++) {
            if ((masterVolume & 0x80) == 0x80) {
                if (i%16 <= 7) {
                    defaultPanPos[i] = -0.8;
                } else {
                    defaultPanPos[i] = 0.8;
                }
            } else {
                console.log("Default pan pos = mono");
                defaultPanPos[i] = 0;
            }
        }

        for (i = 0; i<32; i++) {
            var chanSettings = readByte(0x40+i);
            if (chanSettings !== 255 && chanSettings < 128) {
                console.log("S3M channel "+i+" => "+chanSettings);
                channelMap[i] = numChannels++;
                if (chanSettings <= 7) {
                    defaultPanPos[i] = -0.8;
                } else if (chanSettings >= 8 && chanSettings <= 15) {
                    defaultPanPos[i] = 0.8;
                }
            }
        }
        song.channels = numChannels;

        song.songLength = numOrders;
        song.orders = [];
        var orderCount = 0;
        for (i = 0; i < numOrders; i++) {
            var candidateOrder = readByte(0x60 + i);
            song.orders[i] = candidateOrder;
        }

        var ppOfs = 0x60 + numOrders;
        var instrumentParapointerOfs = ppOfs;
        var patternParapointerOfs = ppOfs + numInstruments * 2;
        var panPosOfs = patternParapointerOfs + numPatterns * 2;

        song.defaultPanPos = [];
        // read pan pos
        var dp = readByte(0x35);
        if (dp == 252) {
            // read default pan positions
            for (i=0; i<32; i++) {
                var pp = readByte(panPosOfs + i);
                var panPos;
                if ((pp & 0x20) == 0x20) {
                    panPos = defaultPanPos[i];
                } else {
                    var pp2 = pp & 0x0f;
                    panPos = (pp2 - 7.5)/7.5;
                    console.info("Pan pos channel "+i+" = "+panPos);
                }
                song.defaultPanPos[channelMap[i]] = panPos;
            }
        } else {
            for (i=0; i<32; i++) {
                song.defaultPanPos[channelMap[i]] = defaultPanPos[i];
            }
        }



        song.patterns = [];
        for (i = 0; i < numPatterns; i++) {
            var pattern = [];
            var startOfs = ofs = readWord(patternParapointerOfs+i*2)*16;
            var ppLength = readWord(ofs+0);
            ofs += 2;
            var row = 0;
            while (row < 64) {
                var rowData = [];
                var chan;
                for (chan = 0 ; chan < numChannels; chan++) {
                    rowData[chan] = {
                        sampleNumber: -1,
                        note: -1,
                        effect: 0,
                        parameter: 0,
                        volume: -1
                    }
                }
                var key = readByte(ofs++);
                while (key !== 0x00) {
                    var note = {
                        sampleNumber: -1,
                        note: -1,
                        effect: 0,
                        parameter: 0,
                        volume: -1
                    };
                    var chan = key & 0x1f;
                    if (key & 0x20) {
                        var b = readByte(ofs++);
                        if (b == 255) {
                            note.note = -1;
                        } else if (b == 254) {
                            note.note = 254;
                        } else  {
                            var oct = (b & 0xf0) / 16;
                            var noteNum = b & 0x0f;
                            note.note = oct * 12 + noteNum;
                        }
                        note.sampleNumber = readByte(ofs++);
                    }
                    if (key & 0x40) {
                        note.volume = readByte(ofs++);
                    }
                    if (key & 0x80) {
                        note.effect = (readByte(ofs++));
                        note.parameter = (readByte(ofs++));
                    }
                    rowData[channelMap[chan]]=note;
                    key = readByte(ofs++);
                }
                pattern[row] = rowData;
                row++;
            }
            if ((ofs - startOfs)  !== ppLength) {
                console.log("Expected pattern #"+i+" to be "+ppLength+" bytes; actually got "+(ofs - startOfs) );
            }
            song.patterns[i]=pattern;
        }

        var samples = [];
        for (i = 0; i < numInstruments; i++) {
            var ofs = readWord(instrumentParapointerOfs+i*2)*16;
            var insType = data.substring(ofs+0x4c, ofs+0x4c+4);
            if (insType === 'SCRS' && readByte(ofs) === 1) {

                var flags = readByte(ofs+0x1f);
                var c2speed = readWord(ofs+0x20) + (readWord(ofs+0x22)*65536);
                var samp =  new jssynth_core.Sample(data, {
                    name: data.substring(ofs+1, ofs+12),
                    bits: (flags & 0x04) == 0x00 ? 8 : 16,
                    channels: (flags & 0x02) == 0x00 ? 1 : 2,
                    signed: false,
                    sampleRate: c2speed,
                    representedFreq: 8363,
                    sampleLength: readWord(ofs + 0x10) + (readWord(ofs+0x12) * 65536),
                    volume: readByte(ofs+0x1c),
                    repeatType: (flags & 0x01) !== 0x00 ? 'REP_NORMAL' : 'NON_REPEATING',
                    repeatStart: readWord(ofs+0x14) + (readWord(ofs+0x16) * 65536),
                    repeatEnd: readWord(ofs+0x18) + (readWord(ofs+0x1a) * 65536)
                }, (readByte(ofs+0x0d) * 65536 + readWord(ofs+0x0e)) * 16);

                samples[i] = new jssynth_core.Instrument({name: "S3M instrument", numSamples: 1}, [samp]);

            } else {
                samples[i] = new jssynth_core.Instrument({name: "Empty instrument", numSamples: 0}, [{
                    name: "--",
                    sampleLength: 0,
                    repeatStart: 0,
                    repeatEnd: 0,
                    volume: 0,
                    repeatType: 'NON_REPEATING',
                    bits: 8,
                    channels: 1,
                    pitchOfs: 1,
                    samples: []
                }]);
            }
        }
        song.instruments = samples;


        return song;
    }
    
    
    return jssynth_s3m;
}));