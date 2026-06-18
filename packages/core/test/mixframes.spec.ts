import { describe, it, expect } from 'vitest'
import { Mixer } from '../src/Mixer'
import { Sample, SampleRepeatType } from '../src/Sample'

/** Build identical mixers with a couple of sounding channels (looped sample). */
function makeMixer(): Mixer {
  const m = new Mixer({ numChannels: 4, volume: 64, secondsPerMix: 0.05 })
  const raw = new Uint8Array(200)
  for (let i = 0; i < 200; i++) raw[i] = (i * 7) & 0xff
  const sample = new Sample(
    raw,
    {
      bits: 8,
      signed: true,
      channels: 1,
      sampleLength: 200,
      sampleRate: 8000,
      representedFreq: 6000,
      volume: 50,
      repeatType: SampleRepeatType.REP_NORMAL,
      repeatStart: 10,
      repeatEnd: 180,
    },
    0,
  )
  m.setPanPosition(0, -0.3)
  m.setPanPosition(1, 0.5)
  m.triggerSample(0, sample, 7000)
  m.triggerSample(1, sample, 9000)
  return m
}

describe('Mixer.mixFrames', () => {
  it('chunked mixFrames is bit-identical to a single mix() block', () => {
    const sampleRate = 8000
    const frames = Math.floor(sampleRate * 0.05) // 400

    const reference = makeMixer().mix(sampleRate)

    const split = makeMixer()
    const left = new Float64Array(frames)
    const right = new Float64Array(frames)
    let offset = 0
    for (const n of [128, 128, 128, 16]) {
      split.mixFrames(left, right, offset, n, sampleRate)
      offset += n
    }

    expect(offset).toBe(frames)
    for (let i = 0; i < frames; i++) {
      expect(left[i]).toBe(reference.output[0][i])
      expect(right[i]).toBe(reference.output[1][i])
    }
  })
})
