jssynth
=======

JSSynth is a pure JavaScript library for dealing with sampled and synthesised digital audio.

It currently comprises a mixer component and an integration layer to output sampled audio via
the web audio API as supported in later versions of Chrome (and hopefully other browsers soon too).

Here's an example of using the mixer to whet your appetite:

```JavaScript
    var sample = new jssynth.Sample(.....);

    var mixer = new jssynth.Mixer({ numChannels: 8, volume: 64}); /* initialise the mixer */
    var audioOut = new jssynth.WebAudioOutput(mixer);             /* initialise web audio API w/ mixer */
    audioOut.start();                                             /* start audio mixing / playing */
    
    /* trigger a sample */
    mixer.triggerSample(0, sample, 44100);                        /* play sample, channel 0 @ 44.1kHz */
```

Samples can be either function-based (ie. fully synthetic), or pre-canned sampled digital audio.  
JSSynth is able to read 8/16/24-bit signed/unsigned mono/stereo samples if required.

One of the demos bundled with JSSynth is a pure JavaScript implementation of a .MOD/.S3M file
player that has been built on top of the JSSynth API.  This should help to give an idea of what
might be possible.  

```JavaScript
    var song = jssynth.S3M.readS3Mfile(module);
    var player = new jssynth.MOD.Player(song, 4); /* allocate 4 extra mixer channels for app use */
    var audioOut = new jssynth.WebAudioOutput(player.getMixer());
    audioOut.start();
```

Games, demos, interactive UI's, DSP related apps or prototypes, the sky is the limit.

... and that's all there is to it really.

If you use JSSynth or any of the bundled example code in any projects, please drop by and let 
us know.

BTW, I apologise profusely for the UI in the demos.  Enough said.