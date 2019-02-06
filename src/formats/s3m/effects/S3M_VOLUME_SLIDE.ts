import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectS3mVolumeSlide extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param == 0x00) {
      param = channelState.effectState.lastS3MVolSlide || 0x00;
    }
    channelState.effectState.lastS3MVolSlide = param;
    let a = (param & 0xf0) / 16;
    let b = param & 0x0f;
    if (playerState.fastS3MVolumeSlides) {
      if (b === 0x00 && a !== 0x00) {
        channelState.volume += a;
      } else if (a === 0x00 && b !== 0x00) {
        channelState.volume -= b;
      }
    }
    if (b === 0x0f) {
      channelState.volume += a;
    } else if (a === 0x0f) {
      channelState.volume -= b;
    }
    channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
    channelState.lastVolume = channelState.volume;
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let slideAmt = channelState.effectState.lastS3MVolSlide;
    let a = (slideAmt & 0xf0) / 16;
    let b = (slideAmt & 0x0f);
    if (b === 0x00 && a !== 0x00) {
      channelState.volume += a;
    } else if (a === 0x00 && b !== 0x00) {
      channelState.volume -= b;
    }
    channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
    channelState.lastVolume = channelState.volume;
  }
}

export const S3M_VOLUME_SLIDE : Effect = new EffectS3mVolumeSlide()
