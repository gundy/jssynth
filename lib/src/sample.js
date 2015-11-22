"use strict";

import {Utils} from './utils';

var DEFAULT_SAMPLE_METADATA = {
    name: "",
    bits: 8,
    channels: 1,
    littleEndian: true,
    deltaEncoding: false,
    signed: true,
    sampleRate: 8000,
    representedFreq: 440,  /* the frequency that this sample will produce if played at it's sample rate */
    pitchOfs: 1,
    repeatType: 'NON_REPEATING',
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
    constructor(sampleData, metadata, offset) {
        this.metadata = Utils.merge(DEFAULT_SAMPLE_METADATA, metadata);

        if (typeof sampleData === 'function') {
            this.data = sampleData();
        } else {
            this.data = Sample.convertSamplesBytesToDoubles(sampleData, metadata, offset);
        }


        /*
         this looks a little weird, but we're just extending the end of the sample if
         it's set to repeat, so that interpolation doesn't get confused across repeat
         boundaries.
         */
        if (this.metadata.repeatType !== 'NON_REPEATING') {
            for (var c = 0; c < this.data.length; c++) {
                this.data[c][metadata.repeatEnd + 1] = this.data[c][metadata.repeatEnd];
            }
        }
    }

    /*
     * Convert a set of raw (byte-wise) samples into arrays of doubles
     */
    static convertSamplesBytesToDoubles(samples, meta, offset) {
        var startOfs = offset || 0;
        var channelData = [];
        var rawData = [];
        var chan;

        for (chan = 0; chan < meta.channels; chan++) {
            channelData[chan] = [];
            rawData[chan] = [];
        }
        if (meta.bits % 8 !== 0 || meta.bits > 24) {
            throw new Error("can only read 8, 16 or 24-bit samples");
        }
        var bytesPerSample = meta.bits / 8;
        var bytesPerSamplePeriod = bytesPerSample * meta.channels;
        var periodsToRead = meta.sampleLength;
        for (var i = 0; i < periodsToRead; i++) {
            var ofs = bytesPerSamplePeriod * i;
            for (chan = 0; chan < meta.channels; chan++) {
                var chanOfs = ofs + chan * bytesPerSample;
                var startBytePos = chanOfs + (meta.littleEndian ? (bytesPerSample - 1) : 0);
                var endBytePos = chanOfs + (meta.littleEndian ? -1 : bytesPerSample);
                var bytePosDelta = (meta.littleEndian ? -1 : 1);
                var data = 0;
                var scale = 0.5;
                var mask = 255;
                for (var bytePos = startBytePos; bytePos !== endBytePos; bytePos += bytePosDelta) {
                    data = data * 256 + samples.charCodeAt(startOfs + bytePos);
                    scale = scale * 256;
                    mask = mask * 256 + 255;
                }
                if (meta.signed) {
                    /* samp XOR 0x8000 & 0xffff converts from signed to unsigned */
                    data = (data ^ scale) & mask;
                }
                if (meta.deltaEncoding) {
                    var previousVal = ((i == 0) ? 0x00 : rawData[chan][i - 1]);
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
