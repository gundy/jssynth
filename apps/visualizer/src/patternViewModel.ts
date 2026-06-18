import { MOD_PERIOD_TABLE, type Song, type PatternNote } from '@gundy/jssynth-tracker'

export interface CellViewModel {
  note: string
  sampleNumber: string
  volume: string
  effect: string
  parameter: string
  /** true when this cell is the MOD "invert loop" command (E-Fx) */
  invertLoop: boolean
}

export interface RowViewModel {
  rowNum: number | ''
  playing: boolean
  empty: boolean
  channels: CellViewModel[]
}

export interface PatternViewModel {
  rows: RowViewModel[]
}

const ROWS_ABOVE = 7
const ROWS_BELOW = 8

/** MOD extended command E, sub-command Fx — "invert loop" / funk repeat. */
function isInvertLoop(note: PatternNote): boolean {
  return note.effect === 0x0e && (note.parameter & 0xf0) === 0xf0
}

const hex2 = (n: number) => ('0' + n.toString(16)).slice(-2)

function emptyCells(numChannels: number): CellViewModel[] {
  const cell: CellViewModel = {
    note: '', sampleNumber: '', volume: '', effect: '', parameter: '', invertLoop: false,
  }
  return Array.from({ length: numChannels }, () => cell)
}

function emptyRow(numChannels: number): RowViewModel {
  return { rowNum: '', playing: false, empty: true, channels: emptyCells(numChannels) }
}

function buildCells(song: Song, channels: PatternNote[]): CellViewModel[] {
  const out: CellViewModel[] = []
  for (let chan = 0; chan < song.channels; chan++) {
    const note = channels[chan]
    let noteText = '---'
    let sampleText = '--'
    let volumeText = '--'
    let effectText = '-'
    let parameterText = '--'

    if (note.note > 0) noteText = MOD_PERIOD_TABLE.getName(note.note)
    if (note.sampleNumber > 0) sampleText = hex2(note.sampleNumber)
    if (note.volume > 0) volumeText = hex2(note.volume)
    if (note.parameter !== 0x00 || note.effect !== 0x00) {
      effectText = song.effectMap[note.effect] ? song.effectMap[note.effect].code : '?'
      parameterText = hex2(note.parameter)
    }

    out.push({
      note: noteText,
      sampleNumber: sampleText,
      volume: volumeText,
      effect: effectText,
      parameter: parameterText,
      invertLoop: isInvertLoop(note),
    })
  }
  return out
}

/**
 * Build a windowed view of the pattern around the playing row: a fixed number of
 * rows above and below, with the current row marked `playing`. Mirrors the
 * original PatternViewModelBuilder, updated to the current Song data model.
 */
export function buildPatternViewModel(song: Song, pos: number, row: number): PatternViewModel {
  const patternNumber = song.orders[pos]
  const pattern = song.patterns[patternNumber]
  const numRows = pattern ? pattern.rows.length : 0

  const rows: RowViewModel[] = []
  let rowCount = 0

  // leading empties so the playing row stays put as it scrolls in
  if (row < ROWS_ABOVE) {
    for (let i = 0; i < ROWS_ABOVE - row; i++) {
      rows.push(emptyRow(song.channels))
      rowCount++
    }
  }

  let currentRow = Math.max(0, row - ROWS_ABOVE)
  const endRow = Math.min(row + ROWS_BELOW, numRows - 1)
  while (currentRow <= endRow) {
    rows.push({
      rowNum: currentRow,
      playing: currentRow === row,
      empty: false,
      channels: buildCells(song, pattern.rows[currentRow].channels),
    })
    currentRow++
    rowCount++
  }

  while (rowCount <= ROWS_ABOVE + ROWS_BELOW) {
    rows.push(emptyRow(song.channels))
    rowCount++
  }

  return { rows }
}
