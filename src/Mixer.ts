import {Filter} from "./Filter";
import {Utils} from './Utils';
import {Sample, SampleRepeatType} from './Sample'
import {MixResult} from "./MixResult";

interface MixerGlobalState {
  numChannels: number,
  volume: number,
  secondsPerMix: number,
  filters: Filter[]
}

const DEFAULT_GLOBAL_STATE: MixerGlobalState = {
  numChannels: 8,
  volume: 64,
  secondsPerMix: 0.1,
  filters: null
}

interface MixerChannelState {
  panPos: number,  /* -1 = full left, +1 = full right */
  playbackFreqHz: number,
  sample: Sample,
  samplePosition: number,
  volume: number,
  enabled: boolean
}

const DEFAULT_CHANNEL_STATE: MixerChannelState = {
  panPos: 0,  /* -1 = full left, +1 = full right */
  playbackFreqHz: 0,
  sample: undefined,
  samplePosition: -1,
  volume: 64,
  enabled: true
};

const STEP_FUNCS = {
  "REP_NORMAL": function (samplePos: number, samplePosStep: number, repEnd: number, repLen: number) {
    let spTmp = samplePos;
    spTmp += samplePosStep;
    while (spTmp >= repEnd) {
      spTmp -= repLen;
    }
    return spTmp;
  },
  "NON_REPEATING": function (samplePos, samplePosStep) {
    return samplePos + samplePosStep;
  }
}

export class Mixer {
  private globalState: MixerGlobalState;
  private preMixCallback: (mixer: Mixer, sampleRate: number) => void;
  private preMixObject: any;
  private postMixCallback: (mixResult: MixResult) => void;
  private postMixObject : any;
  private readonly channelState: MixerChannelState[];  /* channel state array itself is readonly - channels not so much */

  constructor(globalState: {[key: string]:any}, defaultChannelState?: {[key: string]: any}) {
    this.globalState = Utils.merge(DEFAULT_GLOBAL_STATE, globalState);
    this.preMixCallback = null;
    this.preMixObject = null;
    this.postMixCallback = null;
    this.postMixObject = null;
    this.channelState = [];
    let dcs = Utils.merge(DEFAULT_CHANNEL_STATE, defaultChannelState || {});
    for (let chan = 0; chan < this.globalState.numChannels; chan++) {
      this.channelState[chan] = Utils.clone(dcs);
    }
  }
  /**
   * Set the callback to be called prior to mixing the next batch of samples.
   *
   * Note: sample mixing is driven by the audio event loop -
   *
   * @param preMixCallback callback function to provide notification toolbar
   * @param preMixObject object that will receive the notification (sets this)
   */
  setPreMixCallback(preMixCallback: (mixer: Mixer, sampleRate: number) => void, preMixObject: any) {
    this.preMixCallback = preMixCallback;
    this.preMixObject = preMixObject;
  }

  /**
   * Set the callback to be called after mixing the next batch of samples
   * @param postMixCallback
   * @param postMixObject
   */
  setPostMixCallback(postMixCallback: (mixResult: MixResult) => void, postMixObject: any) {
    this.postMixCallback = postMixCallback;
    this.postMixObject = postMixObject;
  }


  setGlobalVolume(vol: number) {
    this.globalState.volume = vol;
  }

  /**
   * Set the number of seconds worth of data to return from each mix() call
   * @param secondsPerMix
   */
  setSecondsPerMix(secondsPerMix: number) {
    this.globalState.secondsPerMix = secondsPerMix;
  }

  /**
   * Trigger a sample to start playing on a given channel
   * @param channel channel to play the sample on
   * @param sample sample to play
   * @param freqHz frequency (absolute) to play the sample at
   */
  triggerSample(channel: number, sample: Sample, freqHz: number) {
    this.channelState[channel].sample = sample;
    this.channelState[channel].playbackFreqHz = freqHz;
    this.channelState[channel].samplePosition = 0;
    this.channelState[channel].volume = sample.metadata.volume;
  }

  /**
   * @param channels a list of channels to enable
   */
  enableChannels(channels: number[]) {
    for (let i = 0; i < channels.length ; i++) {
      this.channelState[channels[i]].enabled = true;
    }
  }

  /**
   * @param channels a list of channels to disable
   */
  disableChannels(channels: number[]) {
    for (let i = 0; i < channels.length ; i++) {
      this.channelState[channels[i]].enabled = false;
    }
  }

  /**
   * Set sample without updating any other params
   * @param channel channel to play the sample on
   * @param sample sample to play
   * @param freqHz frequency (absolute) to play the sample at
   */
  setSample(channel: number, sample: Sample) {
    this.channelState[channel].sample = sample;
  };


  /**
   * Set the current position/offset of the sample playing on a given channel
   * @param channel
   * @param offset
   */
  setSamplePosition(channel: number, offset: number) {
    let sample = this.channelState[channel].sample;
    if (sample) {
      let length = sample.metadata.sampleLength;
      if (sample.metadata.repeatType !== SampleRepeatType.NON_REPEATING) {
        let repStart = sample.metadata.repeatStart;
        let repEnd = sample.metadata.repeatEnd;
        let repLen = repEnd - repStart;
        while (offset > length) {
          offset -= repLen;
        }
      }
      if (offset < length) {
        this.channelState[channel].samplePosition = offset;
      } else {
        this.channelState[channel].samplePosition = -1;
      }
    }
  }

  /**
   * Add a phase offset to the sample playing on a given channel
   * @param channel
   * @param offset
   */
  addToSamplePosition(channel: number, offset: number) {
    let sample = this.channelState[channel].sample;
    if (sample && this.channelState[channel].samplePosition >= 0) {
      this.setSamplePosition(channel, this.channelState[channel].samplePosition + offset);
    }
  }

  /**
   * Change the frequency of a sample playing on a given channel
   * @param channel
   * @param freqHz
   */
  setFrequency(channel: number, freqHz: number) {
    this.channelState[channel].playbackFreqHz = freqHz;
  }

  /**
   * Change the volume of a sample playing on a given channel
   * @param channel
   * @param vol
   */
  setVolume(channel: number, vol: number) {
    this.channelState[channel].volume = vol;
  }

  /**
   * Change the L/R mix for a given channel (-1 = full left, +1 = full right)
   * @param channel
   * @param panPos
   */
  setPanPosition(channel: number, panPos: number) {
    this.channelState[channel].panPos = panPos;
  }

  /**
   * (Immediately) cut playback of a sample playing on a given channel
   * @param channel
   */
  cut(channel: number) {
    this.channelState[channel].samplePosition = -1;
    this.channelState[channel].sample = undefined;
  }

  /**
   * Set globally applied filters (array, 0 = left filter, 1 = right filter)
   * @param filters
   */
  setFilters(filters: Filter[]) {
    if (filters) {
      this.globalState.filters = filters;
    } else {
      this.globalState.filters = null;
    }
  }

  /* TODO; not sure if things need to get this complicated for now */
  calculatePanMatrix(pp: number) {
    if (pp >= -1 && pp <= 1) {
      let new_pp = (pp + 1) / 2;   /* shift values from -1 to 1, to be in the range 0..1 (left -> right) */
      return {
        ll: 1-new_pp, /* left channel, % left mix */
        lr: 0, /* left channel, % right mix - TODO */
        rl: 0, /* right channel, % left mix */
        rr: new_pp  /* right channel, % right mix - TODO */
      };
    } else {
      return {ll: 1, rr: -1 };  /* surround */
    }
  };


  mix(sampleRate: number): MixResult {
    let self = this;
    if (this.preMixCallback) {
      this.preMixCallback.call(this.preMixObject, this, sampleRate);
    }
    let i = 0, chan = 0;
    let output = [];
    let numSamples = Math.floor(sampleRate * this.globalState.secondsPerMix);

    output[0] = Utils.makeArrayOf(0.0, numSamples); /* left */
    output[1] = output[0].slice(); /* copy - right */
    let numChannels = this.globalState.numChannels;
    let globalVolume = this.globalState.volume;
    for (chan = 0; chan < numChannels; chan++) {
      let state = this.channelState[chan];
      if (!state.enabled) {
        break;
      }

      let panPos = this.calculatePanMatrix(state.panPos);
      let sample = state.sample;

      let channelVolume = state.volume;
      let samplePos = state.samplePosition;
      let samplePosStep = state.playbackFreqHz / sampleRate;
      let scale = (1 / (numChannels / 2)) * (globalVolume / 64) * (channelVolume / 64);
      let leftScale = scale * panPos.ll;
      let rightScale = scale * panPos.rr;
      if (sample && sample.data && samplePos >= 0 && samplePosStep > 0) {
        let representedFreq = sample.metadata.representedFreq;
        let sampleSampleRate = sample.metadata.sampleRate;
        samplePosStep *= sampleSampleRate / representedFreq;

        let leftSampleData = sample.data[0];
        let rightSampleData = sample.data[1] || sample.data[0]; /* mix in mono if that's all we've got */
        let sampleLength = sample.metadata.sampleLength;
        let repStart = sample.metadata.repeatStart;
        let repEnd = sample.metadata.repeatEnd;
        let repLen = repEnd - repStart;
        let stepFunc;
        if (sample.metadata.repeatType === SampleRepeatType.REP_NORMAL) {
          stepFunc = STEP_FUNCS["REP_NORMAL"]
        } else {
          stepFunc = STEP_FUNCS["NON_REPEATING"]
        }
        for (i = 0; (i < numSamples) && (samplePos < sampleLength); i++) {
          output[0][i] += (leftSampleData[Math.floor(samplePos)] * leftScale);
          output[1][i] += (rightSampleData[Math.floor(samplePos)] * rightScale);
          samplePos = stepFunc(samplePos, samplePosStep, repEnd, repLen);
        }
      }
      state.samplePosition = samplePos;
    }
    if (this.globalState.filters) {
      let filters = this.globalState.filters;
      for (i = 0; i < numSamples; i++) {
        output[0][i] = filters[0].next(output[0][i]);
        output[1][i] = filters[1].next(output[1][i]);
      }
    }
    let mixResult = new MixResult(numSamples, output);
    if (this.postMixCallback) {
      window.setTimeout(function() {
        self.postMixCallback.call(self.postMixObject, mixResult)
      }, 0);
    }
    return mixResult;
  }


}


