import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModVolumeSlide extends AbstractEffect {

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    var upAmt = (param & 0xf0) / 16,  downAmt = param & 0x0f;
    if (upAmt !== 0x00 && downAmt !== 0x00) {
      downAmt = 0x00;
    }
    channelState.volume += upAmt - downAmt;
    channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
    channelState.lastVolume = channelState.volume;
  }
}

export const MOD_VOLUME_SLIDE: Effect = new EffectModVolumeSlide();
