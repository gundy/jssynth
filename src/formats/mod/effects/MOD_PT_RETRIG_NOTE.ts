import {AbstractEffect} from './AbstractEffect';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectModProtrackerRetriggerNote extends AbstractEffect {

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if ((playerState.tick + 1) % param == 0) {
      mixer.setSamplePosition(chan, 0);
    }
  }
}

export const MOD_PT_RETRIG_NOTE: Effect = new EffectModProtrackerRetriggerNote();
