"use strict";

import {AMIGA_FILTERS} from './AMIGA_FILTERS';
import {MOD_PERIOD_TABLE} from './formats/mod/MOD_PERIOD_TABLE';
import {Envelope} from './Envelope';
import {Song, FREQ_PAL} from "./formats/Song";
import {Mixer} from "./Mixer";
import {Effect, EffectMapEntry} from "./formats/Effect";
import {TEMPLATE_EFFECT} from "./formats/mod/effects/AbstractEffect";
import {PatternNote} from "./formats/PatternNote";
import {PatternRow} from "./formats/PatternRow";
import {Sample} from "./Sample";

/*
 * ======================================== PLAYER ===========================================
 */


export interface PlayerGlobalState {
  freq: {[key:string]:number},
  pos: number,
  row: number,
  tick: number,
  speed: number,
  bpm: number,
  globalVolume: number,
  patternDelay: number,
  glissandoControl: number,  /* 1 means that slides are locked to note values - should be boolean? */
  breakToRow: number,  /* row to break to - used for pattern break command */
  jumpToPattern: number,  /* pattern to break to - used for jumps */
  l_breakToRow: number,  /* for pattern loop */
  l_jumpToPattern: number,
  fastS3MVolumeSlides: boolean,
  filter: number
}

export interface PlayerChannelState {
  chan: number,
  panPos: number,
  volume: number,
  lastVolume: number,  /* last officially set volume - base volume for tremolo */
  period: number,
  pitchOfs: number,
  lastPeriod: number,  /* last officially set period - base period for vibrato */
  effect: Effect,
  effectParameter: number,
  volumeEnvelopeSequence: Iterator<number>,
  hasCut: boolean,
  sample: Sample,
  effectState: {
    lastS3MPortDown: number,
    lastS3MVolSlide: number,
    lastXMGlobalVolSlide: number,
    tremorCount: number,
    tremorParam: number,
    arpPos: number,
    noteDelay: {
      delay: number,
      note: PatternNote,
      sample: Sample
    },
    arpTable: number[],
    portAmt: number,
    portToNoteDestPeriod: number,
    portToNoteSpeed: number,
    vibratoParams: {
      waveform: number,
      pos: number,
      depth: number,
      speed: number
    },
    tremoloParams: {
      waveform: number,
      pos: number,
      depth: number,
      speed: number
    },
    patternLoop: {
      row: number,
      count: number
    },
    invertLoop: {
      pos: number,
      delay: number,
      sample: Sample
    }
  }
}

/*
 * SONG PLAYER ...
 */
export class Player {
  private playerState: PlayerGlobalState;
  private playing: boolean;
  private loggingEnabled: boolean;
  private song: Song;
  private mixer: Mixer;
  private stateCallback: (playerState: PlayerGlobalState, channelState: PlayerChannelState[]) => void;
  private channelState: PlayerChannelState[];
  private effectMap: { [p: number]: EffectMapEntry };



  constructor(mixer: Mixer) {
    this.playing = true;
    this.loggingEnabled = false;
    this.song = null;
    this.stateCallback = null;
    this.mixer = mixer;
    this.mixer.setPreMixCallback(this.preSampleMix, this);
  }

  setSong(song: Song) {
    this.song = song;
    this.effectMap = song.effectMap;
    this.playerState = {
      freq: song.defaultFreq || FREQ_PAL,

      pos: 0,
      row: -1,
      tick: 6,
      speed: song.initialSpeed || 6,
      bpm: song.initialBPM || 125,
      globalVolume: song.globalVolume || 64,
      patternDelay: 0,
      glissandoControl: 0,  /* 1 means that slides are locked to note values */
      breakToRow: null,
      jumpToPattern: null,
      l_breakToRow: null,  /* for pattern loop */
      l_jumpToPattern: null,
      fastS3MVolumeSlides: song.fastS3MVolumeSlides || false,
      filter: 0
    };

    let defaultPanPos = song.defaultPanPos || [ -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8,-0.8, 0.8, 0.8, -0.8];
    this.channelState = [];
    for (let i = 0; i < song.channels; i++) {
      this.channelState[i] = {
        chan: i,
        panPos: defaultPanPos[i],
        volume: 64,
        lastVolume: undefined,  /* last officially set volume - base volume for tremolo */
        period: 0,
        pitchOfs: 1,
        lastPeriod: 0,  /* last officially set period - base period for vibrato */
        effect: TEMPLATE_EFFECT,
        effectParameter: 0,
        volumeEnvelopeSequence: new Envelope(64).sequence(),
        hasCut: false,
        sample: null,
        effectState: {
          tremorCount: 0,
          tremorParam: 0,
          arpPos: 0,
          noteDelay: null,
          arpTable: [],
          portAmt: 0,
          portToNoteDestPeriod: 0,
          portToNoteSpeed: 0,
          lastS3MPortDown: 0,
          lastS3MVolSlide: 0,
          lastXMGlobalVolSlide: 0,
          vibratoParams: {
            waveform: 0,
            pos: 0,
            depth: 0,
            speed: 0
          },
          tremoloParams: {
            waveform: 0,
            pos: 0,
            depth: 0,
            speed: 0
          },
          patternLoop: {
            row: 0,
            count: null
          },
          invertLoop: {
            pos: 0,
            delay: 0,
            sample: null
          }
        }
      };
      this.mixer.setPanPosition(i, this.channelState[i].panPos);
    }
  }

  start() {
    this.playing = true;
  }

  stop() {
    // stop any further notes from being played
    this.playing = false;

    // and cut output from all song player related channels
    for (let chan = 0; chan < this.song.channels; chan++) {
      this.mixer.cut(chan);
    }
  }

  preSampleMix(mixer: Mixer, sampleRate: number) {
    if (!this.playing) {
      return;
    }
    let state = this.playerState;
    let song = this.song;
    if (state.patternDelay > 0) {
      state.patternDelay--;
      this.handleTick(song.patterns[song.orders[state.pos]].rows[state.row], state.tick, sampleRate);
    } else {
      if (state.tick == 0) {
        if (this.stateCallback) {
          this.stateCallback(this.playerState, this.channelState);
        }
        this.handleDiv(song.patterns[song.orders[state.pos]].rows[state.row], sampleRate);
      } else {
        this.handleTick(song.patterns[song.orders[state.pos]].rows[state.row], state.tick, sampleRate);
      }
      this.advanceTick();
    }
    if (state.tick === 0) {
      /*
       * l_jumpToPattern and l_breakToRow are used for pattern loops;
       * these are processed _before_ normal jump to pattern/row commands
       */
      if (state.l_jumpToPattern !== null) {
        state.jumpToPattern = state.l_jumpToPattern;
        state.breakToRow = state.l_breakToRow;
        state.l_jumpToPattern = null;
        state.l_breakToRow = null;
      }
      if (state.jumpToPattern !== null) {
        state.pos = state.jumpToPattern;
        state.jumpToPattern = null;
        if (state.breakToRow !== null) {
          state.row = state.breakToRow;
          state.breakToRow = null;
        } else {
          state.row = 0;
        }
      }
      if (state.breakToRow !== null) {
        if (state.row !== 0) {
          this.advancePos();
        }
        state.row = state.breakToRow;
        state.breakToRow = null;
      }
    }
    if (this.playerState.filter > 0) {
      this.mixer.setFilters(AMIGA_FILTERS);
    } else {
      this.mixer.setFilters(null);
    }
    this.mixer.setGlobalVolume(state.globalVolume);
    this.mixer.setSecondsPerMix(1 / (state.bpm * 2 / 5));
  }

  /**
   * Jump to the next position in the song
   */
  nextPos() {
    this.advancePos();
    this.playerState.row = 0;
    this.playerState.tick = 0;
  }

  /**
   * Jump to the previous position in the song
   */
  previousPos() {
    this.decrementPos();
    this.playerState.row = 0;
    this.playerState.tick = 0;
  }

  advancePos() {
    let state = this.playerState;
    let song = this.song;

    do {
      state.pos = state.pos + 1;
    } while (song.orders[state.pos] == 254);

    if (state.pos >= song.songLength || song.orders[state.pos] == 255) {
      state.pos = 0;
    }
  }

  decrementPos() {
    let state = this.playerState;
    let song = this.song;

    do {
      state.pos -= 1;
    } while (song.orders[state.pos] == 254);

    if (state.pos < 0) {
      state.pos = song.songLength;
      do {
        state.pos -= 1;
      } while (song.orders[state.pos] == 254);
    }
  }

  advanceRow() {
    let state = this.playerState;
    let song = this.song;

    let numRows = song.patterns[song.orders[state.pos]].rows.length;
    state.row = state.row + 1;

    if (state.row >= numRows) {
      let chan;
      for (chan = 0; chan < song.channels; chan++) {
        this.channelState[chan].effectState.patternLoop.row = 0;
      }
      state.row = 0;
      this.advancePos();
    }
  }

  advanceTick() {
    let state = this.playerState;
    state.tick += 1;
    if (state.tick >= state.speed) {
      state.tick = 0;
      this.advanceRow();
    }
  }

  handleTick(row: PatternRow, tick: number, sampleRate: number) {
    for (let chan = 0; chan < this.song.channels; chan++) {
      let chanState = this.channelState[chan];
      let effectParameter = chanState.effectParameter;
      let effectHandler = chanState.effect;
      let volumeEffectHandler = null, volumeEffectParameter = null;
      if (row && row.channels[chan] && row.channels[chan].volumeEffect) {
        volumeEffectHandler = this.effectMap[row.channels[chan].volumeEffect].effect;
        volumeEffectParameter = row.channels[chan].volumeEffectParameter;
      }
      if (volumeEffectHandler) {
        volumeEffectHandler.tick(this.mixer, chan, volumeEffectParameter, this.playerState, chanState, null, null, this.song);
      }
      if (effectHandler) {
        effectHandler.tick(this.mixer, chan, effectParameter, this.playerState, chanState, null, null, this.song);
      }
      let periodToPlay = chanState.period;
      if (this.playerState.glissandoControl > 0) {
        let noteNum = MOD_PERIOD_TABLE.getNote(periodToPlay);
        periodToPlay = MOD_PERIOD_TABLE.getPeriod(noteNum);
      }
      let freqHz = (this.playerState.freq.clock / (periodToPlay * 2)) * chanState.pitchOfs;
      this.mixer.setFrequency(chan, freqHz);
      let hasCut = chanState.hasCut;
      let volumeEnvelopeValue = chanState.volumeEnvelopeSequence.next(hasCut).value;
      //if (chanState.hasCut) {
      //	console.log("Cut vol env seq on channel "+chan);
      //}
      this.mixer.setVolume(chan, chanState.volume * (volumeEnvelopeValue / 64.0));
    }
  }

  handleNote(chan: number, note: PatternNote, sampleRate: number) {
    let parms = this.channelState[chan];
    let period = 0;
    if (note.note > 0 && note.note !== 254) {
      period = MOD_PERIOD_TABLE.getPeriod(note.note);
    }
    let sampleNumber = note.sampleNumber - 1;
    parms.effectParameter = note.parameter;
    let effectHandler = this.effectMap[note.effect].effect;
    let volumeEffectHandler: Effect = null,
      volumeEffectParameter = null;
    if (note.volumeEffect) {
      volumeEffectHandler = this.effectMap[note.volumeEffect].effect;
      volumeEffectParameter = note.volumeEffectParameter;
    }
    if (!effectHandler && this.loggingEnabled) {
      console && console.log && console.log("no effect handler for effect "+note.effect.toString(16)+"/"+note.parameter.toString(16));
    }
    parms.effect = effectHandler;

    if (sampleNumber >= 0 && this.song.instruments[sampleNumber]) {

      let instrument = this.song.instruments[sampleNumber];

      let noteToPlay = note.note;
      if (noteToPlay < 0) {
        noteToPlay = MOD_PERIOD_TABLE.getNote(parms.period);
      }
      if (noteToPlay > 0) {
        let sampleNum = instrument.metadata.noteToSampleMap[noteToPlay];
        let sample = instrument.samples[sampleNum];

        // set sample (& volume)
        this.mixer.setSample(chan, sample);
        this.channelState[chan].sample = sample;

        parms.pitchOfs = sample.metadata.pitchOfs || 1;
        if ((effectHandler && effectHandler.allowVolumeChange === true) || !effectHandler) {
          parms.volume = sample.metadata.volume;
          parms.lastVolume = sample.metadata.volume;
        }
      }

      parms.volumeEnvelopeSequence = new Envelope(64,
        instrument.metadata.volumeType,
        instrument.metadata.volumeEnvelope,
        instrument.metadata.numVolumePoints,
        instrument.metadata.volumeSustainPoint,
        instrument.metadata.volumeLoopStartPoint,
        instrument.metadata.volumeLoopEndPoint,
        instrument.metadata.volumeFadeout
      ).sequence();

    }
    if (period > 0) {
      if ((effectHandler && effectHandler.allowPeriodChange === true) || !effectHandler) {
        parms.period = period;
        parms.lastPeriod = period;
        if ((effectHandler && effectHandler.allowSampleTrigger === true) || !effectHandler) {
          this.mixer.setSamplePosition(chan, 0);
          parms.hasCut = false;
        }
      }
    }
    let volume = note.volume;
    if (volume >= 0) {
      if ((effectHandler && effectHandler.allowVolumeChange === true) || !effectHandler) {
        parms.volume = volume;
        parms.lastVolume = volume;
      }
    }
    if (note.note === 254) {  // 254 means note off
      this.mixer.cut(chan);
      parms.hasCut = true;
    }
    if (volumeEffectHandler) {
      volumeEffectHandler.div(this.mixer, chan, volumeEffectParameter, this.playerState, parms, period, note, this.song);
    }
    if (effectHandler) {
      effectHandler.div(this.mixer, chan, parms.effectParameter, this.playerState, parms, period, note, this.song);
    }
    let periodToPlay = parms.period;
    if (this.playerState.glissandoControl > 0) {
      let noteNum = MOD_PERIOD_TABLE.getNote(periodToPlay);
      periodToPlay = MOD_PERIOD_TABLE.getPeriod(noteNum);
    }
    let hasCut = parms.hasCut;
    let volumeEnvelopeValue = parms.volumeEnvelopeSequence.next(hasCut).value;

    this.mixer.setVolume(chan, parms.volume * (volumeEnvelopeValue / 64));
    let freqHz = this.playerState.freq.clock / (periodToPlay * 2) * parms.pitchOfs;
    this.mixer.setFrequency(chan, freqHz);

  }

  getPlayerState() {
    return this.playerState;
  }

  handleDiv(row: PatternRow, sampleRate: number) {
    for (let chan = 0; chan < this.song.channels; chan++) {
      let note = row.channels[chan];
      this.handleNote(chan, note, sampleRate);
    }
  }

  registerCallback(callback) {
    this.stateCallback = callback;
  }
}

