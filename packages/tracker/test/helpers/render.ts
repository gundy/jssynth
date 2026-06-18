import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Mixer } from '@gundy/jssynth-core'
import { Player } from '../../src/Player'
import { S3MLoader } from '../../src/formats/s3m/S3MLoader'
import { MODLoader } from '../../src/formats/mod/MODLoader'
import type { Song } from '../../src/formats/Song'

/** Load a song fixture and parse it with the appropriate loader. */
export function loadFixtureSong(file: string): Song {
  const buf = readFileSync(new URL(`../fixtures/${file}`, import.meta.url))
  // Slice to a standalone ArrayBuffer (Node may pool Buffers in a larger one).
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const loader = file.endsWith('.s3m') ? new S3MLoader() : new MODLoader()
  return loader.loadSong(arrayBuffer)
}

export interface RenderResult {
  left: Float64Array
  right: Float64Array
  sampleRate: number
  frames: number
}

/**
 * Deterministic offline render: drives the Player through the Mixer exactly the
 * way the WebAudioDriver would, but synchronously and for a fixed duration.
 */
export function renderSong(
  song: Song,
  opts: { sampleRate?: number; seconds?: number } = {},
): RenderResult {
  const sampleRate = opts.sampleRate ?? 44100
  const seconds = opts.seconds ?? 6
  const frames = Math.floor(sampleRate * seconds)

  const mixer = new Mixer({ numChannels: song.channels, volume: 64 })
  const player = new Player(mixer)
  player.setSong(song)

  const left = new Float64Array(frames)
  const right = new Float64Array(frames)
  let pos = 0
  while (pos < frames) {
    const res = mixer.mix(sampleRate)
    const n = Math.min(res.bufferSize, frames - pos)
    for (let i = 0; i < n; i++) {
      left[pos + i] = res.output[0][i]
      right[pos + i] = res.output[1][i]
    }
    pos += n
  }
  return { left, right, sampleRate, frames }
}

/** Bit-exact SHA-256 over the raw float64 sample bytes (left then right). */
export function hashRender(r: RenderResult): string {
  return createHash('sha256')
    .update(Buffer.from(r.left.buffer))
    .update(Buffer.from(r.right.buffer))
    .digest('hex')
}
