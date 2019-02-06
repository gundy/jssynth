/* */
"use strict";

import {Utils} from './Utils';
import {Sample} from './Sample';

export interface InstrumentMetadata {
  numSamples: number,
  name: string,
  noteToSampleMap: number[];
  volumeType: number,  // bit 0: On; 1: Sustain; 2: Loop
  volumeEnvelope: number[],
  numVolumePoints: number,
  volumeSustainPoint: number,
  volumeLoopStartPoint: number,
  volumeLoopEndPoint: number,

  panningType: number, // bit 0: On; 1: Sustain; 2: Loop
  panningEnvelope: number[],
  numPanningPoints: number,
  panningSustainPoint: number,
  panningLoopStartPoint: number,
  panningLoopEndPoint: number,

  vibratoType: number,  // ???
  vibratoSweep: number,
  vibratoDepth: number,
  vibratoRate: number,

  volumeFadeout: number
}

const DEFAULT_INSTRUMENT_METADATA: InstrumentMetadata = {
    numSamples: 1,
    name: "Default Instrument",
    noteToSampleMap: [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],

    volumeType: 0,  // bit 0: On; 1: Sustain; 2: Loop
    volumeEnvelope: [],
    numVolumePoints: 0,
    volumeSustainPoint: 0,
    volumeLoopStartPoint: 0,
    volumeLoopEndPoint: 0,

    panningType: 0, // bit 0: On; 1: Sustain; 2: Loop
    panningEnvelope: [],
    numPanningPoints: 0,
    panningSustainPoint: 0,
    panningLoopStartPoint: 0,
    panningLoopEndPoint: 0,

    vibratoType: 0,  // ???
    vibratoSweep: 0,
    vibratoDepth: 0,
    vibratoRate: 0,

    volumeFadeout: 0
};


export class Instrument {
  public readonly metadata: InstrumentMetadata;
  public readonly samples: Sample[];

  constructor(metadata: {[field: string]: any}, samples: Sample[]) {
    this.metadata = Utils.merge(DEFAULT_INSTRUMENT_METADATA, metadata);
    this.samples = samples;
  }

}
