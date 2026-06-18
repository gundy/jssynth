import {Loader} from '../Loader'
import {Song} from '../Song'

/**
 * XM (FastTracker II) loading is not yet supported.
 *
 * The original implementation was incomplete — partial effect coverage and latent
 * type errors — and no complete copy of the source survived. It will be reinstated
 * as its own milestone (see docs/MODERNIZATION_PLAN.md). This stub keeps the format
 * slot explicit and fails loudly rather than mis-parsing.
 */
export class XMLoader implements Loader {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadSong(_data: ArrayBuffer): Song {
    throw new Error(
      'XM loading is not yet supported (see docs/MODERNIZATION_PLAN.md). Use MODLoader or S3MLoader.',
    )
  }
}
