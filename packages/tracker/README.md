# @gundy/jssynth-tracker

The tracker layer for [jssynth](https://github.com/gundy/jssynth): the `Player`, the MOD and S3M
loaders, and the per-format effect handlers. Builds on
[`@gundy/jssynth-core`](https://github.com/gundy/jssynth/tree/master/packages/core).

```ts
import { MODLoader, S3MLoader } from '@gundy/jssynth-tracker'

const song = new MODLoader().loadSong(arrayBuffer) // or S3MLoader for .s3m
```

Loaders take an `ArrayBuffer` and return a `Song`. To actually play one in the browser, hand it to
[`@gundy/jssynth-web-audio`](https://github.com/gundy/jssynth/tree/master/packages/web-audio)'s
`JssynthAudio.load()`. Supported formats: MOD (ProTracker + variants) and S3M; XM is stubbed.

See the [root README](../../README.md) for the full picture.
