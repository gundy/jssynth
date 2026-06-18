import { describe, it, expect } from 'vitest'
import { Mixer } from '../src/Mixer'

describe('Mixer', () => {
  it('returns a stereo buffer of the requested length', () => {
    const mixer = new Mixer({ secondsPerMix: 1 }, {})
    const results = mixer.mix(44100)
    expect(results.bufferSize).toBe(44100)
    expect(results.output[0].length).toBe(44100) /* mixing is always in stereo */
    expect(results.output[1].length).toBe(44100)
  })
})
