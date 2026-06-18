import { Song } from './Song';

export interface Loader {
  loadSong(data: string): Song
}
