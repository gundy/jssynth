import {MOD_PORTA_TO_NOTE} from './MOD_PORTA_TO_NOTE';
import {MOD_VOLUME_SLIDE} from './MOD_VOLUME_SLIDE';
import {AbstractEffect} from "./AbstractEffect";
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModPortaPlusVolSlide extends AbstractEffect {
  public allowPeriodChange: boolean = false;

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (period != 0) {
      channelState.effectState.portToNoteDestPeriod = period;
      if (!channelState.effectState.portToNoteSpeed) {
        channelState.effectState.portToNoteSpeed = 0x00;
      }
    }
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    MOD_PORTA_TO_NOTE.tick(mixer, chan, param, playerState, channelState);
    MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
  }
}

export const MOD_PORTA_PLUS_VOL_SLIDE : Effect = new EffectModPortaPlusVolSlide();
