/**
 * Decode bytes in [start, end) as a latin1 (ISO-8859-1) string — one char per
 * byte. Mirrors the old `binaryString.substring(start, end)` behaviour exactly,
 * so parsed names/tags are byte-for-byte identical to the pre-ArrayBuffer loaders.
 */
export function bytesToLatin1(bytes: Uint8Array, start: number, end: number): string {
  let s = ''
  for (let i = start; i < end; i++) {
    s += String.fromCharCode(bytes[i])
  }
  return s
}
