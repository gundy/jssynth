import {AbstractEffect} from './AbstractEffect';
import {Effect} from "../../Effect";

class EffectModProtrackerGlissandoControl extends AbstractEffect {

  tick(mixer, chan, param, playerState, channelState, period, note, song) {
    playerState.glissandoControl = param;
  }
}

export const MOD_PT_GLISSANDO_CONTROL : Effect = new EffectModProtrackerGlissandoControl();

