import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { MODLoader } from '@gundy/jssynth-tracker'

/*
 * Drives the AudioWorklet processor in Node by standing in for the
 * AudioWorkletGlobalScope (registerProcessor / AudioWorkletProcessor /
 * sampleRate / currentFrame). This verifies the sample-clock loop, the message
 * protocol and the state-event stream without a browser.
 */

interface PortStub {
  postMessage: (m: unknown) => void
  onmessage: ((e: { data: unknown }) => void) | null
}
interface ProcessorStub {
  port: PortStub
  process: (inputs: unknown, outputs: Float32Array[][]) => boolean
}

const posted: Array<{ type: string; event?: { pos: number; row: number; frame: number } }> = []
let ProcessorClass: new () => ProcessorStub

const g = globalThis as unknown as Record<string, unknown>

beforeAll(async () => {
  g.sampleRate = 48000
  g.currentFrame = 0
  g.registerProcessor = (_name: string, ctor: new () => ProcessorStub) => {
    ProcessorClass = ctor
  }
  g.AudioWorkletProcessor = class {
    port: PortStub = { postMessage: (m: unknown) => posted.push(m as never), onmessage: null }
  }
  await import('../src/processor')
})

function loadSongBytes(file: string): ArrayBuffer {
  const buf = readFileSync(new URL(`../../tracker/test/fixtures/${file}`, import.meta.url))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

describe('JssynthProcessor (AudioWorklet runtime)', () => {
  it('registers under the expected name', () => {
    expect(typeof ProcessorClass).toBe('function')
  })

  it('renders audio and streams pattern/row state', () => {
    const proc = new ProcessorClass()
    const send = (data: unknown) => proc.port.onmessage!({ data })

    const song = new MODLoader().loadSong(loadSongBytes('entity.mod'))
    send({ type: 'load', song: { ...song, effectMap: null } })
    send({ type: 'start' })

    const left = new Float32Array(128)
    const right = new Float32Array(128)
    let sawSignal = false
    for (let q = 0; q < 2000; q++) {
      g.currentFrame = q * 128
      left.fill(0)
      right.fill(0)
      proc.process([], [[left, right]])
      if (!sawSignal && (left.some((v) => v !== 0) || right.some((v) => v !== 0))) sawSignal = true
    }

    expect(sawSignal).toBe(true)

    const states = posted.filter((m) => m.type === 'state')
    expect(states.length).toBeGreaterThan(0)
    const first = states[0].event!
    expect(typeof first.pos).toBe('number')
    expect(typeof first.row).toBe('number')
    expect(typeof first.frame).toBe('number')
  })

  it('is silent before start / after stop', () => {
    posted.length = 0
    const proc = new ProcessorClass()
    const send = (data: unknown) => proc.port.onmessage!({ data })
    send({ type: 'load', song: { ...new MODLoader().loadSong(loadSongBytes('entity.mod')), effectMap: null } })

    const left = new Float32Array(128)
    const right = new Float32Array(128)
    // before start
    g.currentFrame = 0
    left.fill(1)
    right.fill(1)
    proc.process([], [[left, right]])
    expect(left.every((v) => v === 0)).toBe(true)
    expect(right.every((v) => v === 0)).toBe(true)
  })
})
