# @gundy/jssynth-web-audio

The browser runtime for [jssynth](https://github.com/gundy/jssynth). `JssynthAudio` runs the tracker
`Player` and the `Mixer` inside an `AudioWorklet` — on the audio render thread — for sample-exact
timing, low-latency triggering, and a frame-tagged playback-state stream.

```ts
import { S3MLoader } from '@gundy/jssynth-tracker'
import { JssynthAudio } from '@gundy/jssynth-web-audio'

const audio = await JssynthAudio.create()
audio.load(new S3MLoader().loadSong(await fetch('/song.s3m').then((r) => r.arrayBuffer())))
audio.on('state', (e) => render(e)) // { pos, row, tick, bpm, speed, frame, channels }
await audio.start() // from a user gesture

audio.trigger(channel, sample, freqHz) // ~1 render quantum latency
```

The worklet ships self-contained (bundled at build time and loaded via a Blob URL), so consuming apps
need no special bundler configuration.

See the [root README](../../README.md) for the full picture.
