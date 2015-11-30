/* */
"use strict";

import {Utils} from './utils';


var TYPE_BITMASK_ENABLED = 1;
var TYPE_BITMASK_SUSTAIN = 2;
var TYPE_BITMASK_LOOP = 4;

export class Envelope {
    constructor(defaultVal, type, envelopePoints, numPoints, sustainPoint, loopStartPoint, loopEndPoint, fadeoutVol) {
        this.type=type||0; // bit 0: On; 1: Sustain; 2: Loop
        this.envelopePoints=envelopePoints||[];
        this.numPoints=numPoints||0;
        this.sustainPoint=sustainPoint||0;
        this.loopStartPoint=loopStartPoint||0;
        this.loopEndPoint=loopEndPoint||0;
        this.defaultValue = defaultVal || 64;
        this.fadeoutVol = fadeoutVol || 0;
    }
    *sequence() {
        var _self = this;
        var enabled = this.type & TYPE_BITMASK_ENABLED;
        var sustain = this.type & TYPE_BITMASK_SUSTAIN;
        var loop = this.type & TYPE_BITMASK_LOOP;
        var currentPos = 0;
        var envelopeIndex = 0;
        var keyUp = false;
        var keyedOff = false;
        var finished = false;
        var fadeoutAmount = 65536;

        var calculatePoint = function() {
            var a, b;
            if (_self.numPoints === 1) { /* if there's only one point, no interpolation required */
                return _self.envelopePoints[0][1];
            } else {
                a = _self.envelopePoints[envelopeIndex];
                b = _self.envelopePoints[envelopeIndex+1];
                while (!finished && currentPos > b[0]) {
                    if (envelopeIndex+2 >= _self.numPoints) { /* can't advance further */
                        currentPos--;
                        finished = true;
                    } else {
                        envelopeIndex+=1;
                        a = _self.envelopePoints[envelopeIndex];
                        b = _self.envelopePoints[envelopeIndex+1];
                    }
                }
                /* hopefully currentPos is somewhere between these two */
                var ap = a[0];  /* a position */
                var bp = b[0];  /* b position */
                /* need to find index 0..1 of currentPos in ap/bp */
                if (bp == ap) {
                    return ((a[1]+b[1])/2);
                } else {
                    var interp = (currentPos - ap) / (bp-ap);  /* pos past ap / length ap..bp */
                    return ((1-interp)*a[1]) + (interp*b[1]);
                }
            }
        };


        while (true) {
            var result = (enabled === 0 || _self.numPoints == 0) ? _self.defaultValue : calculatePoint();

            keyUp = yield result * (fadeoutAmount / 65536.0);

            if (keyUp) {
                keyedOff = true;
            }

            if (keyedOff) {
                fadeoutAmount -= _self.fadeoutVol;
                if (fadeoutAmount < 0) {
                    fadeoutAmount = 0;
                }
            }

            if (!finished) {
                if (sustain) {
                    /* if sustain is enabled, we pause at sustainPoint until keyoff */
                    if (currentPos !== _self.envelopePoints[_self.sustainPoint][0] || keyedOff) {
                        currentPos++;
                    }
                } else if (loop) {
                    currentPos++;
                    if (currentPos > _self.envelopePoints[_self.loopEndPoint][0]) {
                        currentPos = _self.envelopePoints[_self.loopStartPoint][0];
                    }
                    for (var index = 0; index < _self.numPoints; index++) {
                        if (currentPos > _self.envelopePoints[index][0]) {
                            envelopeIndex = index;
                        }
                    }
                } else { /* !sustain, !loop */
                    currentPos++;
                }
            }
        }
    }
}


var DEFAULT_INSTRUMENT_METADATA = {
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
    constructor(metadata, samples) {
        this.metadata = Utils.merge(DEFAULT_INSTRUMENT_METADATA, metadata);
        this.samples = samples;
    }

}
