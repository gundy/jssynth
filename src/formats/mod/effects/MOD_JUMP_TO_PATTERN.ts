import {AbstractEffect} from './AbstractEffect';
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModJumpToPattern extends AbstractEffect {
  div (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    playerState.jumpToPattern = param;
  }
}

export const MOD_JUMP_TO_PATTERN : Effect = new EffectModJumpToPattern();
