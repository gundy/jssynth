import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { loadFixtureSong, renderSong, hashRender } from './helpers/render'

/**
 * Golden-render fidelity guard.
 *
 * Renders reference songs to a fixed buffer and asserts the output is BIT-EXACT
 * against a baseline captured from the M1 (ear-verified) code. This proves M2's
 * refactors (binary-loader rewrite, Float32 sample storage, bug fixes) did not
 * change a single sample of a normal song's playback.
 *
 * The baseline is captured the first time this runs (or with UPDATE_GOLDEN=1).
 * It must only be regenerated deliberately, never to "make the test pass".
 */
const GOLDEN_PATH = new URL('./fixtures/golden-render.json', import.meta.url)
const SAMPLE_RATE = 44100
const CASES = [
  { file: '2ND_PM.s3m', seconds: 6 },
  { file: 'entity.mod', seconds: 6 },
]

function computeAll(): Record<string, { seconds: number; sampleRate: number; frames: number; sha256: string }> {
  const out: Record<string, { seconds: number; sampleRate: number; frames: number; sha256: string }> = {}
  for (const c of CASES) {
    const song = loadFixtureSong(c.file)
    const r = renderSong(song, { sampleRate: SAMPLE_RATE, seconds: c.seconds })
    out[c.file] = { seconds: c.seconds, sampleRate: SAMPLE_RATE, frames: r.frames, sha256: hashRender(r) }
  }
  return out
}

describe('golden render (bit-exact fidelity guard)', () => {
  const current = computeAll()

  if (!existsSync(GOLDEN_PATH) || process.env.UPDATE_GOLDEN) {
    writeFileSync(GOLDEN_PATH, JSON.stringify(current, null, 2) + '\n')
    // eslint-disable-next-line no-console
    console.warn('[golden-render] baseline written:', GOLDEN_PATH.pathname)
  }
  const baseline = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'))

  for (const c of CASES) {
    it(`${c.file} renders bit-identically to the baseline`, () => {
      expect(current[c.file].sha256).toBe(baseline[c.file].sha256)
    })
  }
})
