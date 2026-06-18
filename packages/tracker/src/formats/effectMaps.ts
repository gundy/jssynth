import { EffectMapEntry } from './Effect'
import { MOD_EFFECT_MAP } from './mod/effects/MOD_EFFECT_MAP'
import { S3M_EFFECT_MAP } from './s3m/effects/S3M_EFFECT_MAP'

/**
 * Pick the effect map for a parsed song's type.
 *
 * Used to re-attach the effect map after a Song is structured-cloned across the
 * AudioWorklet boundary: the map's values are Effect class instances (they have
 * div()/tick() methods), which postMessage cannot clone. So the song is shipped
 * without its effectMap and the worklet restores it from the song type.
 */
export function effectMapForType(type: string): { [p: number]: EffectMapEntry } {
  return type === 'S3M' ? S3M_EFFECT_MAP : MOD_EFFECT_MAP
}
