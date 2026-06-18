/**
 * The self-contained AudioWorklet processor bundle, as a string.
 *
 * The implementation (processorSource.js) is generated at build time by
 * scripts/build-worklet.mjs (esbuild bundles src/processor.ts + its deps into a
 * single IIFE). This .d.ts is committed so typechecking does not require the
 * generated file to exist.
 */
export declare const PROCESSOR_SOURCE: string
