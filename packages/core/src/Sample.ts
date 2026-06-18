import {Utils} from './Utils';

export enum SampleRepeatType {
  NON_REPEATING,
  REP_NORMAL,
  REP_PINGPONG
}

export interface SampleMetadata {
  name: string,
  bits: number,
  channels: number,
  littleEndian: boolean,
  deltaEncoding: boolean,
  signed: boolean,
  sampleRate: number,
  representedFreq: number,  /* the frequency that this sample will produce if played at it's sample rate */
  pitchOfs: number,
  repeatType: SampleRepeatType,  /* TODO: should probably be changed to enum */
  volume: number,
  repeatStart: number,
  repeatEnd: number,
  sampleLength: number
}


export const DEFAULT_SAMPLE_METADATA: SampleMetadata = {
  name: "",
  bits: 8,
  channels: 1,
  littleEndian: true,
  deltaEncoding: false,
  signed: true,
  sampleRate: 8000,
  representedFreq: 440,  /* the frequency that this sample will produce if played at it's sample rate */
  pitchOfs: 1,
  repeatType: SampleRepeatType.NON_REPEATING,
  volume: 64,
  repeatStart: 0,
  repeatEnd: 0,
  sampleLength: 0
};


/*
 * Convert a set of raw (byte-wise) samples into arrays of doubles
 *
 * metadata important to parsing samples is of the form:
 * {
 *   "bits":            8|16|24,
 *   "channels":        1|2,
 *   "sampleLength":    number of sample points in the sample,
 *   "littleEndian":    boolean -> true if samples are stored in little endian format,
 *   "signed":          boolean -> true if samples are stored in signed format (-127..128 instead of 0..255)
 *   "deltaEncoding":   boolean -> true if each new sample is stored as a delta from previous value
 * }
 *
 * defaults are: bits=8, channels=1
 *
 * metadata describes the content of samples.
 *
 * samples are read
 *  0..num_samples
 *    0..num_channels
 *      0..bytes_per_sample
 */
export class Sample {
  public readonly metadata: SampleMetadata;
  public readonly data: number[];

  constructor(sampleData: (()=>number[]) | string, metadata: any, offset: number) {
    let i, c, repeatLen;
    this.metadata = Utils.merge(DEFAULT_SAMPLE_METADATA, metadata);

    if (typeof sampleData === 'function') {
      this.data = sampleData();
    } else {
      this.data = Sample.convertSamplesBytesToDoubles(sampleData, metadata, offset);
    }

    /*
     * for pingpong samples, extend the repeat loop & convert to normal repeating sample
     */
    if (this.metadata.repeatType === SampleRepeatType.REP_PINGPONG) {
      for (c = 0; c < this.data.length; c++) {
        repeatLen = metadata.repeatEnd - metadata.repeatStart;
        for (i = 0; i < repeatLen; i++) {
          this.data[c][metadata.repeatEnd+i] = this.data[c][metadata.repeatEnd-i];
        }
        this.data[c][metadata.repeatEnd] = this.data[c][metadata.repeatStart];
      }
      this.metadata.repeatEnd = this.metadata.repeatStart + (2 * repeatLen - 1);
      if (this.metadata.repeatEnd > this.metadata.sampleLength) {
        this.metadata.sampleLength = this.metadata.repeatEnd;
      }
      this.metadata.repeatType = SampleRepeatType.REP_NORMAL;
    }

    /*
     this looks a little weird, but we're just extending the end of the sample if
     it's set to repeat, so that interpolation doesn't get confused across repeat
     boundaries.
     */
    if (this.metadata.repeatType !== SampleRepeatType.NON_REPEATING) {
      for (c = 0; c < this.data.length; c++) {
        this.data[c][metadata.repeatEnd + 1] = this.data[c][metadata.repeatEnd];
      }
    }
  }

  /*
   * Convert a set of raw (byte-wise) samples into arrays of doubles
   */
  static convertSamplesBytesToDoubles(samples: string, meta: SampleMetadata, offset: number): number[] {
    let startOfs = offset || 0;
    let channelData = [];
    let rawData = [];
    let chan;

    for (chan = 0; chan < meta.channels; chan++) {
      channelData[chan] = [];
      rawData[chan] = [];
    }
    if (meta.bits % 8 !== 0 || meta.bits > 24) {
      throw new Error("can only read 8, 16 or 24-bit samples");
    }
    let bytesPerSample = meta.bits / 8;
    let bytesPerSamplePeriod = bytesPerSample * meta.channels;
    let periodsToRead = meta.sampleLength;
    for (let i = 0; i < periodsToRead; i++) {
      let ofs = bytesPerSamplePeriod * i;
      for (chan = 0; chan < meta.channels; chan++) {
        let chanOfs = ofs + chan * bytesPerSample;
        let startBytePos = chanOfs + (meta.littleEndian ? (bytesPerSample - 1) : 0);
        let endBytePos = chanOfs + (meta.littleEndian ? -1 : bytesPerSample);
        let bytePosDelta = (meta.littleEndian ? -1 : 1);
        let data = 0;
        let scale = 0.5;
        let mask = 255;
        for (let bytePos = startBytePos; bytePos !== endBytePos; bytePos += bytePosDelta) {
          data = data * 256 + samples.charCodeAt(startOfs + bytePos);
          scale = scale * 256;
          mask = mask * 256 + 255;
        }
        if (meta.signed) {
          /* samp XOR 0x8000 & 0xffff converts from signed to unsigned */
          data = (data ^ scale) & mask;
        }
        if (meta.deltaEncoding) {
          let previousVal = ((i == 0) ? 0x00 : rawData[chan][i - 1]);
          rawData[chan][i] = (previousVal + ((data ^ scale) & mask)) & 0xff;
          channelData[chan][i] = (((rawData[chan][i] ^ scale) & mask) - scale) / scale;
        } else {
          data = (data - scale) / scale;
          channelData[chan][i] = data;
        }
      }
    }
    return channelData;
  }
}
