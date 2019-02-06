import {AbstractEffect} from './AbstractEffect';

import {MOD_PT_SET_FILTER} from './MOD_PT_SET_FILTER';
import {MOD_PT_FINE_PORTA_UP} from './MOD_PT_FINE_PORTA_UP';
import {MOD_PT_FINE_PORTA_DOWN} from './MOD_PT_FINE_PORTA_DOWN';
import {MOD_PT_GLISSANDO_CONTROL} from './MOD_PT_GLISSANDO_CONTROL';
import {MOD_PT_SET_VIBRATO_WAVEFORM} from './MOD_PT_SET_VIBRATO_WAVEFORM';
import {MOD_PT_SET_FINETUNE} from './MOD_PT_SET_FINETUNE';
import {MOD_PT_PATTERN_LOOP} from './MOD_PT_PATTERN_LOOP';
import {MOD_PT_SET_TREMOLO_WAVEFORM} from './MOD_PT_SET_TREMOLO_WAVEFORM';
import {MOD_PT_16_POS_PAN} from './MOD_PT_16_POS_PAN';
import {MOD_PT_RETRIG_NOTE} from './MOD_PT_RETRIG_NOTE';
import {MOD_PT_FINE_VOLSLIDE_UP} from './MOD_PT_FINE_VOLSLIDE_UP';
import {MOD_PT_FINE_VOLSLIDE_DOWN} from './MOD_PT_FINE_VOLSLIDE_DOWN';
import {MOD_PT_CUT_NOTE} from './MOD_PT_CUT_NOTE';
import {MOD_PT_DELAY_NOTE} from './MOD_PT_DELAY_NOTE';
import {MOD_PT_DELAY_PATTERN} from './MOD_PT_DELAY_PATTERN';
import {MOD_PT_INVERT_LOOP} from './MOD_PT_INVERT_LOOP';
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Effect} from "../../Effect";

const PROTRACKER_EFFECTS = {
    /* protracker commands */
    0xe0: MOD_PT_SET_FILTER,
    0xe1: MOD_PT_FINE_PORTA_UP,
    0xe2: MOD_PT_FINE_PORTA_DOWN,
    0xe3: MOD_PT_GLISSANDO_CONTROL,
    0xe4: MOD_PT_SET_VIBRATO_WAVEFORM,
    0xe5: MOD_PT_SET_FINETUNE,
    0xe6: MOD_PT_PATTERN_LOOP,
    0xe7: MOD_PT_SET_TREMOLO_WAVEFORM,
    0xe8: MOD_PT_16_POS_PAN,
    0xe9: MOD_PT_RETRIG_NOTE,
    0xea: MOD_PT_FINE_VOLSLIDE_UP,
    0xeb: MOD_PT_FINE_VOLSLIDE_DOWN,
    0xec: MOD_PT_CUT_NOTE,
    0xed: MOD_PT_DELAY_NOTE,
    0xee: MOD_PT_DELAY_PATTERN,
    0xef: MOD_PT_INVERT_LOOP
};

class EffectModProtracker extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let newEffect = 0xe0 + ((param & 0xf0) / 16);
    let newParam = param & 0x0f;
    PROTRACKER_EFFECTS[newEffect].div(mixer, chan, newParam, playerState, channelState, period, note, song);
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let newEffect = 0xe0 + ((param & 0xf0) / 16);
    let newParam = param & 0x0f;
    PROTRACKER_EFFECTS[newEffect].tick(mixer, chan, newParam, playerState, channelState);
  }
}

export const MOD_PROTRACKER : Effect = new EffectModProtracker();
