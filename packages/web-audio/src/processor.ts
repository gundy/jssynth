import { Mixer } from '@gundy/jssynth-core'
import { Player, effectMapForType, type Song, type PlayerGlobalState, type PlayerChannelState } from '@gundy/jssynth-tracker'
import type { ToWorkletMessage, PlayerStateEvent } from './messages'

/*
 * Minimal AudioWorkletGlobalScope ambient declarations (the standard DOM lib
 * doesn't ship these). Only what this processor uses.
 */
declare const sampleRate: number
declare const currentFrame: number
declare function registerProcessor(name: string, ctor: unknown): void
interface AudioWorkletProcessorImpl {
  readonly port: MessagePort
}
declare const AudioWorkletProcessor: {
  prototype: AudioWorkletProcessorImpl
  new (): AudioWorkletProcessorImpl
}

/**
 * Runs the tracker Player + Mixer on the audio render thread.
 *
 * Each process() call fills exactly one render quantum (typically 128 frames).
 * A sample clock decouples the tracker tick rate from the quantum: when the
 * clock crosses a tick boundary, the Player advances one tick (which may fall
 * mid-quantum); mixing then continues for the remainder. Control messages
 * (trigger/cut/...) are drained at the top of process(), so they take effect
 * within one quantum.
 */
class JssynthProcessor extends AudioWorkletProcessor {
  private mixer: Mixer | null = null
  private player: Player | null = null
  private playing = false
  private framesUntilTick = 0
  private tickFrame = 0
  private pendingStates: PlayerStateEvent[] = []

  constructor() {
    super()
    this.port.onmessage = (e: MessageEvent<ToWorkletMessage>) => this.onMessage(e.data)
  }

  private onMessage(msg: ToWorkletMessage): void {
    switch (msg.type) {
      case 'load':
        this.loadSong(msg.song)
        break
      case 'start':
        this.playing = true
        this.player?.start()
        break
      case 'stop':
        this.playing = false
        this.player?.stop()
        break
      case 'trigger':
        this.mixer?.triggerSample(msg.channel, msg.sample, msg.freqHz)
        break
      case 'cut':
        this.mixer?.cut(msg.channel)
        break
      case 'setGlobalVolume':
        this.mixer?.setGlobalVolume(msg.volume)
        break
    }
  }

  private loadSong(song: Song): void {
    // Effect maps can't cross the thread boundary (methods don't clone) — restore.
    song.effectMap = effectMapForType(song.type)
    this.mixer = new Mixer({ numChannels: song.channels, volume: 64 })
    this.player = new Player(this.mixer)
    this.player.registerCallback((ps: PlayerGlobalState, cs: PlayerChannelState[]) => {
      this.pendingStates.push(buildStateEvent(ps, cs, this.tickFrame))
    })
    this.player.setSong(song)
    this.framesUntilTick = 0
    this.playing = false // wait for an explicit 'start'
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]
    if (!out || out.length === 0) return true
    const left = out[0]
    const right = out[1] ?? out[0]
    const blockSize = left.length

    if (!this.mixer || !this.player || !this.playing) {
      left.fill(0)
      if (out[1]) right.fill(0)
      return true
    }

    let filled = 0
    while (filled < blockSize) {
      if (this.framesUntilTick <= 0) {
        this.tickFrame = currentFrame + filled
        this.player.preSampleMix(this.mixer, sampleRate)
        this.framesUntilTick = Math.floor(sampleRate * this.mixer.getSecondsPerMix())
        if (this.framesUntilTick <= 0) this.framesUntilTick = 1 // never stall
      }
      const n = Math.min(blockSize - filled, this.framesUntilTick)
      this.mixer.mixFrames(left, right, filled, n, sampleRate)
      filled += n
      this.framesUntilTick -= n
    }

    if (this.pendingStates.length > 0) {
      for (const ev of this.pendingStates) this.port.postMessage({ type: 'state', event: ev })
      this.pendingStates.length = 0
    }
    return true
  }
}

function buildStateEvent(ps: PlayerGlobalState, cs: PlayerChannelState[], frame: number): PlayerStateEvent {
  return {
    pos: ps.pos,
    row: ps.row,
    tick: ps.tick,
    bpm: ps.bpm,
    speed: ps.speed,
    frame,
    channels: cs.map((c) => ({ volume: c.volume, period: c.period })),
  }
}

registerProcessor('jssynth-processor', JssynthProcessor)
