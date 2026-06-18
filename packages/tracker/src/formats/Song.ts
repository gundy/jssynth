import {EffectMapEntry} from './Effect'
import {Pattern} from "./Pattern";
import {Instrument} from "../Instrument";

export const FREQ_NTSC = { clock: 7159090.5*4 };
export const FREQ_PAL =  { clock: 7093789.2*4 };

interface Song {
    name: string,  /* song name */
    type: string,  /* song type (eg. M!K!, 8CHN etc) */
    channels: number,
    effectMap: { [p: number]: EffectMapEntry },
    songLength: number,
    orders: number[],  /* number of pattern to play at each song position */
    patterns: Pattern[],
    instruments: Instrument[],
    defaultPanPos: number[],
    initialSpeed: number,
    initialBPM: number,
    globalVolume: number,
    masterVolume: number,
    defaultFreq: {[key: string]:number},
    fastS3MVolumeSlides: boolean
}

/**
 * Build a fresh, blank song with default values.
 *
 * This is a factory (not a shared constant) on purpose: loaders mutate the
 * returned object as they parse, so each load must start from its own instance.
 * The previous shared `BLANK_SONG` constant was mutated in place by MODLoader,
 * permanently polluting the defaults that S3MLoader later cloned.
 */
function createBlankSong(): Song {
    return {
        name: "",
        type: "M!K!",
        channels: 4,
        effectMap: {},
        songLength: 0,
        orders: [],
        patterns: [],
        instruments: [],
        defaultPanPos: [ -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8],
        initialSpeed: 6,
        initialBPM: 125,
        globalVolume: 64,
        masterVolume: 64,
        defaultFreq: FREQ_PAL,
        fastS3MVolumeSlides: false
    };
}

export { Song, createBlankSong };
