import {AbstractEffect} from '../../mod/effects/AbstractEffect';
import {VIBRATO_TABLE} from '../../mod/effects/VIBRATO_TABLE';
import {Effect} from "../../Effect";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";

class EffectS3mFineVibrato extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let vibParams = channelState.effectState.vibratoParams || {
      waveform: 0,
      pos: 0,
      depth: 0,
      speed: 0
    };
    if (vibParams.waveform <= 3 && period > 0) {
      vibParams.pos = 0;
    }
    if (param > 0x00) {
      let newDepth = param & 0x0f;
      if (newDepth > 0) {
        vibParams.depth = newDepth;
      }
      let newSpeed = ((param & 0xf0) / 16);
      if (newSpeed > 0) {
        vibParams.speed = newSpeed;
      }
    }
    channelState.effectState.vibratoParams = vibParams;
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    var lookupPeriodOffset = function(p) { return (VIBRATO_TABLE[p.waveform & 0x03][p.pos] * p.depth / 128); };
    var updatePos = function(p) { p.pos = (p.pos + p.speed) % 64; };
    var vibParams = channelState.effectState.vibratoParams;
    if (vibParams) {
      updatePos(vibParams);
      channelState.period = channelState.lastPeriod + lookupPeriodOffset(vibParams) ;
    }
  }
}

export const S3M_FINE_VIBRATO : Effect = new EffectS3mFineVibrato();
