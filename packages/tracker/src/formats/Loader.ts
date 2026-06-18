import { Song } from './Song';

export interface Loader {
  loadSong(data: ArrayBuffer): Song
}
