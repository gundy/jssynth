import {Song} from "./Song";
import {Mixer} from "../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../Player";
import {PatternNote} from "./PatternNote";

export interface Effect {
    div: (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) => void
    tick: (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) => void
    allowSampleTrigger: boolean
    allowVolumeChange: boolean
    allowPeriodChange: boolean
}

export interface EffectMapEntry {
    code: string,
    effect: Effect
}

