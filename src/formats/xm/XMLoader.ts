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

import {XM_EFFECT_MAP} from './effects/XM_EFFECT_MAP';
import {Loader} from "../Loader";
import {BLANK_SONG, Song} from "../Song";
import {Utils} from "../../Utils";
import {PatternRow} from "../PatternRow";
import {PatternNote} from "../PatternNote";
import {Sample, SampleRepeatType} from "../../Sample";
import {Instrument} from "../../Instrument";

export class XMLoader implements Loader {
  loadSong(data:string): Song {

    let i;

    let readWord = function (ofs) {
      return (data.charCodeAt(ofs+1) * 256 + data.charCodeAt(ofs) )
    };
    let readDWord = function (ofs) {
      return readWord(ofs+2) * 65536 + readWord(ofs);
    };
    let readByte = function(ofs) {
      return (data.charCodeAt(ofs));
    };

    let xmMagic = data.substring(0, 17);
    if (xmMagic !== 'Extended Module: ' || readByte(37) !== 0x1a ) {
      throw new Error("Invalid XM file");
    }

    let createdWithTrackerVersion = readWord(58);
    if (createdWithTrackerVersion !== 0x0104) {
      throw new Error("Tracker version "+createdWithTrackerVersion.toString(16)+" doesn't match expected 0104.. please report any playback problems.");
    }

    let headerOfs = 60;
    let headerLength = readDWord(headerOfs);
    let song: Song = Utils.clone(BLANK_SONG);
    let numOrders = readWord(headerOfs+4);

    let numChannels = readWord(headerOfs+8);
    song.channels = numChannels;

    let numPatterns = readWord(headerOfs+10);
    let numInstruments = readWord(headerOfs+12);

    // @ts-ignore
    let restartPosition = readWord(headerOfs+6);
    // @ts-ignore
    let flags = readWord(headerOfs+14);

    song.name = data.substring(17, 37);
    song.initialSpeed = readWord(headerOfs+16);
    song.initialBPM = readWord(headerOfs+18);
    song.type = 'XM';

    song.masterVolume = 127;
    song.globalVolume = 64;
    song.defaultFreq = { clock: 7159090.5*4 };  // NTSC
    song.effectMap = XM_EFFECT_MAP;

    song.songLength = numOrders;
    song.orders = [];
    for (i = 0; i < numOrders; i++) {
      song.orders[i] = readByte(headerOfs+20+i);
    }

    let patternOfs = headerOfs + headerLength;

    song.patterns = [];
    let ofs = patternOfs;
    for (i = 0; i < numPatterns; i++) {

      let patternHeaderLength = readDWord(ofs);
      let packingType = readByte(ofs+4);
      if (packingType !== 0x00) {
        throw new Error("Error reading XM pattern data - unknown packing type (" + packingType + ") at pattern "+i);
      }
      let numRows = readWord(ofs+5);
      let packedPatternSize = readWord(ofs+7);
      let packedPatternOfs = ofs+patternHeaderLength;
      let startPatternOfs = packedPatternOfs;

      let row = 0;
      let pattern: PatternRow[] = [];
      if (packedPatternSize > 0) {
        while (row < numRows) {
          let rowData: PatternRow = { channels: [] };
          let chan;
          for (chan = 0 ; chan < numChannels; chan++) {
            let note: PatternNote = {
              sampleNumber: -1,
              note: -1,
              effect: 0,
              parameter: 0,
              volume: -1,
              volumeEffect: 0,
              volumeEffectParameter: 0
            };
            let key = readByte(packedPatternOfs++);
            if ((key & 0x80) == 0) {
              note.note = (key == 97 ? 254 : key);
              note.sampleNumber = readByte(packedPatternOfs++);
              note.volume = readByte(packedPatternOfs++);
              note.effect = readByte(packedPatternOfs++);
              note.parameter = readByte(packedPatternOfs++);
            } else {
              if (key & 0x01) {
                let noteNum = readByte(packedPatternOfs++);
                note.note = (noteNum == 97 ? 254 : noteNum);
              }
              if (key & 0x02) {
                note.sampleNumber = readByte(packedPatternOfs++);
              }
              if (key & 0x04) {
                let vol = readByte(packedPatternOfs++);
                if (vol >= 0x10 && vol <= 0x50) {
                  note.volume = vol - 0x10;
                } else if (vol >= 0x60 && vol <= 0x6f) {
                  note.volumeEffect = 0x0a;
                  note.volumeEffectParameter = vol - 0x60;
                } else if (vol >= 0x70 && vol <= 0x7f) {
                  note.volumeEffect = 0x0a;
                  note.volumeEffectParameter = (vol - 0x70) * 16;
                } else if (vol >= 0x80 && vol <= 0x8f) {
                  note.volumeEffect = 0x0e;
                  note.volumeEffectParameter = (vol - 0x80) + 0xb0;
                } else if (vol >= 0x90 && vol <= 0x9f) {
                  note.volumeEffect = 0x0e;
                  note.volumeEffectParameter = (vol - 0x90) + 0xa0;
                } else if (vol >= 0xa0 && vol <= 0xaf) {
                  console && console.log && console.log("Set vibrato speed volume command not implemented");
                } else if (vol >= 0xb0 && vol <= 0xbf) {
                  console && console.log && console.log("Set vibrato depth volume command not implemented");
                } else if (vol >= 0xc0 && vol <= 0xcf) {
                  note.volumeEffect = 0x0e;
                  note.volumeEffectParameter = 0x80 + (vol - 0xc0);
                } else if (vol >= 0xd0 && vol <= 0xdf) {
                  console && console.log && console.log("Pan slide left volume effect not implemented");
                } else if (vol >= 0xe0 && vol <= 0xef) {
                  console && console.log && console.log("Pan slide right volume effect not implemented");
                } else if (vol >= 0xf0 && vol <= 0xff) {
                  note.volumeEffect = 0x03;
                  note.volumeEffectParameter = vol - 0xf0;
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
      }
      song.patterns[i].rows=pattern;
      if ((packedPatternOfs - startPatternOfs) !== packedPatternSize) {
        console && console.log && console.log("Expected to read "+packedPatternSize+" bytes for pattern "+i+", but got "+(packedPatternOfs - startPatternOfs));
      }
      ofs = ofs + patternHeaderLength + packedPatternSize;
    }

    let instruments = [];
    for (i = 0; i < numInstruments; i++) {
      let samples: Sample[] = [];
      let instrumentSize = readDWord(ofs);
      let instrumentType = readByte(ofs+26);
      let instrumentName = data.substring(ofs+4, ofs+26);
      if (instrumentType !== 0x00) {
        console && console.log && console.log("Instrument #"+i+", type    was "+instrumentType+", expected 0");
      }
      let numSamples = readWord(ofs+27);
      console && console.log && console.log("Would be reading instrument #"+i+", name = "+instrumentName+", numSamples = "+numSamples);
      let instrumentMetaData: any = {
        name: instrumentName,
        type: instrumentType,
        numSamples: numSamples,
        noteToSampleMap: [],
        volumeEnvelope: [],
        panningEnvelope: []
      };
      let sampleHeaderSize = 0;
      if (numSamples > 0) {
        sampleHeaderSize = readDWord(ofs+29);
        for (let n = 0; n < 96; n++) {
          instrumentMetaData.noteToSampleMap[n] = readByte(ofs+33+n);
        }
        for (let n = 0 ; n < 12; n++) {
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
        //console.log("Instrument metadata: ", instrumentMetaData)
      }

      let sampleOfs = ofs + instrumentSize;
      let sampleMeta = [];
      for (let s = 0; s < numSamples ; s++) {
        let sampleLength = readDWord(sampleOfs);
        let sampleLoopStart = readDWord(sampleOfs+4);
        let sampleLoopLength = readDWord(sampleOfs+8);
        let sampleLoopEnd = sampleLoopStart+sampleLoopLength;
        let sampleVolume = readByte(sampleOfs+12);
        let sampleFinetune = readByte(sampleOfs+13);
        let sampleType = readByte(sampleOfs+14);
        let adpcmFlag = readByte(sampleOfs+17);
        if (adpcmFlag == 0xad) {
          console && console.log && console.log("ADPCM sample");
        }
        if (sampleType & 0x10) {
          console && console.log && console.log("**** 16-bit sample ****");
        }
        let samplePanPos = readByte(sampleOfs+15);
        let sampleRelativeNote = readByte(sampleOfs+16);
        let sampleName = data.substring(sampleOfs+18, sampleOfs+40);
        sampleOfs += sampleHeaderSize;
        let noteOfs = ((sampleRelativeNote+0x80)&0xff)-0x80;
        let fineTune = ((sampleFinetune+0x80)&0xff)-0x80;
        //console.log("noteOfs = "+noteOfs);
        //console.log("finetune = "+fineTune);
        let repeatType = sampleType & 0x03;
        let bits = (sampleType & 0x10) ? 16 : 8;
        sampleMeta[s] = {
          name: sampleName,
          bits: bits,
          channels: 1,
          signed: true,
          adpcm: adpcmFlag == 0xad,
          deltaEncoding: true,
          repeatType:  (repeatType === 1 && sampleLoopLength !== 0) ? SampleRepeatType.REP_NORMAL : (repeatType === 2 && sampleLoopLength !== 0) ? SampleRepeatType.REP_PINGPONG : SampleRepeatType.NON_REPEATING,  // 0x02 should mean ping-pong
          sampleLength: bits == 8 ? sampleLength : sampleLength / 2,
          volume: sampleVolume,
          representedFreq: 8363 / Math.pow(Math.pow(2, 1/12), noteOfs) / Math.pow(Math.pow(2, 1/(12*128)), fineTune),
          type: sampleType,
          panPos: (samplePanPos-128) / 128,
          repeatStart: sampleLoopStart,
          repeatEnd: sampleLoopEnd
        };
//                console.log(" - instrument sample #"+s+", name="+sampleName+", length="+sampleLength+", meta=",sampleMeta[s]);
      }
      for (var s = 0 ; s < numSamples; s++) {
        // read sample data (differential storage)
        samples[s] = new Sample(data, sampleMeta[s], sampleOfs);
        var sampleLengthMultiplier = sampleMeta[s].bits / 8;
        if (sampleMeta[s].adpcm) {
          sampleLengthMultiplier /= 2;
          sampleOfs += 16;  /* adpcm decode table */
        }
        sampleOfs += sampleMeta[s].sampleLength * sampleLengthMultiplier;
      }

      instruments[i] = new Instrument(instrumentMetaData, samples);

      ofs = sampleOfs;
    }
    song.instruments = instruments;

    return song;
  }

}
