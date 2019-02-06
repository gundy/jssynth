// a prototypical effect - effectively does nothing
// allows samples to be triggered
// allows volume changes
// allows note period changes to occur
import {Effect} from '../../Effect'
import {Mixer} from "../../../Mixer";
import {PlayerChannelState, PlayerGlobalState} from "../../../Player";
import {PatternNote} from "../../PatternNote";
import {Song} from "../../Song";

export class AbstractEffect implements Effect {
  public allowSampleTrigger:boolean = true;
  public allowVolumeChange:boolean = true;
  public allowPeriodChange:boolean = true;

  div (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {}
  tick (mixer: Mixer, chan: number, param: number, playerState: PlayerGlobalState, channelState: PlayerChannelState, period?: number, note?: PatternNote, song?: Song) {}
}

export const TEMPLATE_EFFECT = new AbstractEffect();
