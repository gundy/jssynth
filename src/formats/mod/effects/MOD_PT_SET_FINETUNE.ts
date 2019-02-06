import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

const EIGHTH_SEMITONE_MULTIPLIER = Math.pow(2, 1/(12*8));

class EffectModProtrackerSetFinetune extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (note.sampleNumber != 0) {
      let sample = channelState.sample;
      sample.metadata.pitchOfs = Math.pow(EIGHTH_SEMITONE_MULTIPLIER, (param < 8 ? param : (param - 16)));
    }
  }
}

export const MOD_PT_SET_FINETUNE : Effect = new EffectModProtrackerSetFinetune();
