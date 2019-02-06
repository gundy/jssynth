import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModPatternBreak extends AbstractEffect {
  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let x = ((param & 0xf0) / 16);
    let y = param & 0x0f;
    playerState.breakToRow = x * 10 + y;
  }
}

export const MOD_PATTERN_BREAK : Effect = new EffectModPatternBreak();
