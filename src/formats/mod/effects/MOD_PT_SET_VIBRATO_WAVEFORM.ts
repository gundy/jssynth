import {AbstractEffect} from "./AbstractEffect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerSetVibratoWaveform extends AbstractEffect {
  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.effectState.vibratoParams.waveform = param & 0x07;
  }
}

export const MOD_PT_SET_VIBRATO_WAVEFORM : Effect = new EffectModProtrackerSetVibratoWaveform();
