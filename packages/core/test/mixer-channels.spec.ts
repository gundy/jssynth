import { describe, it, expect } from 'vitest'
import { Mixer } from '../src/Mixer'
import { Sample, SampleRepeatType } from '../src/Sample'

/** A short, non-silent 8-bit sample for exercising channel mixing. */
function makeSample(): Sample {
  const raw = new Uint8Array(64).fill(0xc0) // signed 8-bit 0xc0 -> -0.5
  return new Sample(
    raw,
    {
      bits: 8,
      channels: 1,
      signed: true,
      sampleLength: 64,
      sampleRate: 8000,
      representedFreq: 8000,
      volume: 64,
      repeatType: SampleRepeatType.NON_REPEATING,
    },
    0,
  )
}

const hasSignal = (buf: number[]) => buf.some((v) => v !== 0)

describe('Mixer channel enable/disable', () => {
  it('keeps mixing later channels when an earlier channel is disabled', () => {
    // Regression: the old code did `if (!enabled) break`, so disabling channel 0
    // silenced every channel after it too. It must skip only the disabled channel.
    const mixer = new Mixer({ numChannels: 2, volume: 64 })
    mixer.disableChannels([0])
    mixer.setPanPosition(1, 0)
    mixer.triggerSample(1, makeSample(), 8000)

    const res = mixer.mix(8000)
    expect(hasSignal(res.output[0])).toBe(true)
    expect(hasSignal(res.output[1])).toBe(true)
  })

  it('produces silence when the only sounding channel is disabled', () => {
    const mixer = new Mixer({ numChannels: 2, volume: 64 })
    mixer.triggerSample(1, makeSample(), 8000)
    mixer.disableChannels([1])

    const res = mixer.mix(8000)
    expect(hasSignal(res.output[0])).toBe(false)
    expect(hasSignal(res.output[1])).toBe(false)
  })
})
