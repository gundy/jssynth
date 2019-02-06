import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerPatternLoop extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let doLoop = function() {
      channelState.effectState.patternLoop.count--;
      playerState.l_breakToRow = channelState.effectState.patternLoop.row;
      playerState.l_jumpToPattern = playerState.pos;
    };
    if (param == 0x00) {
      /* start loop */
      channelState.effectState.patternLoop.row = playerState.row;
    } else {
      if (channelState.effectState.patternLoop.count == null) {
        channelState.effectState.patternLoop.count = param;
        doLoop();
      } else {
        if (channelState.effectState.patternLoop.count != 0) {
          doLoop();
        } else {
          channelState.effectState.patternLoop.count = null;
        }
      }
    }
  }
}

export const MOD_PT_PATTERN_LOOP : Effect = new EffectModProtrackerPatternLoop();
