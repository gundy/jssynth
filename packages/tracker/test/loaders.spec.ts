import { describe, it, expect } from 'vitest'
import { loadFixtureSong } from './helpers/render'

describe('S3MLoader', () => {
  const song = loadFixtureSong('2ND_PM.s3m')

  it('parses the header and structure', () => {
    expect(song.type).toBe('S3M')
    expect(song.channels).toBe(8)
    expect(song.songLength).toBe(100)
    expect(song.orders.length).toBe(100)
    expect(song.patterns.length).toBe(77)
    expect(song.instruments.length).toBe(54)
    expect(song.initialBPM).toBe(130)
    expect(song.initialSpeed).toBe(3)
    expect(song.name.startsWith('UnreaL ][ / PM')).toBe(true)
  })

  it('decodes sample data as Float32Array in range', () => {
    const sample = song.instruments[0].samples[0]
    expect(sample.data[0]).toBeInstanceOf(Float32Array)
    expect(sample.data[0].length).toBe(40066)
    expect(sample.data[0].every((v) => v >= -1 && v < 1)).toBe(true)
  })
})

describe('MODLoader', () => {
  const song = loadFixtureSong('entity.mod')

  it('parses the header and structure', () => {
    expect(song.type).toBe('M.K.')
    expect(song.channels).toBe(4)
    expect(song.songLength).toBe(23)
    expect(song.patterns.length).toBe(21)
    expect(song.instruments.length).toBe(31)
    expect(song.initialBPM).toBe(125)
    expect(song.initialSpeed).toBe(6)
    expect(song.name.startsWith('entity')).toBe(true)
  })

  it('decodes sample data as Float32Array', () => {
    const sample = song.instruments[0].samples[0]
    expect(sample.data[0]).toBeInstanceOf(Float32Array)
    expect(sample.data[0].length).toBe(3412)
  })
})

describe('song isolation (createBlankSong factory)', () => {
  it('returns an independent song object on each load', () => {
    // Regression: MODLoader used to mutate and return the shared BLANK_SONG
    // constant, so two loads returned the very same object (and polluted defaults
    // for later S3M loads).
    const a = loadFixtureSong('entity.mod')
    const b = loadFixtureSong('entity.mod')
    expect(a).not.toBe(b)

    // An S3M load after a MOD load must keep its own header values, unpolluted.
    const s3m = loadFixtureSong('2ND_PM.s3m')
    expect(s3m.type).toBe('S3M')
    expect(s3m.channels).toBe(8)
  })
})
