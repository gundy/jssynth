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

    jssynth.MOD.MODTypes = {
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


    jssynth.MOD.readMODfile = function (data) {
        var readWord = function (ofs) {
            return (data.charCodeAt(ofs) * 256 + data.charCodeAt(ofs + 1) )
        }
        var modType = data.substring(1080, 1084);
        var modTypeData = jssynth.MOD.MODTypes[modType] || { key: 'NOIS', channels: 4, instruments: 15 };
        var modSamples = [];
        var song = {};

        song.name = data.substring(0, 20);
        song.type = modTypeData.key;
        song.channels = modTypeData.channels;

        song.effectMap = jssynth.MOD.MOD_EFFECT_MAP;
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
                    note.note = (period === 0) ? -1 : jssynth.MOD.MOD_PERIOD_TABLE.getNote(period);
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

        for (var i = 0; i < modTypeData.instruments; i++) {
            var insOffset = 20 + 30 * i;

            var sampleLength = readWord(insOffset + 22) * 2;
            var repeatLength = readWord(insOffset + 28) * 2;
            var sample = new jssynth.Sample(data, {
                name: data.substring(insOffset, insOffset + 22),
                bits: 8,
                channels: 1,
                signed: true,
                pitchOfs: Math.pow(EIGHTH_SEMITONE_MULTIPLIER, jssynth.MOD.MOD_FINETUNE_TABLE[data.charCodeAt(insOffset + 24)]),
                sampleLength: sampleLength,
                volume: data.charCodeAt(insOffset + 25),
                isRepeating: repeatLength > 2,
                repeatStart: readWord(insOffset + 26) * 2,
                repeatEnd: readWord(insOffset + 26) * 2 + repeatLength
            }, sampleOfs);
            sampleOfs += sampleLength;
            modSamples[i] = sample;
        }
        song.instruments = modSamples;

        return song;
    }

})();