import {AbstractEffect} from './AbstractEffect';
import {INVERT_LOOP_TABLE} from './INVERT_LOOP_TABLE';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "@gundy/jssynth-core";
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

      /*
       * KNOWN LATENT BUG (preserved bit-exactly in M2, do not "fix" here):
       * sample.data is channel-major (Float32Array per channel), but this indexes
       * it as if it were a flat number[]. So this has never actually inverted
       * sample bytes — it's effectively a no-op. Correcting it (data[0][idx]) would
       * change how EFx "invert loop" songs sound, which is a deliberate audio change
       * for a later effects pass, not this refactor. The cast keeps the original
       * runtime behaviour exactly while satisfying the corrected Float32Array[] type.
       */
      const flatData = currentSample.data as unknown as number[];
      const invertIdx = currentSample.metadata.repeatStart + channelState.effectState.invertLoop.pos;
      flatData[invertIdx] = (0 - flatData[invertIdx]);
    }
  }
}

export const MOD_PT_INVERT_LOOP : Effect = new EffectModProtrackerInvertLoop();
