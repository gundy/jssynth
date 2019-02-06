import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerDelayPattern extends AbstractEffect {
 div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    playerState.patternDelay = param * playerState.speed;
  }
}

export const MOD_PT_DELAY_PATTERN : Effect = new EffectModProtrackerDelayPattern();
