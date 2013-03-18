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
jssynth.ns("demos.additive_synth");

(function() {
    "use strict";

    jssynth.demos.additive_synth.Harmonic = function(h) {
        this.freqMul = ko.observable(h || 1);
        this.dB = ko.observable(-90);
        this.random = ko.observable(((Math.random() - 0.5)* 0.005) + 1)
    }

    jssynth.demos.additive_synth.Mixer = function(h) {
        this.baseFrequency = ko.observable(262.5); /* middle c */
        var numHarmonics = h || 6;
        this.harmonics = ko.observableArray([]);
        for (var i = 0; i < numHarmonics; i++) {
            this.harmonics.push(new jssynth.demos.additive_synth.Harmonic(i+1));
        }
        this.secondsToMix = ko.observable(0.1);
        this.globalVolume = ko.observable(64);
        this.clip = ko.observable(false);
        this.additiveSynthState = {};
    }

    var rational_tanh = function(x) {
        if( x < -3 )
            return -1;
        else if( x > 3 )
            return 1;
        else
            return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
    }

    jssynth.demos.additive_synth.Mixer.prototype.mix = function(sr) {
        var sampleRate = sr || 44100;
        var numSamples = Math.floor(this.secondsToMix() * sampleRate);
        var synthSamples = jssynth.additiveSynth(numSamples, sampleRate, this.baseFrequency(), ko.toJS(this.harmonics), this.globalVolume(), this.additiveSynthState);
        if (this.clip()) {
            for (var i = 0; i < numSamples; i++) {
                synthSamples[i] = rational_tanh(synthSamples[i]);
            }
        }
        return {
            bufferSize: numSamples,
            output: [ synthSamples, synthSamples ]
        };
    }
})();