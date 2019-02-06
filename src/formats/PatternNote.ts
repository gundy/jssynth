interface PatternNote {
    sampleNumber: number,
    note: number,
    effect: number,
    parameter: number,
    volume: number,
    volumeEffect: number,
    volumeEffectParameter: number,
}

const EMPTY_NOTE: PatternNote = {
    sampleNumber: 0,
    note: 0,
    effect: 0,
    parameter: 0,
    volume: 0,
    volumeEffect: 0,
    volumeEffectParameter: 0
};

export { PatternNote, EMPTY_NOTE }
