import {AbstractEffect} from './AbstractEffect';
import {MOD_VIBRATO} from './MOD_VIBRATO';
import {MOD_VOLUME_SLIDE} from './MOD_VOLUME_SLIDE';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModVibratoPlusVolumeSlide extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    MOD_VOLUME_SLIDE.tick(mixer, chan, param, playerState, channelState);
    MOD_VIBRATO.tick(mixer, chan, param, playerState, channelState);
  }
}

export const MOD_VIBRATO_PLUS_VOL_SLIDE: Effect = new EffectModVibratoPlusVolumeSlide();
