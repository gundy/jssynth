import { Mixer } from '@gundy/jssynth-core'
import { WebAudioDriver } from '@gundy/jssynth-web-audio'
import { Player, S3MLoader, MODLoader, type Loader } from '@gundy/jssynth-tracker'

let mixer: Mixer
let audioOut: WebAudioDriver
let player: Player

// Switch SONG / LOADER here to try the MOD path instead of S3M.
const SONG_URL = 'songs/2ND_PM.s3m'
const makeLoader = (): Loader => new S3MLoader()
// const SONG_URL = 'songs/entity.mod'
// const makeLoader = (): Loader => new MODLoader()
void MODLoader // keep the MOD path referenced for easy switching

async function initAudio() {
  mixer = new Mixer({ numChannels: 8, volume: 64 })
  audioOut = new WebAudioDriver(mixer, 4096)
  player = new Player(mixer)

  const data = await fetch(SONG_URL).then((r) => r.arrayBuffer())
  player.setSong(makeLoader().loadSong(data))
}

function startPlaying() {
  audioOut?.start()
}

function stopPlaying() {
  audioOut?.stop()
}

document.querySelector<HTMLButtonElement>('#init')!.addEventListener('click', () => void initAudio())
document.querySelector<HTMLButtonElement>('#start')!.addEventListener('click', startPlaying)
document.querySelector<HTMLButtonElement>('#stop')!.addEventListener('click', stopPlaying)
