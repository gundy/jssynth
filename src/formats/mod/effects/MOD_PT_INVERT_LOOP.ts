import {AbstractEffect} from './AbstractEffect';
import {INVERT_LOOP_TABLE} from './INVERT_LOOP_TABLE';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerInvertLoop extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.effectState.invertLoop.delay = 0;
    let sample = channelState.sample;
    if (sample) {
      channelState.effectState.invertLoop.sample = sample;
    }
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let currentSample = channelState.effectState.invertLoop.sample;

    channelState.effectState.invertLoop.delay += INVERT_LOOP_TABLE[param];
    let repeatLength = currentSample.metadata.repeatEnd - currentSample.metadata.repeatStart;
    if (currentSample && repeatLength > 2 && channelState.effectState.invertLoop.delay >= 128) {
      channelState.effectState.invertLoop.delay = 0;

      channelState.effectState.invertLoop.pos ++;
      if (channelState.effectState.invertLoop.pos > repeatLength) {
        channelState.effectState.invertLoop.pos = 0;
      }

      currentSample.data[currentSample.metadata.repeatStart+channelState.effectState.invertLoop.pos] =
        (0 - currentSample.data[currentSample.metadata.repeatStart+channelState.effectState.invertLoop.pos]);
    }
  }
}

export const MOD_PT_INVERT_LOOP : Effect = new EffectModProtrackerInvertLoop();
