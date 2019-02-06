import {AbstractEffect} from './AbstractEffect';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

class EffectModSampleOffset extends AbstractEffect {
 div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    mixer.setSamplePosition(chan, param * 256);
  }
}

export const MOD_SAMPLE_OFFSET : Effect = new EffectModSampleOffset()
