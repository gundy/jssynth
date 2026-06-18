import { SampleRepeatType } from '@gundy/jssynth-core'
import type { Song } from '@gundy/jssynth-tracker'

interface Props {
  song: Song
  pos: number
  row: number
}

function isSamplePlaying(sampleNum: number, song: Song, pos: number, row: number): boolean {
  const pattern = song.patterns[song.orders[pos]]
  const patternRow = pattern?.rows[row]
  if (!patternRow) return false
  for (let chan = 0; chan < song.channels; chan++) {
    const note = patternRow.channels[chan]
    if (note && note.sampleNumber === sampleNum && note.note > 0 && note.note < 254) {
      return true
    }
  }
  return false
}

export function InstrumentList({ song, pos, row }: Props) {
  return (
    <table className="instrument-list">
      <thead>
        <tr><th colSpan={7}>Instruments</th></tr>
        <tr>
          <th>#</th>
          <th className="name">Name</th>
          <th>Len</th>
          <th>Vol</th>
          <th>Rep?</th>
          <th>Rep Start</th>
          <th>Rep End</th>
        </tr>
      </thead>
      <tbody>
        {song.instruments.map((instrument, i) => {
          const num = i + 1
          const meta = instrument.samples[0]?.metadata
          const playing = isSamplePlaying(num, song, pos, row)
          const repeats = meta ? meta.repeatType !== SampleRepeatType.NON_REPEATING : false
          return (
            <tr key={i} className={playing ? 'playing' : undefined}>
              <td>{num.toString(16)}</td>
              <td className="name">{meta?.name ?? ''}</td>
              <td>{meta?.sampleLength ?? ''}</td>
              <td>{meta?.volume ?? ''}</td>
              <td>{meta ? (repeats ? 'Y' : 'N') : ''}</td>
              <td>{repeats ? meta!.repeatStart : ''}</td>
              <td>{repeats ? meta!.repeatEnd : ''}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
