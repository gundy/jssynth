
let TYPE_BITMASK_ENABLED = 1;
let TYPE_BITMASK_SUSTAIN = 2;
let TYPE_BITMASK_LOOP = 4;


export class Envelope {
    private type: number;
    private envelopePoints: number[];
    private numPoints: number;
    private sustainPoint: number;
    private loopStartPoint: number;
    private loopEndPoint: number;
    private defaultValue: number;
    private fadeoutVol: number;


    constructor(
            defaultVal: number,
            type?: number,
            envelopePoints?: number[],
            numPoints?: number,
            sustainPoint?: number,
            loopStartPoint?: number,
            loopEndPoint?: number,
            fadeoutVol?: number) {
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
        let _self = this;
        let enabled = this.type & TYPE_BITMASK_ENABLED;
        let sustain = this.type & TYPE_BITMASK_SUSTAIN;
        let loop = this.type & TYPE_BITMASK_LOOP;
        let currentPos = 0;
        let envelopeIndex = 0;
        let keyUp = false;
        let keyedOff = false;
        let finished = false;
        let fadeoutAmount = 65536;

        let calculatePoint = function() {
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
                let ap = a[0];  /* a position */
                let bp = b[0];  /* b position */
                /* need to find index 0..1 of currentPos in ap/bp */
                if (bp == ap) {
                    return ((a[1]+b[1])/2);
                } else {
                    let interp = (currentPos - ap) / (bp-ap);  /* pos past ap / length ap..bp */
                    return ((1-interp)*a[1]) + (interp*b[1]);
                }
            }
        };


        while (true) {
            let result = (enabled === 0 || _self.numPoints == 0) ? _self.defaultValue : calculatePoint();

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
                    for (let index = 0; index < _self.numPoints; index++) {
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
