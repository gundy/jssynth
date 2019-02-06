import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModProtrackerFineVolumeSlideDown extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    channelState.volume -= param;
    if (channelState.volume < 0) {
      channelState.volume = 0;
    }
    channelState.lastVolume = channelState.volume;  }
}

export const MOD_PT_FINE_VOLSLIDE_DOWN : Effect = new EffectModProtrackerFineVolumeSlideDown();
