import {AbstractEffect} from './AbstractEffect';
import {Effect} from "../../Effect";
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";

class EffectModPan extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param <= 0x80) {
      channelState.panPos = ((param / 128)-0.5)*2.0;
    } else if (param == 0xa4) {
      channelState.panPos=-100; /* surround */
    }
  }
}

export const MOD_PAN : Effect = new EffectModPan();
