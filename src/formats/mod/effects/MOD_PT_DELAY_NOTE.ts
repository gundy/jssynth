import {AbstractEffect} from './AbstractEffect';
import {MOD_PERIOD_TABLE} from '../MOD_PERIOD_TABLE';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerDelayNote extends AbstractEffect {
  public allowPeriodChange: boolean = false;
  public allowSampleTrigger: boolean = false;
  public allowVolumeChange: boolean = false;

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let noteToPlay = note.note;
    if (noteToPlay < 0) {
      noteToPlay = MOD_PERIOD_TABLE.getNote(period);
    }
    let instrument = note.sampleNumber > 0 ? song.instruments[note.sampleNumber - 1] : null;
    let sample = null;
    if (instrument && noteToPlay > 0) {
      let sampleNum = instrument.metadata.noteToSampleMap[noteToPlay];
      sample = instrument.samples[sampleNum];
    }
    channelState.effectState.noteDelay = {
      delay: param,
      note: note,
      sample: sample
    };
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (playerState.tick == (param - 1)) {
      let note = channelState.effectState.noteDelay.note;

      let period = note.note < 0 ? 0 : MOD_PERIOD_TABLE.getPeriod(note.note);
      let volume = note.volume;
      let sample =  channelState.effectState.noteDelay.sample;
      if (sample) {
        mixer.setSample(chan, sample);
        channelState.volume = sample.metadata.volume;
        channelState.lastVolume = sample.metadata.volume;
      }
      if (period > 0) {
        channelState.period = period;
        channelState.lastPeriod = period;
        mixer.setSamplePosition(chan, 0);
      }
      if (volume >= 0) {
        channelState.volume = volume;
        channelState.lastVolume = volume;
      }
    }
  }
}

export const MOD_PT_DELAY_NOTE : Effect = new EffectModProtrackerDelayNote();
