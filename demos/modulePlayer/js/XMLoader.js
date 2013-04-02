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

    jssynth.ns('XM');

    jssynth.XM.readXMfile = function (data) {
        var readWord = function (ofs) {
            return (data.charCodeAt(ofs+1) * 256 + data.charCodeAt(ofs) )
        }
        var readDWord = function (ofs) {
            return readWord(ofs+2) * 65536 + readWord(ofs);
        }
        var readByte = function(ofs) {
            return (data.charCodeAt(ofs));
        }

        var xmMagic = data.substring(0, 17);
        if (xmMagic !== 'Extended Module: ' || readByte(37) !== 0x1a ) {
            console.log("Invalid XM file");
            return;
        }

        var createdWithTrackerVersion = readWord(58);
        if (createdWithTrackerVersion !== 0x0104) {
            console.log("Tracker version "+createdWithTrackerVersion.toString(16)+" doesn't match expected 0104.. please report any playback problems.");
        }

        var headerOfs = 60;
        var headerLength = readDWord(headerOfs);
        var song = {};
        var numOrders = readWord(headerOfs+4);

        var numChannels = readWord(headerOfs+8);
        song.channels = numChannels;

        var numPatterns = readWord(headerOfs+10);
        var numInstruments = readWord(headerOfs+12);

        var restartPosition = readWord(headerOfs+6);

        var flags = readWord(headerOfs+14);

        song.name = data.substring(17, 37);
        song.initialSpeed = readWord(headerOfs+16);
        song.initialBPM = readWord(headerOfs+18);
        song.type = 'XM';

        song.masterVolume = 127;
        song.globalVolume = 64;
        song.defaultFreq = { clock: 7159090.5*4 };  // NTSC
        song.effectMap = jssynth.XM.XM_EFFECT_MAP;

        song.songLength = numOrders;
        song.orders = [];
        for (var i = 0; i < numOrders; i++) {
            song.orders[i] = readByte(headerOfs+20+i);
        }

        var patternOfs = headerOfs + headerLength;

        song.patterns = [];
        var ofs = patternOfs;
        for (var i = 0; i < numPatterns; i++) {
            var pattern = [];

            var patternHeaderLength = readDWord(ofs);
            var packingType = readByte(ofs+4);
            if (packingType !== 0x00) {
                throw "Error reading XM pattern data - unknown packing type (" + packingType + ") at pattern "+i;
            }
            var numRows = readWord(ofs+5);
            var packedPatternSize = readWord(ofs+7);
            var packedPatternOfs = ofs+patternHeaderLength;

            var row = 0;
            while (row < numRows) {
                var rowData = [];
                var chan;
                for (chan = 0 ; chan < numChannels; chan++) {
                    var note = {
                        sampleNumber: -1,
                        note: -1,
                        effect: 0,
                        parameter: 0,
                        volume: -1
                    }
                    var key = readByte(packedPatternOfs++);
                    if ((key & 0x80) == 0) {
                        note.note = key;
                        note.sampleNumber = readByte(packedPatternOfs++);
                        note.volume = readByte(packedPatternOfs++);
                        note.effect = readByte(packedPatternOfs++);
                        note.parameter = readByte(packedPatternOfs++);
                    } else {
                        if (key & 0x01) {
                            note.note = readByte(packedPatternOfs++);
                        }
                        if (key & 0x02) {
                            note.sampleNumber = readByte(packedPatternOfs++);
                        }
                        if (key & 0x04) {
                            var vol = readByte(packedPatternOfs++);
                            if (vol >= 0x10 && vol <= 0x50) {
                                note.volume = vol - 0x10;
                            } else {
                                // TODO unpack volume effects
                                console.log("Volume effect not currently supported")
                            }
                        }
                        if (key & 0x08) {
                            note.effect = readByte(packedPatternOfs++);
                        }
                        if (key & 0x10) {
                            note.parameter = readByte(packedPatternOfs++);
                        }
                    }
                    rowData[chan] = note;
                }
                pattern[row] = rowData;
                row++;
            }
            song.patterns[i]=pattern;
            ofs = ofs + patternHeaderLength + packedPatternSize;
        }

        var samples = [];
        for (i = 0; i < numInstruments; i++) {
            var instrument = {};
            var instrumentSize = readDWord(ofs);
            var instrumentName = data.substring(ofs+4, ofs+26);
            var instrumentType = readByte(ofs+26);
            if (instrumentType !== 0x00) {
                console.log("Instrument #"+i+", type was "+instrumentType+", expected 0");
            }
            var numSamples = readWord(ofs+27);
            console.log("Would be reading instrument #"+i+", name = "+instrumentName+", numSamples = "+numSamples);
            var instrumentMetaData = {
                noteToSampleMap: [],
                volumeEnvelope: [],
                panningEnvelope: []
            };
            if (numSamples > 0) {
                for (var n = 0; n < 96; n++) {
                    instrumentMetaData.noteToSampleMap[n] = readByte(ofs+33+n);
                }
                for (var n = 0 ; n < 12; n++) {
                    instrumentMetaData.volumeEnvelope[n] = [ readWord(ofs+129+n*4), readWord(ofs+129+n*4+2) ];
                    instrumentMetaData.panningEnvelope[n] = [ readWord(ofs+177+n*4), readWord(ofs+177+n*4+2) ];
                }
                instrumentMetaData.numVolumePoints = readByte(ofs+225);
                instrumentMetaData.numPanningPoints = readByte(ofs+226);
                instrumentMetaData.volumeSustainPoint = readByte(ofs+227);
                instrumentMetaData.volumeLoopStartPoint = readByte(ofs+228);
                instrumentMetaData.volumeLoopEndPoint = readByte(ofs+229);
                instrumentMetaData.panningSustainPoint = readByte(ofs+230);
                instrumentMetaData.panningLoopStartPoint = readByte(ofs+231);
                instrumentMetaData.panningLoopEndPoint = readByte(ofs+232);
                instrumentMetaData.volumeType = readByte(ofs+233);
                instrumentMetaData.panningType = readByte(ofs+234);
                instrumentMetaData.vibratoType = readByte(ofs+235);
                instrumentMetaData.vibratoSweep = readByte(ofs+236);
                instrumentMetaData.vibratoDepth = readByte(ofs+237);
                instrumentMetaData.vibratoRate = readByte(ofs+238);
                instrumentMetaData.volumeFadeout = readWord(ofs+239);
                console.log("Instrument metadata: ", instrumentMetaData)
            }

            var sampleOfs = ofs + instrumentSize;
            var samples = [];
            for (var s = 0; s < numSamples ; s++) {
                var sampleLength = readDWord(sampleOfs+s);
                var sampleLoopStart = readDWord(sampleOfs+s+4);
                var sampleLoopEnd = readDWord(sampleOfs+s+8);
                var sampleVolume = readByte(sampleOfs+s+12);
                var sampleFinetune = readByte(sampleOfs+s+13);
                var sampleType = readByte(sampleOfs+s+14);
                if (sampleType & 0x10) {
                    console.log("**** 16-bit sample ****");
                }
                var samplePanPos = readByte(sampleOfs+s+15);
                var sampleRelativeNote = readByte(sampleOfs+s+16);
                var sampleName = data.substring(sampleOfs+s+18, sampleOfs+s+40);
                console.log(" - instrument sample #"+s+", name="+sampleName+", length="+sampleLength);
                sampleOfs += 40;
                samples.push({
                    name: sampleName,
                    length: sampleLength,
                    volume: sampleVolume,
                    fineTune: sampleFinetune,
                    type: sampleType,
                    panPos: samplePanPos,
                    loopStart: sampleLoopStart,
                    loopEnd: sampleLoopEnd,
                    relativeNote: sampleRelativeNote
                });
//                sampleOfs += sampleLength;
            }
            for (var s = 0 ; s < numSamples; s++) {
                // read sample data (differential storage)
                sampleOfs += samples[s].length;
            }
            ofs = sampleOfs;
        }
        song.instruments = samples;

        return song;
    }

})();