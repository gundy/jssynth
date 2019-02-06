import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectS3mTremor extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    console && console.log && console.log("S3M Tremor; Does this sound okay?!");
    if (param > 0x00) {
      channelState.effectState.tremorParam = param;
    }
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let x = (param & 0xf0) / 16;
    let y = param & 0x0f;
    channelState.effectState.tremorCount = ((channelState.effectState.tremorCount + 1) % (x+y));
    if (channelState.effectState.tremorCount < x) {
      channelState.volume = channelState.lastVolume;
    } else {
      channelState.volume = 0;
    }
  }
}

export const S3M_TREMOR : Effect = new EffectS3mTremor()
