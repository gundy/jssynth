import {AbstractEffect} from './AbstractEffect';
import {VIBRATO_TABLE} from './VIBRATO_TABLE';
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {Song} from "../../Song";
import {PatternNote} from "../../PatternNote";
import {Mixer} from "../../../Mixer";
import {Effect} from "../../Effect";

let updatePos = function(p) {
    p.pos = (p.pos + p.speed) % 64;
};

let lookupVolumeOffset = function(p) {
    return (VIBRATO_TABLE[p.waveform & 0x03][p.pos] * p.depth / 64);
};

class EffectModTremolo extends AbstractEffect {

  div(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let tremParams = channelState.effectState.tremoloParams || {
      waveform: 0,
      pos: 0,
      depth: 0,
      speed: 0
    };
    if (tremParams.waveform <= 3 && period > 0) {
      tremParams.pos = 0;
    }
    if (param > 0x00) {
      let newDepth = param & 0x0f;
      if (newDepth > 0) {
        tremParams.depth = newDepth;
      }
      let newSpeed = ((param & 0xf0) / 16);
      if (newSpeed > 0) {
        tremParams.speed = newSpeed;
      }
    }
    channelState.effectState.tremoloParams = tremParams;
  }

  tick(mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {
    let tremParams = channelState.effectState.tremoloParams;
    if (tremParams) {
      updatePos(tremParams);
      channelState.volume = channelState.lastVolume + lookupVolumeOffset(tremParams);
      channelState.volume = Math.round(channelState.volume < 0 ? 0 : channelState.volume > 64 ? 64 : channelState.volume);
    }
  }
}

export const MOD_TREMOLO : Effect = new EffectModTremolo();
