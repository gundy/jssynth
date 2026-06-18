# jssynth — Architecture Notes (knowledge worth preserving)

Captured 2026-06 during a modernization review of the original (TypeScript-port) codebase, before any
restructuring. This records *how the existing engine works* and *what's subtly wrong with it*, so the
hard-won detail isn't lost when files move around. See [MODERNIZATION_PLAN.md](./MODERNIZATION_PLAN.md)
for what we're going to do about it.

## The core timing model (the good idea at the heart of this)

- `WebAudioDriver` owns a `ScriptProcessorNode`. When the browser needs audio it calls
  `mixer.mix(sampleRate)`, which returns a fixed *time-based* chunk of samples
  (`secondsPerMix` seconds worth, default 0.1 s).
- `Mixer` exposes **pre-mix** and **post-mix** callbacks. The `Player` registers a pre-mix callback
  (`preSampleMix`); right before each chunk is mixed it sets every channel's sample/frequency/volume
  from the tracker state, then the mixer renders that chunk. Repeat. This is what gives tracker
  playback its timing.
- `Player.preSampleMix` ends by setting `mixer.setSecondsPerMix(1 / (bpm * 2 / 5))` — i.e. the chunk
  length *is* the tracker tick. So tick rate and audio block size are currently the same knob. **This
  is exactly the coupling M3 breaks** (a render quantum is 128 frames ≈ 2.7 ms, far smaller than a
  tick), to get low trigger latency.
- Why not `AudioBufferSourceNode`/native scheduling? Because the whole point was sample-exact control
  and the ability to mix tracker playback + live-triggered SFX in one deterministic stream.

## Sample / audio representation

- `Sample` converts raw bytes → arrays of doubles in `[-1, 1]`. Supports 8/16/24-bit,
  signed/unsigned, mono/stereo, little/big-endian, and delta-encoded samples
  (`convertSamplesBytesToDoubles`).
- Mixer mixing: per channel, `samplePosStep = playbackFreqHz / sampleRate * (sampleSampleRate /
  representedFreq)`, advanced with nearest-neighbor (`Math.floor(samplePos)`) — **no interpolation**.
  Repeats handled by `STEP_FUNCS.REP_NORMAL` (wrap) vs `NON_REPEATING`.
- `Sample` extends the sample by one frame past `repeatEnd` so wrap-around interpolation wouldn't
  glitch — interpolation isn't actually implemented yet, but the hook is there.
- Ping-pong loops (`REP_PINGPONG`) are pre-unrolled into a forward `REP_NORMAL` loop at construction.

## The effect system (this is nicely designed — keep it)

- Each tracker effect is a class implementing `Effect { div(), tick(), allowSampleTrigger,
  allowVolumeChange, allowPeriodChange }`. `div()` runs on the row (division) boundary; `tick()` runs
  on every intra-row tick. `AbstractEffect`/`TEMPLATE_EFFECT` is the do-nothing base.
- A `Song` carries an `effectMap: { [code]: { code, effect } }`. MOD, S3M, XM each have their own map
  (`MOD_EFFECT_MAP`, etc.). The `Player` is format-agnostic — it just dispatches through the song's
  map. Adding a format = a loader + an effect map.
- The `allow*` flags let an effect veto the player's default note handling (e.g. porta-to-note
  suppresses the sample retrigger). This is how period/volume/trigger interactions stay correct.
- Amiga period tables (`MOD_PERIOD_TABLE`), finetune (`MOD_FINETUNE_TABLE`), vibrato/tremolo waveform
  tables, and the PAL/NTSC clock constants (`FREQ_PAL`/`FREQ_NTSC` in `formats/Song.ts`) encode real
  hardware behavior — don't "simplify" these away.

## Known bugs (confirmed during review — fix in M2)

1. **`BLANK_SONG` shared mutation.** `MODLoader.loadSong` does `let song = BLANK_SONG` (the module
   constant) and mutates it in place. `S3MLoader` defensively `Utils.clone(BLANK_SONG)`s instead. So
   loading a MOD permanently pollutes the shared `BLANK_SONG`, and a subsequent S3M load clones the
   polluted version → cross-contamination. Fix: a `createBlankSong()` factory.
   - File refs: `src/formats/mod/MODLoader.ts` (~line 38), `src/formats/s3m/S3MLoader.ts` (~line 26),
     `src/formats/Song.ts`.
2. **Channel disable silences later channels.** `Mixer.mix()` loops channels and does
   `if (!state.enabled) break;` — `break` exits the *whole* loop, so disabling channel _n_ also mutes
   _n+1…N_. Should be `continue`. (`src/Mixer.ts`, ~line 265.)

## Smells / staleness (context for the cleanup)

- `Utils.clone` is a **shallow** clone but is used in spots that look like they want depth; safe today
  only because the cloned shapes happen to be flat. Worth auditing as native code replaces it.
- `post-mix` callback fires via `window.setTimeout(fn, 0)` — main-thread, not synced to audio. Fine
  for loose UI, useless for sample-accurate sync. M3's frame-tagged port events replace it.
- Binary loading reads a "binary string" via `window.atob(base64)` then `String.charCodeAt(ofs)` byte
  arithmetic everywhere. Works, but fragile/slow and ties loaders to a string type. → `ArrayBuffer` /
  `DataView` in M2.
- Dead files: `src/jssynth.js`, `src/jssynth-mod.js` (unreferenced; `jssynth-mod.js` imports a
  non-existent `'src/jssynth'` module and a half-finished `XMLoader`).
- XM support is partially stubbed (`XMLoader`, `XM_EFFECT_MAP` mostly `TEMPLATE_EFFECT`).
- Toolchain: TS 3.9, `target: es5`, TSLint (deprecated), Alsatian (unmaintained), Travis + Sauce Labs
  (both dead). README documents a Yarn/nodenv workflow that no longer matches reality.
