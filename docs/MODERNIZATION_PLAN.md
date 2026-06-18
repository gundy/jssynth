# jssynth Modernization — Execution Plan

> Status: **proposed / awaiting review**. Nothing in here has been executed yet.
> Companion doc: [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md) — preserved knowledge about the
> existing codebase (timing model, effect system, known bugs).

## Goals

1. Restructure into a **pnpm + Turborepo monorepo** with a clean package split.
2. Keep the DSP **`core` package pure** — no DOM, no Web Audio, no `fetch`. Node-testable.
3. Modernize the platform glue: **`ScriptProcessorNode` → `AudioWorklet`**, modern-browser-only.
4. Run the **`Player` + `Mixer` inside the audio worklet** for sample-exact timing, with:
   - **minimal trigger→sound latency** (target: ≤ 1 render quantum, ~2.7 ms @ 48 kHz), and
   - **near-realtime playback-state notification** (pattern/row) to the main thread, tagged with
     audio-frame timestamps so the UI can sync precisely.
5. Replace the `atob`/`charCodeAt` "binary string" loaders with `ArrayBuffer`/`DataView`.
6. Leave a **`visualizer`-sized hole** (Vite + React app) wired to a formalized player-state stream.
7. Fix the genuine bugs found during review, with tests.

## Decisions locked in

| Decision | Choice |
|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo |
| `core` purity | Pure DSP, zero browser APIs |
| Audio backend | AudioWorklet only (drop ScriptProcessorNode, modern browsers) |
| Worklet topology | Player **and** Mixer run inside the worklet |
| Triggering | `MessagePort` postMessage (SharedArrayBuffer ring = future optimization) |
| Visualizer | Scaffold the seam now; bring real files in later as a mini-milestone |
| Test runner | Vitest |
| Lint | ESLint flat config (drop TSLint) |

## Target structure

```
jssynth/                          ← pnpm workspace root + turbo.json
├── packages/
│   ├── core/                     @gundy/jssynth-core
│   │     Mixer, Sample, Instrument, Envelope, Filter, MixResult, types
│   │     (pure DSP — runs in Node, browser, or AudioWorkletGlobalScope)
│   ├── web-audio/                @gundy/jssynth-web-audio
│   │     AudioWorklet driver + the processor bundle  (depends on core, tracker)
│   └── tracker/                  @gundy/jssynth-tracker
│         Player + formats/ (Loader, Song, Pattern, MOD, S3M, XM, effects)
│         (depends on core; pure — loaders take ArrayBuffer, no fetch)
└── apps/
    ├── harness/                  demo page on Vite (replaces web_harness/)
    └── visualizer/               React + Vite app — scaffolded, empty (the seam)
```

**Dependency rule:** `core` depends on nothing. `tracker` depends on `core`. `web-audio` depends on
both and is the *only* package allowed to touch Web Audio / worklet APIs.

---

## Milestone M1 — Monorepo foundation (no behavior change) ✅ DONE

**Status:** complete on branch `m1-monorepo-foundation`. Full pipeline green:
`pnpm build / test / typecheck / lint` all pass.

**As-built notes / deviations from the original sketch:**
- **`core` made truly minimal:** `Instrument`, `Envelope`, and `AMIGA_FILTERS` live in **`tracker`**,
  not `core` (they're only consumed by the tracker; `core` = `Mixer`, `Sample`, `Filter`,
  `MixResult`, `Utils`). Matches the "split the player from the core sample-playback stuff" intent.
- **Tooling as-built:** pnpm 11 workspace + Turborepo; per-package builds via **tsup** (ESM + CJS +
  `.d.ts`); **Vitest** for tests; **ESLint 9 flat config** (legacy-era rules set to `warn` so lint is
  green — 0 errors, ~471 warnings to burn down later); harness on **Vite 6** (aliased to package
  source for a fast dev loop).
- **XM loader excluded from compilation** (`tracker/tsconfig.json` `exclude`) — it's half-finished
  with latent type errors and detached from the public API. Proper stub happens in M2 as planned.
- Old entry points (`index.ts`, `index.standalone.ts`, the `window.jssynth` global) removed in favour
  of per-package barrels; harness now imports ESM directly.

**Outcome:** identical runtime behavior, rehomed into the workspace, building and testing green on a
modern toolchain.

Tasks:
- [ ] Add `pnpm-workspace.yaml`, root `package.json` (private), `turbo.json`.
- [ ] Create `packages/{core,web-audio,tracker}` and `apps/{harness,visualizer}` skeletons, each with
      its own `package.json`, `tsconfig.json` (TS **project references**), and build via Turbo.
- [ ] Move existing `src/` into packages along the dependency rule above:
      - `core`: `Mixer`, `Sample`, `Instrument`, `Envelope`, `Filter`, `MixResult`, `Utils` (interim),
        `AMIGA_FILTERS`.
      - `tracker`: `Player`, everything under `formats/`.
      - `web-audio`: new home for the driver (rewritten in M3); for M1 it can keep a thin
        ScriptProcessorNode driver so the harness still plays during the transition.
- [ ] Toolchain swap:
      - TS `3.9 → 5.x`; `target: es5 → es2022`; `module: esnext`; enable `strict` incrementally
        (start with `noImplicitAny` off as today, tighten later).
      - TSLint → **ESLint flat config** (`eslint.config.js`) with `@typescript-eslint`.
      - Alsatian → **Vitest**; port `test/mixer.spec.ts`.
      - Delete `.travis.yml`, `sauce_labs_capabilities.js`, `tslint.json`.
- [ ] Delete orphaned dead files: `src/jssynth.js`, `src/jssynth-mod.js` (unreferenced; the latter
      imports a non-existent `'src/jssynth'` and a half-finished `XMLoader`).
- [ ] Move `web_harness/` → `apps/harness/`, served by Vite (keep base64 `.js` blobs for now;
      M2 replaces them with real binary files).

**Acceptance:** `pnpm install && pnpm turbo build test lint` is green; the harness still plays the
bundled S3M.

---

## Milestone M2 — Bugs + refactor pass ✅ DONE (awaiting ear-check before commit)

**Status:** complete on branch `m1-monorepo-foundation`, **not yet committed** (paused for an
ear-check). Full pipeline green; the **golden render is bit-exact** for both reference songs.

**As-built notes:**
- **Bit-exact achieved.** The golden-render guard (captured from M1 code) still matches byte-for-byte
  after the factory fix, the full ArrayBuffer/DataView loader rewrite, and `Float32Array` sample
  storage. The float32 claim held: lossless for the 8/16-bit PCM in these songs.
- **Float32 *mixer accumulation* deferred to M3** (deliberately). Sample *storage* is now Float32 (it's
  lossless), but the mixer still accumulates in float64 — moving accumulation to float32 is the one
  change that *would* perturb output, and the worklet forces it anyway, so it belongs in M3.
- **Discovered a third latent bug — `MOD_PT_INVERT_LOOP` (EFx "invert loop").** It indexes
  `sample.data[i]` as if flat, but data is channel-major, so it's been a silent no-op. Preserved
  bit-exactly (compile-only cast + comment) rather than fixed, because correcting it changes how
  EFx-using songs sound — a deliberate audio change for a later effects pass, not this refactor.
- XM loader stubbed (clean "not supported" error); broken `xm/effects/*` removed; tsconfig exclude gone.
- Harness now `fetch()`es real binary song files from `public/songs/`; base64 `.ts` blobs deleted.
- New tests: golden render (bit-exact, MOD + S3M), channel-disable regression, loader structural,
  factory-isolation. 10 tests total, green.

**Outcome:** correctness fixes and the binary-loading rewrite, each landing with a test. Still on the
interim driver (worklet comes in M3), so behavior is verifiable in isolation.

Bug fixes (see ARCHITECTURE_NOTES for detail):
- [ ] **`BLANK_SONG` shared mutation.** Replace the `BLANK_SONG` constant with a `createBlankSong()`
      factory; both loaders build a fresh song. Removes the MOD→S3M cross-contamination path.
- [ ] **Channel-disable kills later channels.** `Mixer.mix()` uses `if (!state.enabled) break;` —
      change to `continue` so disabling channel _n_ doesn't silence _n+1…N_.
- [ ] Audit `Utils.clone` (shallow) usage for other accidental shared-reference cases.

Binary loading rewrite (the `atob` cleanup you flagged):
- [ ] Loaders accept `ArrayBuffer` (and a `File`/`Blob` convenience helper) instead of a binary
      string. Introduce a small `BinaryReader` (`DataView`-based: `u8/u16/i8/string/seek`) replacing
      `data.charCodeAt(...)` arithmetic across MOD/S3M/XM loaders and `Sample`.
- [ ] `Sample` stores audio as **`Float32Array`** (per channel), parsed directly from the buffer.
      This doubles as prep for transfer into the worklet (M3) — typed arrays are transferable.
- [ ] Harness: drop the `window.atob('…')` base64 `.js` blobs; ship real `.mod`/`.s3m` files and
      `fetch(...).arrayBuffer()` them.
- [ ] **Stub the XM loader** — replace the half-finished `XMLoader`/`XM_EFFECT_MAP` with a clean
      placeholder that throws a clear "XM not yet supported" error, so it's an honest gap rather than
      dead half-code. Full XM support is a later milestone of its own.

Perf / cleanup:
- [ ] `Mixer` output buffers → `Float32Array`; retire `Utils.makeArrayOf`.
- [ ] Replace remaining `Utils.clone/merge` with native spread / `structuredClone` where sensible.

**Acceptance:** new Vitest suites cover MOD + S3M loaders (parse a known fixture, assert
orders/patterns/instruments) and the two bug fixes; all green. The **golden-render baseline** (see
Testing philosophy) is captured at the *start* of M2, before any change, and still matches at the end.

---

## Milestone M3 — AudioWorklet migration (Player + Mixer in the worklet)

**Outcome:** all synthesis runs on the audio render thread; trigger and visualization latency
minimized. This is the milestone that realizes the original "sample-exact" goal properly.

### Topology

```
 main thread                              audio render thread (AudioWorkletGlobalScope)
 ───────────                              ─────────────────────────────────────────────
 tracker loaders  ──parse ArrayBuffer──►  (song parsed here)
        │  postMessage(song)  ───────────────►  JssynthProcessor
        │                                          ├─ Player  (tick scheduling)
 trigger()/setParam() ──port.postMessage──►        ├─ Mixer   (incremental, tick-aligned)
        │                                          └─ process(out): fills 128 frames/quantum
        ◄───── port.postMessage(stateEvent) ───────┘  (pos/row + audio-frame timestamp)
 visualizer subscribes
```

Key design points (the timing crux):
- [ ] **Single worklet bundle.** `web-audio` builds a self-contained module (processor + `Player` +
      `Mixer` + `core`) loaded via `audioWorklet.addModule(url)`. No DOM/`fetch` inside it.
- [ ] **Loaders stay on the main thread.** Parsed `Song` (with `Float32Array` sample data) is sent
      into the worklet via `postMessage`, transferring the sample buffers (zero-copy).
- [ ] **Decouple tracker ticks from the render quantum.** Replace the current "mix one ~100 ms
      `secondsPerMix` block" loop with a **sample clock**: `process()` generates exactly the frames
      asked for (128/quantum), and the player's tick boundary is computed in samples; when the clock
      crosses a boundary mid-quantum, the tick callback fires and mixing continues. This removes the
      up-to-`secondsPerMix` latency the current block model has, and keeps ticks sample-accurate.
- [ ] **Triggering ≤ 1 quantum.** Main-thread `trigger()/cut()/setParam()` → `port.postMessage`,
      drained at the top of the next `process()` call. Worst case ≈ one render quantum (~2.7 ms
      @ 48 kHz). Documented future optimization: a lock-free **SharedArrayBuffer** command ring for
      sub-quantum, GC-free triggering — deferred because it requires COOP/COEP cross-origin isolation.
- [ ] **Realtime-ish state notifications.** On row/pattern advance, the worklet posts
      `{ pos, row, channels, frame }` where `frame` is the absolute output sample index. The main
      thread maps that to wall-clock via `AudioContext.currentTime` + `outputLatency`, so the UI can
      either render ASAP (near-realtime) or schedule the visual to coincide with the sound hitting the
      speakers (sample-accurate). Notifications are coalesced to avoid flooding the port.
- [ ] Public API: `JssynthAudio.create()` / `.load(song)` / `.trigger(...)` / `.on('state', cb)` /
      `.start()/.stop()`, hiding the worklet/port plumbing.

**Acceptance:** harness plays via the worklet; a "trigger on click" demo shows tight latency; the
state callback fires per row in sync with audio.

---

## Milestone M4 — Visualizer seam

**Outcome:** a clean, typed subscription API and an empty React app wired to it, ready for the old
pattern-scroller files to be dropped in later.

- [ ] Formalize the player-state event stream (the existing `registerCallback`/`stateCallback` hooks
      are the basis): a typed `PlayerStateEvent { pos, row, speed, bpm, channels: ChannelView[],
      frame }`, delivered through the M3 port bridge with a tiny `subscribe()` API.
- [ ] Scaffold `apps/visualizer` (Vite + React + TS), consuming `@gundy/jssynth-web-audio`, rendering
      a placeholder "now playing pos/row" readout from live events.
- [ ] Document the contract so the imported app has a target to conform to.
- [ ] (Later, separate mini-milestone) Import the real React files and remediate.

**Acceptance:** `apps/visualizer` runs, loads a song through the engine, and shows the pattern/row
updating live.

---

## Milestone M5 — Polish

- [ ] Per-package `publishConfig`, exports maps, and `.d.ts` outputs; decide which packages publish.
- [ ] Rewrite `README.md` (current one references Yarn/nodenv/Travis); add per-package READMEs and a
      worked "drum machine" example exercising low-latency triggering.
- [ ] GitHub Actions CI (build + test + lint across the workspace) replacing Travis.
- [ ] Changesets (or similar) for versioning the multiple packages.

---

## Testing philosophy — structural vs. fidelity

Tracker playback has a long tail of subtle behavioral nuances (effect ordering, vibrato/tremolo table
phase, finetune, porta interactions) that **few implementations get fully right and that do not lend
themselves to unit testing** — historically the only real verification was listening, by ear, to
songs known by heart against original Amiga playback. We respect that:

- **Unit tests cover structure only** — that a loader parsed the right orders/patterns/instrument
  metadata/sample lengths. They make no claim about whether playback *sounds* correct.
- **Golden-render regression guards fidelity through the refactor.** The current code's output is
  already ear-verified by the author. So: render a few reference songs (MOD + S3M) to a fixed-length
  buffer once, snapshot a checksum/hash of the sample output, and fail CI if any later change alters
  the output bit-for-bit. This doesn't prove output is *good* — it proves M1–M3 didn't change it. The
  baseline hash is captured **before** M2 touches anything, and must survive the monorepo move, the
  `Float32Array` swap, and the worklet migration unchanged.
  - Caveat: switching sample storage to `Float32Array` or reordering float accumulation can perturb
    the last bits. If bit-exactness proves too brittle, fall back to a tolerance compare (max abs
    error per sample below a threshold) rather than an exact hash — but start strict.
- Final sign-off on anything that *intends* to change audio (e.g. adding interpolation) stays a
  **trust-your-ears** step, explicitly, not something we pretend a test settles.

## Open questions deferred to their milestone

- **M3:** exact coalescing strategy / max event rate for state notifications.
- **M3 (future):** whether to adopt the SharedArrayBuffer command ring (needs COOP/COEP headers).
- ~~**M2/M3:** XM loader — fix or stub?~~ **Resolved:** stub it out for now (clean placeholder that
  throws a clear "XM not yet supported" error). Revisit as its own milestone later.
