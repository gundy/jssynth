import type { Sample } from '@gundy/jssynth-core'
import type { Song } from '@gundy/jssynth-tracker'
import { PROCESSOR_SOURCE } from './generated/processorSource'
import type { FromWorkletMessage, PlayerStateEvent, ToWorkletMessage } from './messages'

export type { PlayerStateEvent, ChannelStateView } from './messages'

const PROCESSOR_NAME = 'jssynth-processor'

export interface JssynthAudioOptions {
  /** Provide your own AudioContext (otherwise one is created). */
  context?: AudioContext
}

type StateListener = (event: PlayerStateEvent) => void

/**
 * Browser runtime for jssynth: runs the Player + Mixer inside an AudioWorklet
 * (the audio render thread) for sample-exact tracker playback and low-latency
 * sample triggering.
 *
 *   const audio = await JssynthAudio.create()
 *   audio.load(new S3MLoader().loadSong(await fetch(url).then(r => r.arrayBuffer())))
 *   audio.on('state', e => render(e))   // pattern/row, frame-tagged
 *   audio.start()
 */
export class JssynthAudio {
  private readonly stateListeners = new Set<StateListener>()

  private constructor(
    private readonly context: AudioContext,
    private readonly node: AudioWorkletNode,
  ) {
    this.node.port.onmessage = (e: MessageEvent<FromWorkletMessage>) => {
      if (e.data.type === 'state') {
        for (const fn of this.stateListeners) fn(e.data.event)
      }
    }
  }

  static async create(options: JssynthAudioOptions = {}): Promise<JssynthAudio> {
    const context = options.context ?? new AudioContext()

    // Load the self-contained worklet bundle via a Blob URL — no app bundler
    // config required.
    const blob = new Blob([PROCESSOR_SOURCE], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    try {
      await context.audioWorklet.addModule(url)
    } finally {
      URL.revokeObjectURL(url)
    }

    const node = new AudioWorkletNode(context, PROCESSOR_NAME, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.connect(context.destination)
    return new JssynthAudio(context, node)
  }

  /** Ship a parsed song into the worklet (the effectMap is restored worklet-side). */
  load(song: Song): void {
    // Strip the effectMap: its Effect instances have methods and can't be cloned.
    const payload: Song = { ...song, effectMap: null }
    this.post({ type: 'load', song: payload })
  }

  /** Resume the context (must be called from a user gesture) and begin playback. */
  async start(): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume()
    this.post({ type: 'start' })
  }

  stop(): void {
    this.post({ type: 'stop' })
  }

  /** Trigger a sample on a channel — heard within ~1 render quantum. */
  trigger(channel: number, sample: Sample, freqHz: number): void {
    this.post({ type: 'trigger', channel, sample, freqHz })
  }

  cut(channel: number): void {
    this.post({ type: 'cut', channel })
  }

  setGlobalVolume(volume: number): void {
    this.post({ type: 'setGlobalVolume', volume })
  }

  on(event: 'state', listener: StateListener): () => void {
    void event
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  off(event: 'state', listener: StateListener): void {
    void event
    this.stateListeners.delete(listener)
  }

  /** Map a PlayerStateEvent.frame to the AudioContext time at which it is heard. */
  frameToAudibleTime(frame: number): number {
    const outputLatency = (this.context as AudioContext & { outputLatency?: number }).outputLatency ?? 0
    return frame / this.context.sampleRate + outputLatency
  }

  get sampleRate(): number {
    return this.context.sampleRate
  }

  get audioContext(): AudioContext {
    return this.context
  }

  async dispose(): Promise<void> {
    this.node.disconnect()
    this.stateListeners.clear()
    await this.context.close()
  }

  private post(message: ToWorkletMessage): void {
    this.node.port.postMessage(message)
  }
}
