import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {Effect} from "../../Effect";

class EffectS3mSetTempo extends AbstractEffect {

  div(mixer, chan, param, playerState, channelState, period, note, song) {
    playerState.bpm = param;
  }
}

export const S3M_SET_TEMPO : Effect = new EffectS3mSetTempo()
