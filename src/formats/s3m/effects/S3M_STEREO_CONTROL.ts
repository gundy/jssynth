import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectS3mStereoControl extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param > 7) {
      param = param - 16;
    }
    param = param + 8;
    channelState.panPos = ((param / 15)-0.5) * 2.0;
  }
}

export const S3M_STEREO_CONTROL : Effect = new EffectS3mStereoControl()
