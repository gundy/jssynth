jssynth
=======

JSSynth is a pure JavaScript library for dealing with sampled and synthesised digital audio.

It currently comprises a mixer component and an integration layer to output sampled audio via
the web audio API as supported in later versions of Chrome (and hopefully other browsers soon too).

Here's an example of using the mixer to whet your appetite:

```JavaScript
    var sample = new jssynth_core.Sample(.....);
    var mixer = new jssynth_core.Mixer({ numChannels: 8, volume: 64 }); /* initialise the mixer */
    var audioOut = new jssynth_core.WebAudioOutput(mixer);             /* initialise web audio API w/ mixer */
    audioOut.start();                                             /* start audio mixing / playing */
    
    /* trigger a sample */
    mixer.triggerSample(0, sample, 440);                        /* play sample, channel 0 @ A440 */
```

Samples can be either function-based (ie. fully synthetic), or pre-canned sampled digital audio.  
JSSynth is able to read 8/16/24-bit signed/unsigned mono/stereo samples if required.

One of the demos bundled with JSSynth is a pure JavaScript implementation of a .MOD/.S3M file
player that has been built on top of the JSSynth API.  This should help to give an idea of what
might be possible.  

```JavaScript
        var song = jssynth_mod.readMODfile(moduleData);
        var mixer = new jssynth_core.Mixer({numChannels: 8 /* 4 for music, 4 for effects */ });
        var player = new jssynth_mod.Player(this.mixer);
        player.setSong(this.song);
        var audioOut = new jssynth_core.WebAudioOutput(this.mixer, 4096);  /* 4096/8192/.. = buffer size */
        audioOut.start();

        // ...

        mixer.triggerSample(4, sample, 8000); /* trigger a sample (music is still playing) */

        // ...
```

Games, demos, interactive UI's, DSP related apps or prototypes, the sky is the limit.

... and that's all there is to it really.

If you use JSSynth or any of the bundled example code in any projects, please drop by and let 
us know.

BTW, I apologise profusely for the UI in the demos.  Enough said.