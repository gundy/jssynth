import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectS3mSetGlobalVolume extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    playerState.globalVolume = param;
  }
}

export const S3M_SET_GLOBAL_VOLUME : Effect = new EffectS3mSetGlobalVolume()
