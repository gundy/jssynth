import {AbstractEffect} from './AbstractEffect';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectModProtrackerFinePortamentoDown extends AbstractEffect {
  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.period += param * 4;
    channelState.lastPeriod = channelState.period;
  }
}

export const MOD_PT_FINE_PORTA_DOWN : Effect = new EffectModProtrackerFinePortamentoDown();
