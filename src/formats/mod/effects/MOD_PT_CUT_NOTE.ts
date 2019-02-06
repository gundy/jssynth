import {AbstractEffect} from "./AbstractEffect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerCutNote extends AbstractEffect {
  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (playerState.tick >= param) {
      channelState.volume = 0;
    }
    channelState.lastVolume = channelState.volume;
  }
}

export const MOD_PT_CUT_NOTE : Effect = new EffectModProtrackerCutNote();
