import {Mixer} from "./Mixer";
import {MixResult} from "./MixResult";

/* WEB AUDIO OUTPUT SUPPORT */
const WA_BUF_SIZE: number = 2048;
const WA_NUM_OUTPUT_CHANNELS: number = 2;

/**
 * Web Audio ("ScriptProcessorNode") audio output functionality
 * @param mixer A mixer function that gets called periodically to produce new sampled audio data.
 *              mixer provides a single method "mix(sampleRate)" - where sampleRate is, eg. 44100.
 * @param bufferSize the desired size of the output buffer
 * @constructor
 */
export class WebAudioDriver {
  public start: () => void;
  public stop: () => void;
  private context: AudioContext;
  private node: ScriptProcessorNode;
  private nextSamples: MixResult;
  private nextSamplesOffset: number;


  constructor(mixer: Mixer, bufferSize: number) {
    let self: WebAudioDriver = this;

    if (window.hasOwnProperty('webkitAudioContext') && !window.hasOwnProperty('AudioContext')) {
      // @ts-ignore
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

    let processSamples = function(event: AudioProcessingEvent) {
      let outputBuffer: AudioBuffer = event.outputBuffer;
      let sampleRate: number = outputBuffer.sampleRate;
      let bufferLength: number = outputBuffer.length;
      // get output buffers from the AudioProcessingEvent
      let channelData = [ outputBuffer.getChannelData(0), outputBuffer.getChannelData(1) ];
      let i = null;
      let outputOfs = 0;

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
        for (let chan = 0; chan < WA_NUM_OUTPUT_CHANNELS; chan++) {
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
      self.node.connect(self.context.destination);
      self.node.onaudioprocess = processSamples;
    };

    /**
     * Stop/pause the audio output
     */
    this.stop = function() {
      self.node.disconnect();
      self.node.onaudioprocess = undefined;
    };

  }

}

