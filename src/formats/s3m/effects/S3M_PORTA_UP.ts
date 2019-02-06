import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {SLIDE_CONFIG} from '../../mod/effects/SLIDE_CONFIG';
import {Effect} from "../../Effect";

class EffectS3mPortamentoUp extends AbstractEffect {
  div(mixer, chan, param, playerState, channelState, period, note, song) {
    if (param == 0x00) {
      param = channelState.effectState.lastS3MPortDown || 0x00;
    }
    channelState.effectState.lastS3MPortDown = param;
    let a = (param & 0xf0) / 16;
    let b = param & 0x0f;
    if (a == 0x0f) {
      channelState.period -= b * 4;
    } else if (a == 0x0e) {
      channelState.period -= b;
    }
    if (channelState.period < SLIDE_CONFIG.MIN_SLIDE_PERIOD) {
      channelState.period = SLIDE_CONFIG.MIN_SLIDE_PERIOD;
    }
  }

  tick(mixer, chan, param, playerState, channelState, period, note, song) {
    let slideAmt = channelState.effectState.lastS3MPortDown;
    let a = (slideAmt & 0xf0) / 16;
    let b = (slideAmt & 0x0f);
    if (a < 0x0e) {
      channelState.period -= ((a * 16) + b) * 4;
    }
    if (channelState.period < SLIDE_CONFIG.MIN_SLIDE_PERIOD) {
      channelState.period = SLIDE_CONFIG.MIN_SLIDE_PERIOD;
    }
  }
}

export const S3M_PORTA_UP : Effect = new EffectS3mPortamentoUp()
