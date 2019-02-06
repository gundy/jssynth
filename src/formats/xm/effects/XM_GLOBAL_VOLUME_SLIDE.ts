import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectXmGlobalVolumeSlide extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param == 0x00) {
      param = channelState.effectState.lastXMGlobalVolSlide || 0x00;
    }
    channelState.effectState.lastXMGlobalVolSlide = param;
    var a = (param & 0xf0) / 16;
    var b = param & 0x0f;
    if (playerState.fastS3MVolumeSlides) {
      if (b === 0x00 && a !== 0x00) {
        playerState.globalVolume += a;
      } else if (a === 0x00 && b !== 0x00) {
        playerState.globalVolume -= b;
      }
    }
    if (b === 0x0f) {
      playerState.globalVolume += a;
    } else if (a === 0x0f) {
      playerState.globalVolume -= b;
    }
    playerState.globalVolume = playerState.globalVolume < 0 ? 0 : playerState.globalVolume > 64 ? 64 : playerState.globalVolume;
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    var slideAmt = channelState.effectState.lastXMGlobalVolSlide;
    var a = (slideAmt & 0xf0) / 16;
    var b = (slideAmt & 0x0f);
    if (b === 0x00 && a !== 0x00) {
      playerState.globalVolume += a;
    } else if (a === 0x00 && b !== 0x00) {
      playerState.globalVolume -= b;
    }
    playerState.globalVolume = playerState.globalVolume < 0 ? 0 : playerState.globalVolume > 64 ? 64 : playerState.globalVolume;
  }
}

export const XM_GLOBAL_VOLUME_SLIDE : Effect = new EffectXmGlobalVolumeSlide()
