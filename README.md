jssynth
=======

[![Build Status](https://travis-ci.org/gundy/jssynth.svg?branch=master)](https://travis-ci.org/gundy/jssynth)


JSSynth is a pure JavaScript (TypeScript) library for dealing with sampled and synthesised digital audio.

It comprises a mixer component and an integration layer to output sampled audio via
the web audio API, as supported in most modern browsers.

Port to TypeScript
==================

Notes on TypeScript conversion:

This version of jssynth has been ported to TypeScript. The project now requires the following tools:

NodeJS environment: use Nodenv (not NVM)
Build tool: Yarn (not NPM, easiest to install via npm install -g yarn)
Test tool: Alsatian (run tests with `yarn run unit-tests`)

Dev setup steps:
================

1. checkout this project and cd into it
2. Make sure nodenv is installed 
3. `npm install -g yarn` # Installs yarn globally for current node version
4. `nodenv rehash` # Tells nodenv to make the new yarn command available
5. `yarn` # Installs all packages
6. `yarn unit-tests` # Runs the unit tests
7. `yarn build` # Builds the project
8. `yarn package` # Generates a release package

IDE:
====
Recommend using Visual Studio Code with "TypeScript TSLint Plugin"

Example:
========

Here's an example of using the Amiga MOD file player to whet your appetite:

```JavaScript
    mixer = new jssynth.Mixer({ numChannels: 8, volume: 64 });
    audioOut = new jssynth.WebAudioDriver(mixer, 4096);
    player = new jssynth.Player(mixer);
    loader = new jssynth.S3MLoader();
    parsedSong = loader.loadSong(second_pm_s3m);

    player.setSong(parsedSong);
    audioOut.start();

    /*
     * at this time audio output has started, mixer.mix() is being called in the background
     * to fill the audio buffers (it's triggered by the web audio layer), and user code
     * is able to start triggering samples too, eg.
     */
    
    mixer.triggerSample(0, sample, 440);                        /* play sample, channel 0 @ A440 */
```

Samples can be either function-based (ie. fully synthetic), or pre-canned sampled digital audio.  
JSSynth is able to interpret and playback 8/16/24-bit, signed/unsigned, mono/stereo samples if required.

In order to allow accurate timing, JSSynth provides a "secondsPerMix" property, which sets
how many seconds worth of audio data JSSynth will generate in each call to the Mixer.mix() method.

The WebAudioDriver interface allows user-code to register a pre-mix callback.  This means that your
code can be notified whenever another x seconds worth of audio data is about to be requested, and
perform whatever updates to the audio state that you need to.  This is very useful for creating 
applications like synthesised audio players.

After calling the pre-mix callback, WebAudioDriver will call Mixer.mix() to generate the next
batch of samples for playback.

Please look at my other projects for an example of a pure JavaScript implementation of a .MOD/.S3M file
player that has been built on top of the JSSynth API.  This should help to give an idea of what
might be possible.  

Games, demos, interactive UI's, DSP related apps or prototypes, the sky is the limit.

... and that's all there is to it really.

If you use JSSynth or any of the related example code in any projects, please drop by and let 
me know.
