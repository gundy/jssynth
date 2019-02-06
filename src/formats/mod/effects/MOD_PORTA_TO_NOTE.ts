import {AbstractEffect} from "./AbstractEffect";
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModPortamentoToNote extends AbstractEffect {
  public allowPeriodChange:boolean = false;
  public allowSampleTrigger:boolean = false;

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (period != 0) {
      channelState.effectState.portToNoteDestPeriod = period;
      if (!channelState.effectState.portToNoteSpeed) {
        channelState.effectState.portToNoteSpeed = 0x00;
      }
      channelState.lastPeriod = period;
    }
    if (param != 0x00) {
      channelState.effectState.portToNoteSpeed = param * 4;
    }
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {

    if (channelState.effectState.portToNoteDestPeriod && channelState.effectState.portToNoteSpeed) {
      if (channelState.effectState.portToNoteDestPeriod > channelState.period) {
        channelState.period += channelState.effectState.portToNoteSpeed;
        if (channelState.period > channelState.effectState.portToNoteDestPeriod) {
          channelState.period = channelState.effectState.portToNoteDestPeriod;
          channelState.lastPeriod = channelState.period;
        }
      }
      if (channelState.effectState.portToNoteDestPeriod < channelState.period) {
        channelState.period -= channelState.effectState.portToNoteSpeed;
        if (channelState.period < channelState.effectState.portToNoteDestPeriod) {
          channelState.period = channelState.effectState.portToNoteDestPeriod;
          channelState.lastPeriod = channelState.period;
        }
      }
    }
  }
}

export const MOD_PORTA_TO_NOTE: Effect = new EffectModPortamentoToNote();
