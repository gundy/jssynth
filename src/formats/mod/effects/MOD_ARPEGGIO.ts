"use strict";

import {AbstractEffect} from './AbstractEffect';
import {MOD_PERIOD_TABLE} from '../MOD_PERIOD_TABLE';
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";
import {Effect} from "../../Effect";

class EffectModArpeggio extends AbstractEffect {
  div (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let currentNote = MOD_PERIOD_TABLE.getNote(channelState.lastPeriod);
    if (param != 0x00) {
      if (currentNote < 0 || currentNote > 108) {
        channelState.effectState.arpTable = [ channelState.period, channelState.period, channelState.period];
      } else {
        let a = (param & 0xf0) / 16;
        let b = (param & 0x0f);
        channelState.effectState.arpTable = [
          MOD_PERIOD_TABLE.getPeriod(currentNote),
          MOD_PERIOD_TABLE.getPeriod(currentNote+a),
          MOD_PERIOD_TABLE.getPeriod(currentNote+b)
        ];
        channelState.effectState.arpPos = 0;
      }
    }
  }

  tick (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    if (param != 0x00) {
      channelState.effectState.arpPos = (channelState.effectState.arpPos + 1) % 3;
      channelState.period = channelState.effectState.arpTable[channelState.effectState.arpPos];
    }
  }
}

export const MOD_ARPEGGIO : Effect = new EffectModArpeggio();
