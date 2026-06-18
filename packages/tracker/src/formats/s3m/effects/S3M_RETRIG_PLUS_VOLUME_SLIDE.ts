import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {S3M_RETRIG_TABLE} from './S3M_RETRIG_TABLE';
import {Effect} from "../../Effect";


class EffectS3mRetrigPlusVolumeSlide extends AbstractEffect {

  div(mixer, chan, param, playerState, channelState, period, note, song) {
    if ((param & 0xf0) != 0x00) {
      channelState.effectState.lastS3MRetrigVolSldParam = (param & 0xf0) / 16;
    }
    if ((param & 0x0f) != 0x00) {
      channelState.effectState.lastS3MRetrigRetrigTickParam = (param & 0x0f);
    }
  }

  tick(mixer, chan, param, playerState, channelState, period, note, song) {
    let retrigTicks = channelState.effectState.lastS3MRetrigRetrigTickParam || 0x00;
    let volSld = channelState.effectState.lastS3MRetrigVolSldParam || 0x00;
    if ((playerState.tick + 1) % retrigTicks == 0) {
      mixer.setSamplePosition(chan, 0);
      channelState.volume = S3M_RETRIG_TABLE[volSld](channelState.volume);
    }
    channelState.volume = channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume;
    channelState.lastVolume = channelState.volume;
  }
}

export const S3M_RETRIG_PLUS_VOLUME_SLIDE : Effect = new EffectS3mRetrigPlusVolumeSlide()
