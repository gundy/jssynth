import {AbstractEffect} from './AbstractEffect';
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModProtrackerFinePortamentoUp extends AbstractEffect {
  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.period -= param * 4;
    channelState.lastPeriod = channelState.period;
  }
}

export const MOD_PT_FINE_PORTA_UP : Effect = new EffectModProtrackerFinePortamentoUp();
