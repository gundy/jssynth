import { S3MLoader, MODLoader, type Loader } from '@gundy/jssynth-tracker'
import { JssynthAudio } from '@gundy/jssynth-web-audio'

// Switch SONG / LOADER here to try the MOD path instead of S3M.
const SONG_URL = 'songs/2ND_PM.s3m'
const makeLoader = (): Loader => new S3MLoader()
// const SONG_URL = 'songs/entity.mod'
// const makeLoader = (): Loader => new MODLoader()
void MODLoader // keep the MOD path referenced for easy switching

let audio: JssynthAudio | null = null

const status = document.querySelector<HTMLPreElement>('#status')!

async function initAudio() {
  audio = await JssynthAudio.create()

  const data = await fetch(SONG_URL).then((r) => r.arrayBuffer())
  audio.load(makeLoader().loadSong(data))

  // The visualizer seam: pattern/row state, streamed from the audio thread.
  audio.on('state', (e) => {
    status.textContent =
      `pos ${e.pos}  row ${String(e.row).padStart(2, '0')}  ` +
      `bpm ${e.bpm}  spd ${e.speed}  frame ${e.frame}`
  })

  status.textContent = 'loaded — press Start'
}

async function startPlaying() {
  await audio?.start()
}

function stopPlaying() {
  audio?.stop()
}

document.querySelector<HTMLButtonElement>('#init')!.addEventListener('click', () => void initAudio())
document.querySelector<HTMLButtonElement>('#start')!.addEventListener('click', () => void startPlaying())
document.querySelector<HTMLButtonElement>('#stop')!.addEventListener('click', stopPlaying)
