# jssynth

[![CI](https://github.com/gundy/jssynth/actions/workflows/ci.yml/badge.svg)](https://github.com/gundy/jssynth/actions/workflows/ci.yml)

A pure-TypeScript audio engine for the web: a sample-playback **mixer** plus an Amiga
**MOD / S3M tracker player**, running on an **AudioWorklet** for sample-exact timing and
low-latency sample triggering.

Originally written when the Web Audio API's `ScriptProcessorNode` first landed, with the goal of
triggering near-real-time sound effects in JavaScript while also playing tracker music. It has since
been modernised into a pnpm + Turborepo monorepo, with the synthesis moved onto the audio render
thread.

## Packages

| Package | What it is |
| --- | --- |
| [`@gundy/jssynth-core`](packages/core) | Pure DSP — `Mixer`, `Sample`, `Filter`. No DOM / Web Audio dependency; runs in Node, the browser, or an AudioWorklet. |
| [`@gundy/jssynth-tracker`](packages/tracker) | The tracker `Player`, MOD/S3M loaders, and effect handlers. Depends on core. |
| [`@gundy/jssynth-web-audio`](packages/web-audio) | `JssynthAudio` — the browser runtime; runs the Player + Mixer inside an AudioWorklet. |

Apps (not published):

- [`apps/harness`](apps/harness) — a minimal playback testbench.
- [`apps/visualizer`](apps/visualizer) — a React app showing scrolling tracker patterns, driven live
  by the worklet's playback-state stream.

## Quick start

```bash
corepack enable        # provides pnpm (see packageManager in package.json)
pnpm install
pnpm build
pnpm --filter @gundy/jssynth-visualizer dev    # or: @gundy/jssynth-harness
```

## Usage

```ts
import { S3MLoader } from '@gundy/jssynth-tracker'
import { JssynthAudio } from '@gundy/jssynth-web-audio'

const audio = await JssynthAudio.create()

const data = await fetch('/song.s3m').then((r) => r.arrayBuffer())
audio.load(new S3MLoader().loadSong(data))

audio.on('state', (e) => console.log(`pos ${e.pos}  row ${e.row}`)) // visualizer hook
await audio.start() // call from a user gesture (autoplay policy)

// Low-latency sample triggering — for games, drum machines, UI sfx, ...
audio.trigger(channel, sample, freqHz) // heard within ~1 render quantum (~2.7 ms)
```

Supported formats: **MOD** (ProTracker and common variants) and **S3M** (ScreamTracker 3). XM is
currently stubbed (not yet supported).

## How it works

- The `Mixer` produces audio one fixed time-slice at a time; the `Player` sets channel state before
  each slice. That `secondsPerMix` cadence is what gives tracker playback its sample-exact timing.
- In the browser, the whole Player + Mixer runs inside an `AudioWorklet`. Each `process()` call fills
  one 128-frame render quantum, advancing the tracker tick at exact sample boundaries via a sample
  clock. Sample triggers cross the worklet message port and are applied at the top of the next
  quantum, so they're heard within ~1 quantum.
- Playback state (pattern position / row, frame-tagged) streams back to the main thread for
  visualisation.

See [docs/ARCHITECTURE_NOTES.md](docs/ARCHITECTURE_NOTES.md) for engine internals and
[docs/MODERNIZATION_PLAN.md](docs/MODERNIZATION_PLAN.md) for the modernization history.

## Development

A pnpm + Turborepo workspace. Requires Node >= 20.

```bash
pnpm build       # build all packages (Turborepo, dependency-ordered)
pnpm test        # Vitest across packages
pnpm typecheck   # tsc --noEmit per package
pnpm lint        # ESLint (flat config)
```

## License

[MIT](LICENSE) © David Gundersen
