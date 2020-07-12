import { Instrument } from "./Instrument"
import { Mixer } from "./Mixer"
import { MODLoader } from "./formats/mod/MODLoader"
import { S3MLoader } from "./formats/s3m/S3MLoader"
import { Player } from "./Player"
import { Sample } from "./Sample"
import { WebAudioDriver } from "./WebAudioDriver"

// @ts-ignore
window.jssynth = {
  Instrument: Instrument,
  Mixer: Mixer,
  MODLoader: MODLoader,
  S3MLoader: S3MLoader,
  Player: Player,
  Sample: Sample,
  WebAudioDriver: WebAudioDriver
};

