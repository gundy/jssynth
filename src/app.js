import SinusScroller from 'components/sinus_scroller.vue';
import AppRoot from 'components/app-root.vue';
import Vue from 'vue/dist/vue.js';

import {Mixer} from 'src/jssynth'
import {WebAudioDriver} from 'src/jssynth'
import {Player} from 'src/jssynth-mod'
// import {MODLoader} from 'jssynth-mod';
import {S3MLoader} from 'src/jssynth-mod';

// import modFile from 'music/entity.mod'
import s3mFile from 'music/cybertri.s3m'

// window.song = MODLoader.readMODfile(modFile);
window.song = S3MLoader.readS3Mfile(s3mFile);

window.mixer = new Mixer({numChannels: 16 /* all 8 channels for music */ });
window.player = new Player(window.mixer);
window.player.setSong(window.song);
window.audioOut = new WebAudioDriver(window.mixer, 4096);  /* 4096/8192/.. = buffer size */

new Vue({
  el: '#app',
  components: {
    'sinus-scroller': SinusScroller,
    'app-root': AppRoot,
  }
});

window.audioOut.start();
