"format es6";

/* WEB AUDIO OUTPUT SUPPORT */
var WA_BUF_SIZE = 2048;
var WA_NUM_OUTPUT_CHANNELS = 2;

/**
 * Web Audio ("ScriptProcessorNode") audio output functionality
 * @param mixer A mixer function that gets called periodically to produce new sampled audio data.
 *              mixer provides a single method "mix(sampleRate)" - where sampleRate is, eg. 44100.
 * @param bufferSize the desired size of the output buffer
 * @constructor
 */
export class WebAudioDriver {
    constructor(mixer, bufferSize) {
        var self = this;

        if (window.hasOwnProperty('webkitAudioContext') && !window.hasOwnProperty('AudioContext')) {
            window.AudioContext = window.webkitAudioContext;
        }

        if (!window.hasOwnProperty('AudioContext')) {
            throw new Error("Unable to use WebAudioDriver in this browser.");
        }

        this.context = new AudioContext();
        this.node = this.context.createScriptProcessor(bufferSize || WA_BUF_SIZE, 0, WA_NUM_OUTPUT_CHANNELS);

        // array of samples to be written to audio output device
        this.nextSamples = null;
        // offset into nextSamples array that we're currently up to
        this.nextSamplesOffset = 0;

        var processSamples = function(event) {
            var outputBuffer = event.outputBuffer;
            var sampleRate = outputBuffer.sampleRate;
            var bufferLength = outputBuffer.length;
            // get output buffers from the AudioProcessingEvent
            var channelData = [ outputBuffer.getChannelData(0), outputBuffer.getChannelData(1) ];
            var i = null;
            var outputOfs = 0;

            // bufferLength is the amount of data that the audio system is expecting
            // - we need to keep looping until we've filled it all up.
            while (outputOfs < bufferLength) {

                // if we're out of samples the simply call the mixer to create some more
                if (!self.nextSamples) {
                    self.nextSamples = mixer.mix(sampleRate);
                    self.nextSamplesOffset = 0;
                }

                // fill the output buffers with stuff from the nextSamples buffer
                // (at least until we fill the output buffer, or drain the nextSamples array)
                for (var chan = 0; chan < WA_NUM_OUTPUT_CHANNELS; chan++) {
                    for (i = 0; ((self.nextSamplesOffset+i) < self.nextSamples.bufferSize) && ((i + outputOfs) < bufferLength); i++) {
                        channelData[chan][outputOfs+i] = self.nextSamples.output[chan][self.nextSamplesOffset + i];
                    }
                }
                outputOfs += i;
                self.nextSamplesOffset += i;

                // if we've emptied the nextSamples array, then null it out so it will get
                // replenished from the mixer next time around the loop.
                if (self.nextSamplesOffset >= self.nextSamples.bufferSize) {
                    self.nextSamples = null;
                }
            }
        };

        /**
         * Start the audio output
         */
        this.start = function() {
            this.node.connect(self.context.destination);
            this.node.onaudioprocess = processSamples;
        };

        /**
         * Stop/pause the audio output
         */
        this.stop = function() {
            this.node.disconnect();
            this.node.onaudioprocess = undefined;
        };

    }

}

