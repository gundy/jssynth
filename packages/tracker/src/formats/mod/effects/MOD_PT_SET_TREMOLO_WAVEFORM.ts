import {AbstractEffect} from "./AbstractEffect";
import {Effect} from "../../Effect";

class EffectModProtrackerSetTremoloWaveform extends AbstractEffect {
  div(mixer, chan, param, playerState, channelState, period, note, song) {
    channelState.effectState.tremoloParams.waveform = param & 0x07;
  }
}

export const MOD_PT_SET_TREMOLO_WAVEFORM : Effect = new EffectModProtrackerSetTremoloWaveform();
