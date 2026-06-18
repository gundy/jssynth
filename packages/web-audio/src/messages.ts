import type { Sample } from '@gundy/jssynth-core'
import type { Song } from '@gundy/jssynth-tracker'

/**
 * The wire protocol between the main thread (JssynthAudio) and the
 * AudioWorklet (JssynthProcessor), exchanged over the AudioWorkletNode port.
 */

/* ---- main thread -> worklet ---- */
export type ToWorkletMessage =
  | { type: 'load'; song: Song }   // song with effectMap stripped (re-attached in worklet)
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'trigger'; channel: number; sample: Sample; freqHz: number }
  | { type: 'cut'; channel: number }
  | { type: 'setGlobalVolume'; volume: number }

/* ---- worklet -> main thread ---- */
export interface ChannelStateView {
  volume: number
  period: number
}

export interface PlayerStateEvent {
  /** song position (order index) */
  pos: number
  /** row within the current pattern */
  row: number
  /** tick within the row */
  tick: number
  bpm: number
  speed: number
  /** absolute output sample-frame index at which this state took effect */
  frame: number
  channels: ChannelStateView[]
}

export type FromWorkletMessage = { type: 'state'; event: PlayerStateEvent }
