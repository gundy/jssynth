import {Mixer} from 'lib/jssynth';

describe('Mixer', function(){
  it('returns an amount of data corresponding to secondsPerMix', function(){
    let mixer = new Mixer({secondsPerMix: 1});
    let results = mixer.mix(44100);
    expect(results.bufferSize).to.equal(44100);
    expect(results.output[0].length).to.equal(44100); /* mixing is always in stereo */
    expect(results.output[1].length).to.equal(44100); /* mixing is always in stereo */
  });
});