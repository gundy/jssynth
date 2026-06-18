import { Mixer } from '@gundy/jssynth-core'
import { WebAudioDriver } from '@gundy/jssynth-web-audio'
import { Player, S3MLoader } from '@gundy/jssynth-tracker'
import { second_pm_s3m } from './songs/2ND_PM.s3m'

let mixer: Mixer
let audioOut: WebAudioDriver
let player: Player

function initAudio() {
  mixer = new Mixer({ numChannels: 8, volume: 64 })
  audioOut = new WebAudioDriver(mixer, 4096)
  player = new Player(mixer)

  // Swap to MODLoader + the entity.mod song to try the MOD path instead.
  const loader = new S3MLoader()
  player.setSong(loader.loadSong(second_pm_s3m))
}

function startPlaying() {
  audioOut?.start()
}

function stopPlaying() {
  audioOut?.stop()
}

document.querySelector<HTMLButtonElement>('#init')!.addEventListener('click', initAudio)
document.querySelector<HTMLButtonElement>('#start')!.addEventListener('click', startPlaying)
document.querySelector<HTMLButtonElement>('#stop')!.addEventListener('click', stopPlaying)
