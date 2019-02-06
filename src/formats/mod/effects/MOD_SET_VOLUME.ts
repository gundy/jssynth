import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModSetVolume extends AbstractEffect {
  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.volume = param < 0 ? 0 : param > 0x40 ? 0x40 : param;
    channelState.lastVolume = channelState.volume;
  }
}

export const MOD_SET_VOLUME : Effect = new EffectModSetVolume();
