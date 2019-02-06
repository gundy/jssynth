import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {SLIDE_CONFIG} from '../../mod/effects/SLIDE_CONFIG';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectS3mPortamentoDown extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param == 0x00) {
      param = channelState.effectState.lastS3MPortDown || 0x00;
    }
    channelState.effectState.lastS3MPortDown = param;
    let a = (param & 0xf0) / 16;
    let b = param & 0x0f;
    if (a == 0x0f) {
      channelState.period += b * 4;
    } else if (a == 0x0e) {
      channelState.period += b;
    }
    if (channelState.period > SLIDE_CONFIG.MAX_SLIDE_PERIOD) {
      channelState.period = SLIDE_CONFIG.MAX_SLIDE_PERIOD;
    }
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let slideAmt = channelState.effectState.lastS3MPortDown;
    let a = (slideAmt & 0xf0) / 16;
    let b = (slideAmt & 0x0f);
    if (a < 0x0e) {
      channelState.period += ((a * 16) + b) * 4;
    }
    if (channelState.period > SLIDE_CONFIG.MAX_SLIDE_PERIOD) {
      channelState.period = SLIDE_CONFIG.MAX_SLIDE_PERIOD;
    }
  }
}

export const S3M_PORTA_DOWN : Effect = new EffectS3mPortamentoDown();
