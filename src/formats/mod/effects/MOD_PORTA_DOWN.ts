import {SLIDE_CONFIG} from './SLIDE_CONFIG';
import {AbstractEffect} from "./AbstractEffect";
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

export class EffectModPortamentoDown extends AbstractEffect {
  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.effectState.portAmt = param * 4;
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.period += channelState.effectState.portAmt;
    if (channelState.period > SLIDE_CONFIG.MAX_SLIDE_PERIOD) {
      channelState.period = SLIDE_CONFIG.MAX_SLIDE_PERIOD;
    }
  }
}

export const MOD_PORTA_DOWN : Effect = new EffectModPortamentoDown();
