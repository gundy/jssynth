# @gundy/jssynth-core

Pure DSP core for [jssynth](https://github.com/gundy/jssynth): the sample-playback `Mixer`, the
`Sample` model (8/16/24-bit PCM → per-channel `Float32Array`), and the `Filter` interface.

No DOM, Web Audio, or `fetch` dependency — it runs in Node, the browser, or an `AudioWorkletGlobalScope`,
and is the shared engine the tracker and the AudioWorklet runtime build on.

```ts
import { Mixer } from '@gundy/jssynth-core'

const mixer = new Mixer({ numChannels: 8, volume: 64 })
mixer.triggerSample(0, sample, 440)
const block = mixer.mix(44100) // or mixer.mixFrames(outL, outR, offset, count, sampleRate)
```

See the [root README](../../README.md) for the full picture.
