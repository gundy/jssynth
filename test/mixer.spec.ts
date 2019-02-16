import { Mixer } from "../src/Mixer"
import { Expect, Test } from "alsatian"

export class MixerTestFixture {

  @Test()
  public mixerReturnsCorrectLength() {
    let mixer = new Mixer({secondsPerMix: 1}, {});
    let results = mixer.mix(44100);
    Expect(results.bufferSize).toBe(44100);
    Expect(results.output[0].length).toBe(44100); /* mixing is always in stereo */
    Expect(results.output[1].length).toBe(44100); /* mixing is always in stereo */
  }
}
