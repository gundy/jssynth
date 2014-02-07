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

    jssynth.ns('S3M');

    jssynth.S3M.readS3Mfile = function (data) {
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
        song.effectMap = jssynth.S3M.S3M_EFFECT_MAP;
        song.fastS3MVolumeSlides = (createdWithTrackerVersion == 0x1300 || (flags && 0x40));

        var channelMap = [];
        var numChannels = 0;
        for (i = 0; i<32; i++) {
            var chanSettings = readByte(0x40+i);
            if (chanSettings !== 255 && chanSettings < 128) {
                channelMap[i] = numChannels++;
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

        var defaultPanPos = [];
        var i;
        for (i = 0; i < 32; i++) {
            if (masterVolume & 0x80) {
                console.log("Default pan pos = mono");
                defaultPanPos[i] = 0;
            } else {
                if (i%16 <= 7) {
                    defaultPanPos[i] = -0.8;
                } else {
                    defaultPanPos[i] = 0.8;
                }
            }
        }
        song.defaultPanPos = [];
        // read pan pos
        var dp = readByte(0x35);
        if (dp == 252) {
            // read default pan positions
            for (i=0; i<32; i++) {
                var pp = readByte(panPosOfs + i);
                var panPos;
                if (pp & 0x20) {
                    panPos = defaultPanPos[i];
                } else {
                    var pp2 = pp & 0x0f;
                    panPos = (pp2 - 7.5)/7.5;
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
                var samp =  new jssynth.Sample(data, {
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

                samples[i] = new jssynth.Instrument({name: "S3M instrument", numSamples: 1}, [samp]);

            } else {
                samples[i] = new jssynth.Instrument({name: "Empty instrument", numSamples: 0}, [{
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

})();