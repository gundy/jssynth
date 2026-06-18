import type { CellViewModel, PatternViewModel, RowViewModel } from '../patternViewModel'

function classes(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function PatternChannel({ cell }: { cell: CellViewModel }) {
  return (
    <td className={classes('pattern-data', cell.invertLoop && 'invert-loop')}>
      {cell.note} {cell.sampleNumber} {cell.volume} {cell.effect} {cell.parameter}
    </td>
  )
}

function PatternRow({ row }: { row: RowViewModel }) {
  const rowClasses = classes(
    'pattern-row',
    row.playing && 'playing',
    !row.empty && 'row-has-data',
    row.rowNum !== '' && Number(row.rowNum) % 2 === 0 && 'alternate-row',
  )
  return (
    <tr className={rowClasses}>
      <th className="pattern-row-num">{row.rowNum}</th>
      {row.channels.map((cell, i) => (
        <PatternChannel key={i} cell={cell} />
      ))}
    </tr>
  )
}

export function Pattern({ model }: { model: PatternViewModel }) {
  const header = model.rows[0]?.channels ?? []
  return (
    <table className="scrollable song-pattern">
      <thead>
        <tr>
          <th></th>
          {header.map((_, cn) => (
            <th key={cn}>{cn + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {model.rows.map((row, i) => (
          <PatternRow key={i} row={row} />
        ))}
      </tbody>
    </table>
  )
}
