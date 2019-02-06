"use strict";

import {Loader} from '../Loader'
import {MOD_EFFECT_MAP} from './effects/MOD_EFFECT_MAP';
import {MOD_PERIOD_TABLE} from './MOD_PERIOD_TABLE';
import {MOD_FINETUNE_TABLE} from './MOD_FINETUNE_TABLE';
import {Sample, SampleRepeatType} from '../../Sample';
import {Instrument} from '../../Instrument';
import {BLANK_SONG, Song} from '../Song'
import {EMPTY_NOTE, PatternNote} from "../PatternNote";
import {Pattern} from "../Pattern"
import {PatternRow} from "../PatternRow"
import {Utils} from "../../Utils";


/* =========== MOD reader ================= */
const MODTypes = {
  'M.K.': { key: 'M.K.', channels: 4, instruments: 31 },
  'M!K!': { key: 'M!K!', channels: 4, instruments: 31 },
  'FLT4': { key: 'FLT4', channels: 4, instruments: 31 },
  '4CHN': { key: '4CHN', channels: 4, instruments: 31 },
  '6CHN': { key: '6CHN', channels: 6, instruments: 31 },
  'FLT8': { key: 'FLT8', channels: 8, instruments: 31 },
  '8CHN': { key: '8CHN', channels: 8, instruments: 31 },
  '16CH': { key: '16CH', channels: 16, instruments: 31 }
};

const EIGHTH_SEMITONE_MULTIPLIER = Math.pow(2, 1/(12*8));

export class MODLoader implements Loader {
  loadSong(data: string): Song {
    let i;
    let readWord = function (ofs) {
      return (data.charCodeAt(ofs) * 256 + data.charCodeAt(ofs + 1) );
    };
    let modType:string = data.substring(1080, 1084);
    let modTypeData = MODTypes[modType] || { key: 'NOIS', channels: 4, instruments: 15 };
    let song:Song = BLANK_SONG;

    song.name = data.substring(0, 20);
    song.type = modTypeData.key;
    song.channels = modTypeData.channels;

    song.effectMap = MOD_EFFECT_MAP;
    let songLengthPos = 20 + (30 * modTypeData.instruments);

    song.songLength = data.charCodeAt(songLengthPos);
    song.orders = [];
    let maxPatternNum = 0;
    for (i = 0; i < 128; i++) {
      song.orders[i] = data.charCodeAt(songLengthPos + 2 + i);
      if (song.orders[i] > maxPatternNum) {
        maxPatternNum = song.orders[i];
      }
    }

    let patternOfs = songLengthPos + 130;
    if (modTypeData.instruments > 15) {
      patternOfs += 4;
    }

    song.patterns = [];
    for (i = 0; i <= maxPatternNum; i++) {
      let pattern: Pattern = { rows: [] };
      let ofs = patternOfs + (64 * 4 * modTypeData.channels * i);
      let row;
      for (row = 0; row < 64; row++) {
        let rowData: PatternRow = { channels: [] };
        let chan;
        for (chan = 0; chan < modTypeData.channels; chan++) {
          let note: PatternNote = Utils.clone(EMPTY_NOTE);
          let chanOfs = ofs + (row * 4 * modTypeData.channels) + chan * 4;
          let b1 = data.charCodeAt(chanOfs);
          let b2 = data.charCodeAt(chanOfs + 1);
          let b3 = data.charCodeAt(chanOfs + 2);
          let b4 = data.charCodeAt(chanOfs + 3);
          note.sampleNumber = (b1 & 0xf0) + ((b3 & 0xf0) / 16);
          let period = (((b1 & 0x0f) * 256) + b2) * 4;
          note.note = (period === 0) ? -1 : MOD_PERIOD_TABLE.getNote(period);
          note.effect = b3 & 0x0f;
          note.parameter = b4;
          note.volume=-1;
          rowData.channels.push(note);
        }
        pattern.rows.push(rowData);
      }
      song.patterns.push(pattern);
    }

    let sampleOfs = patternOfs + (64 * 4 * modTypeData.channels * (maxPatternNum + 1));

    let modInstruments = [];

    (function() {
      let insOffset;
      let sampleLength;
      let repeatLength;
      let sampleName;
      let sample;
      let repeatStart;
      let repeatEnd;

      for (i = 0; i < modTypeData.instruments; i++) {
        insOffset = 20 + 30 * i;

        sampleLength = readWord(insOffset + 22) * 2;
        repeatLength = readWord(insOffset + 28) * 2;
        sampleName = data.substring(insOffset, insOffset + 22);
        repeatStart = readWord(insOffset+26)*2;
        repeatEnd = readWord(insOffset+26)*2+repeatLength;
        if (repeatLength > 2 && repeatEnd > sampleLength) {
          repeatEnd = sampleLength-1;
          repeatLength = repeatEnd - repeatStart;
        }

        sample = new Sample(data, {
          name: sampleName,
          bits: 8,
          channels: 1,
          signed: true,
          sampleRate: 44100,
          representedFreq: 44100 / Math.pow(EIGHTH_SEMITONE_MULTIPLIER, MOD_FINETUNE_TABLE[data.charCodeAt(insOffset + 24)]),
          sampleLength: sampleLength,
          volume: data.charCodeAt(insOffset + 25),
          repeatType: repeatLength > 2 ? SampleRepeatType.REP_NORMAL : SampleRepeatType.NON_REPEATING,
          repeatStart: repeatStart,
          repeatEnd: repeatEnd
        }, sampleOfs);
        sampleOfs += sampleLength;

        modInstruments[i] = new Instrument({name: sampleName, numSamples: 1}, [sample]);
      }
    })();

    song.instruments = modInstruments;

    return song;
  }
}
