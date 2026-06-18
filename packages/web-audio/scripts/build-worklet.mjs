// Bundle the AudioWorklet processor (src/processor.ts + its workspace deps) into
// a single self-contained IIFE, and emit it as a string export the main-thread
// bundle can load via a Blob URL. Runs before tsup (see package.json "build").
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const outFile = resolve(pkgRoot, 'src/generated/processorSource.js')

const result = await build({
  entryPoints: [resolve(pkgRoot, 'src/processor.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  write: false,
  legalComments: 'none',
})

const code = result.outputFiles[0].text

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(
  outFile,
  `/* AUTO-GENERATED from src/processor.ts by scripts/build-worklet.mjs — do not edit. */\n` +
    `export const PROCESSOR_SOURCE = ${JSON.stringify(code)}\n`,
)

console.log(`[build-worklet] wrote ${outFile} (${(code.length / 1024).toFixed(1)} kB worklet)`)
