import type { Song } from '@gundy/jssynth-tracker'

export interface PlaybackView {
  pos: number
  row: number
  bpm: number
  speed: number
}

interface Props {
  song: Song
  playback: PlaybackView
  playing: boolean
  onPlay: () => void
  onStop: () => void
}

export function SongDetails({ song, playback, playing, onPlay, onStop }: Props) {
  const playerOrder = song.orders[playback.pos]
  return (
    <div className="songDetailsContainer">
      <div className="infoRow">
        <div className="songDetails">
          <div className="row"><div className="header">Song Name:</div><div className="value">{song.name}</div></div>
          <div className="row"><div className="header">Song Type:</div><div className="value">{song.type}</div></div>
          <div className="row"><div className="header">Num channels:</div><div className="value">{song.channels}</div></div>
          <div className="row"><div className="header">Song length:</div><div className="value">{song.songLength}</div></div>
        </div>
        <div className="playerDetails">
          <div className="row"><div className="header">Speed:</div><div className="value">{playback.speed} / {playback.bpm}</div></div>
          <div className="row"><div className="header">Position/Pattern:</div><div className="value">{playback.pos} / {playerOrder}</div></div>
          <div className="row"><div className="header">Row:</div><div className="value">{playback.row}</div></div>
        </div>
      </div>
      <div className="controlsRow">
        <div className="controls">
          <button className="button" type="button" onClick={onPlay}>{playing ? 'Restart' : 'Play'}</button>
          <button className="button" type="button" onClick={onStop}>Stop</button>
        </div>
      </div>
      <div className="clear"></div>
    </div>
  )
}
