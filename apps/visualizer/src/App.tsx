import { useCallback, useEffect, useRef, useState } from 'react'
import { MODLoader, S3MLoader, type Loader, type Song } from '@gundy/jssynth-tracker'
import { JssynthAudio, type PlayerStateEvent } from '@gundy/jssynth-web-audio'
import { buildPatternViewModel } from './patternViewModel'
import { Pattern } from './components/Pattern'
import { SongDetails, type PlaybackView } from './components/SongDetails'
import { InstrumentList } from './components/InstrumentList'

const DEFAULT_SONG = 'songs/entity.mod'

function loaderFor(name: string): Loader {
  return name.toLowerCase().endsWith('.s3m') ? new S3MLoader() : new MODLoader()
}

export function App() {
  const audioRef = useRef<JssynthAudio | null>(null)
  const [song, setSong] = useState<Song | null>(null)
  const [songName, setSongName] = useState('')
  const [state, setState] = useState<PlayerStateEvent | null>(null)
  const [playing, setPlaying] = useState(false)

  const loadBuffer = useCallback((buf: ArrayBuffer, name: string) => {
    const parsed = loaderFor(name).loadSong(buf)
    setSong(parsed)
    setSongName(name)
    setState(null) // back to a static row-0 view until playback drives it
    audioRef.current?.load(parsed) // if audio is already up, swap the song in the worklet
  }, [])

  // Load a default song for a static view (no audio until the user presses Play).
  useEffect(() => {
    let cancelled = false
    fetch(DEFAULT_SONG)
      .then((r) => r.arrayBuffer())
      .then((b) => {
        if (!cancelled) loadBuffer(b, DEFAULT_SONG.split('/').pop()!)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [loadBuffer])

  // Tear down the audio context on unmount.
  useEffect(() => {
    return () => {
      void audioRef.current?.dispose()
      audioRef.current = null
    }
  }, [])

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) {
      const a = await JssynthAudio.create()
      a.on('state', (e) => setState(e))
      audioRef.current = a
    }
    return audioRef.current
  }, [])

  const onPlay = useCallback(async () => {
    if (!song) return
    const a = await ensureAudio()
    a.load(song)
    await a.start()
    setPlaying(true)
  }, [song, ensureAudio])

  const onStop = useCallback(() => {
    audioRef.current?.stop()
    setPlaying(false)
  }, [])

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      loadBuffer(await file.arrayBuffer(), file.name)
    },
    [loadBuffer],
  )

  const playback: PlaybackView = state
    ? { pos: state.pos, row: state.row, bpm: state.bpm, speed: state.speed }
    : { pos: 0, row: 0, bpm: song?.initialBPM ?? 125, speed: song?.initialSpeed ?? 6 }

  const model = song ? buildPatternViewModel(song, playback.pos, playback.row) : null

  return (
    <>
      <div className="toolbar">
        <input type="file" accept=".mod,.s3m" onChange={onFile} />
        <span className="file-label">{songName || 'no song loaded'}</span>
      </div>

      {song && (
        <>
          <SongDetails song={song} playback={playback} playing={playing} onPlay={onPlay} onStop={onStop} />
          <div className="layout">
            {model && (
              <div>
                <Pattern model={model} />
              </div>
            )}
            <InstrumentList song={song} pos={playback.pos} row={playback.row} />
          </div>
        </>
      )}
    </>
  )
}
