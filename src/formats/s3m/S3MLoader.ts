import {S3M_EFFECT_MAP} from './effects/S3M_EFFECT_MAP';
import {Loader} from '../Loader'
import {Song, FREQ_NTSC, BLANK_SONG} from "../Song";
import {PatternRow} from "../PatternRow";
import {Pattern} from "../Pattern";
import {PatternNote} from "../PatternNote";
import {Sample, SampleRepeatType} from "../../Sample";
import {Instrument} from "../../Instrument";
import {Utils} from "../../Utils";

export class S3MLoader implements Loader {
  loadSong(data:string): Song {
    let readWord = function (ofs) {
      return (data.charCodeAt(ofs + 1) * 256 + data.charCodeAt(ofs) )
    };
    let readByte = function (ofs) {
      return (data.charCodeAt(ofs));
    };

    let s3mHeader = data.substring(0x2c, 0x30);
    if (s3mHeader !== 'SCRM' || readWord(0x1c) !== 0x101a) {
      console.log("Invalid S3M file");
      return;
    }

    let song: Song = Utils.clone(BLANK_SONG);
    let numOrders = readWord(0x20);
    let numInstruments = readWord(0x22);
    let numPatterns = readWord(0x24);
    let flags = readWord(0x26);
    let createdWithTrackerVersion = readWord(0x28);
    //var fileFormatInformation = readWord(0x2a);

    song.name = data.substring(0, 0x1c);
    song.type = 'S3M';

    let masterVolume = readByte(0x33);
    song.masterVolume = masterVolume & 0x7f;
    song.globalVolume = readByte(0x30);
    song.initialSpeed = readByte(0x31);
    song.initialBPM = readByte(0x32);
    song.defaultFreq = FREQ_NTSC;  // NTSC
    song.effectMap = S3M_EFFECT_MAP;
    song.fastS3MVolumeSlides = (createdWithTrackerVersion == 0x1300 || ((flags && 0x40) !== 0));

    let channelMap = [];
    let numChannels = 0;

    let defaultPanPos = [];
    let i;
    for (i = 0; i < 32; i++) {
      if ((masterVolume & 0x80) == 0x80) {
        if ((i & 15) <= 7) {
          defaultPanPos[i] = -0.8;
        } else {
          defaultPanPos[i] = 0.8;
        }
      } else {
        defaultPanPos[i] = 0;
      }
    }

    for (i = 0; i < 32; i++) {
      let chanSettings = readByte(0x40 + i);
      if (chanSettings !== 255 && chanSettings < 128) {
        //console.log("S3M channel "+i+" => "+chanSettings);
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
    //var orderCount = 0;
    for (i = 0; i < numOrders; i++) {
      // candidateOrder
      song.orders[i] = readByte(0x60 + i);
    }

    let ppOfs: number = 0x60 + numOrders;
    let instrumentParapointerOfs: number = ppOfs;
    let patternParapointerOfs: number = ppOfs + numInstruments * 2;
    let panPosOfs:number = patternParapointerOfs + numPatterns * 2;

    song.defaultPanPos = [];
    // read pan pos
    let dp = readByte(0x35);
    if (dp == 252) {
      // read default pan positions
      for (i = 0; i < 32; i++) {
        let pp = readByte(panPosOfs + i);
        let panPos;
        if ((pp & 0x20) == 0x00) {
          panPos = defaultPanPos[i];
        } else {
          var pp2 = pp & 0x0f;
          panPos = (pp2 - 7.5) / 7.5;
        }
        song.defaultPanPos[channelMap[i]] = panPos;
      }
    } else {
      for (i = 0; i < 32; i++) {
        song.defaultPanPos[channelMap[i]] = defaultPanPos[i];
      }
    }


    // read patterns
    song.patterns = [];
    (function () {
      for (i = 0; i < numPatterns; i++) {
        let ofs: number;
        let pattern: Pattern = { rows: [] };
        let startOfs = ofs = readWord(patternParapointerOfs + i * 2) * 16;
        let ppLength = readWord(ofs + 0);
        ofs += 2;
        let row:number = 0;
        while (row < 64) {
          let rowData: PatternRow = { channels: [] };
          let chan: number;
          for (chan = 0; chan < numChannels; chan++) {
            rowData.channels[chan] = {
              sampleNumber: -1,
              note: -1,
              effect: 0,
              parameter: 0,
              volume: -1,
              volumeEffect: 0,
              volumeEffectParameter: 0
            }
          }
          let key = readByte(ofs++);
          while (key !== 0x00) {
            let note: PatternNote = {
              sampleNumber: -1,
              note: -1,
              effect: 0,
              parameter: 0,
              volume: -1,
              volumeEffect: 0,
              volumeEffectParameter: 0
            };
            chan = key & 0x1f;
            if (key & 0x20) {
              let b = readByte(ofs++);
              if (b == 255) {
                note.note = -1;
              } else if (b == 254) {
                note.note = 254;
              } else {
                let oct = (b & 0xf0) / 16;
                let noteNum = b & 0x0f;
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
            rowData.channels[channelMap[chan]] = note;
            key = readByte(ofs++);
          }
          pattern.rows[row] = rowData;
          row++;
        }
        if ((ofs - startOfs) !== ppLength) {
          console && console.log && console.log("Expected pattern #" + i + " to be " + ppLength + " bytes; actually got " + (ofs - startOfs));
        }
        song.patterns[i] = pattern;
      }
    })();

    // read samples
    let instruments:Instrument[] = [];
    (function () {
      let i = 0;
      let ofs;
      let insType;
      let flags;
      let c2speed;
      let samp: Sample;
      for (i = 0; i < numInstruments; i++) {
        ofs = readWord(instrumentParapointerOfs + i * 2) * 16;
        insType = data.substring(ofs + 0x4c, ofs + 0x4c + 4);
        if (insType === 'SCRS' && readByte(ofs) === 1) {

          flags = readByte(ofs + 0x1f);
          c2speed = readWord(ofs + 0x20) + (readWord(ofs + 0x22) * 65536);
          samp = new Sample(data, {
            name: data.substring(ofs + 1, ofs + 12),
            bits: (flags & 0x04) == 0x00 ? 8 : 16,
            channels: (flags & 0x02) == 0x00 ? 1 : 2,
            signed: false,
            sampleRate: c2speed,
            representedFreq: 8363,
            sampleLength: readWord(ofs + 0x10) + (readWord(ofs + 0x12) * 65536),
            volume: readByte(ofs + 0x1c),
            repeatType: (flags & 0x01) !== 0x00 ? SampleRepeatType.REP_NORMAL : SampleRepeatType.NON_REPEATING,
            repeatStart: readWord(ofs + 0x14) + (readWord(ofs + 0x16) * 65536),
            repeatEnd: readWord(ofs + 0x18) + (readWord(ofs + 0x1a) * 65536)
          }, (readByte(ofs + 0x0d) * 65536 + readWord(ofs + 0x0e)) * 16);

          instruments[i] = new Instrument({name: "S3M instrument", numSamples: 1}, [samp]);

        } else {
          instruments[i] = new Instrument({name: "Empty instrument", numSamples: 0}, [new Sample("", {
            name: "--",
            sampleLength: 0,
            repeatStart: 0,
            repeatEnd: 0,
            volume: 0,
            repeatType: SampleRepeatType.NON_REPEATING,
            bits: 8,
            channels: 1,
            pitchOfs: 1,
            samples: []
          }, 0)]);
        }
      }

    })();

    song.instruments = instruments;


    return song;
  }
}
