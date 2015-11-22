System.register('lib/src/webaudiodriver.js', ['npm:babel-runtime@5.2.17/helpers/class-call-check'], function (_export) {
    var _classCallCheck, WA_BUF_SIZE, WA_NUM_OUTPUT_CHANNELS, WebAudioDriver;

    return {
        setters: [function (_npmBabelRuntime5217HelpersClassCallCheck) {
            _classCallCheck = _npmBabelRuntime5217HelpersClassCallCheck['default'];
        }],
        execute: function () {
            'use strict';

            'format es6';

            /* WEB AUDIO OUTPUT SUPPORT */
            WA_BUF_SIZE = 2048;
            WA_NUM_OUTPUT_CHANNELS = 2;

            /**
             * Web Audio ("ScriptProcessorNode") audio output functionality
             * @param mixer A mixer function that gets called periodically to produce new sampled audio data.
             *              mixer provides a single method "mix(sampleRate)" - where sampleRate is, eg. 44100.
             * @param bufferSize the desired size of the output buffer
             * @constructor
             */

            WebAudioDriver = function WebAudioDriver(mixer, bufferSize) {
                _classCallCheck(this, WebAudioDriver);

                var self = this;

                if (window.hasOwnProperty('webkitAudioContext') && !window.hasOwnProperty('AudioContext')) {
                    window.AudioContext = window.webkitAudioContext;
                }

                if (!window.hasOwnProperty('AudioContext')) {
                    throw new Error('Unable to use WebAudioDriver in this browser.');
                }

                this.context = new AudioContext();
                this.node = this.context.createScriptProcessor(bufferSize || WA_BUF_SIZE, 0, WA_NUM_OUTPUT_CHANNELS);

                // array of samples to be written to audio output device
                this.nextSamples = null;
                // offset into nextSamples array that we're currently up to
                this.nextSamplesOffset = 0;

                var processSamples = function processSamples(event) {
                    var outputBuffer = event.outputBuffer;
                    var sampleRate = outputBuffer.sampleRate;
                    var bufferLength = outputBuffer.length;
                    // get output buffers from the AudioProcessingEvent
                    var channelData = [outputBuffer.getChannelData(0), outputBuffer.getChannelData(1)];
                    var i = null;
                    var outputOfs = 0;

                    // bufferLength is the amount of data that the audio system is expecting
                    // - we need to keep looping until we've filled it all up.
                    while (outputOfs < bufferLength) {

                        // if we're out of samples the simply call the mixer to create some more
                        if (!self.nextSamples) {
                            self.nextSamples = mixer.mix(sampleRate);
                            self.nextSamplesOffset = 0;
                        }

                        // fill the output buffers with stuff from the nextSamples buffer
                        // (at least until we fill the output buffer, or drain the nextSamples array)
                        for (var chan = 0; chan < WA_NUM_OUTPUT_CHANNELS; chan++) {
                            for (i = 0; self.nextSamplesOffset + i < self.nextSamples.bufferSize && i + outputOfs < bufferLength; i++) {
                                channelData[chan][outputOfs + i] = self.nextSamples.output[chan][self.nextSamplesOffset + i];
                            }
                        }
                        outputOfs += i;
                        self.nextSamplesOffset += i;

                        // if we've emptied the nextSamples array, then null it out so it will get
                        // replenished from the mixer next time around the loop.
                        if (self.nextSamplesOffset >= self.nextSamples.bufferSize) {
                            self.nextSamples = null;
                        }
                    }
                };

                /**
                 * Start the audio output
                 */
                this.start = function () {
                    this.node.connect(self.context.destination);
                    this.node.onaudioprocess = processSamples;
                };

                /**
                 * Stop/pause the audio output
                 */
                this.stop = function () {
                    this.node.disconnect();
                    this.node.onaudioprocess = undefined;
                };
            };

            _export('WebAudioDriver', WebAudioDriver);
        }
    };
});
System.register("lib/src/instrument.js", ["npm:babel-runtime@5.2.17/helpers/class-call-check", "lib/src/utils.js"], function (_export) {
    var _classCallCheck, Utils, DEFAULT_INSTRUMENT_METADATA, Instrument;

    return {
        setters: [function (_npmBabelRuntime5217HelpersClassCallCheck) {
            _classCallCheck = _npmBabelRuntime5217HelpersClassCallCheck["default"];
        }, function (_libSrcUtilsJs) {
            Utils = _libSrcUtilsJs.Utils;
        }],
        execute: function () {
            "use strict";

            "use strict";

            DEFAULT_INSTRUMENT_METADATA = {
                numSamples: 1,
                name: "Default Instrument",
                noteToSampleMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

                volumeType: 0, // bit 0: On; 1: Sustain; 2: Loop
                volumeEnvelope: [],
                numVolumePoints: 0,
                volumeSustainPoint: 0,
                volumeLoopStartPoint: 0,
                volumeLoopEndPoint: 0,

                panningType: 0, // bit 0: On; 1: Sustain; 2: Loop
                panningEnvelope: [],
                numPanningPoints: 0,
                panningSustainPoint: 0,
                panningLoopStartPoint: 0,
                panningLoopEndPoint: 0,

                vibratoType: 0, // ???
                vibratoSweep: 0,
                vibratoDepth: 0,
                vibratoRate: 0,

                volumeFadeout: 0
            };

            Instrument = function Instrument(metadata, samples) {
                _classCallCheck(this, Instrument);

                this.metadata = Utils.merge(DEFAULT_INSTRUMENT_METADATA, metadata);
                this.samples = samples;
            };

            _export("Instrument", Instrument);
        }
    };
});
System.register("lib/src/sample.js", ["npm:babel-runtime@5.2.17/helpers/create-class", "npm:babel-runtime@5.2.17/helpers/class-call-check", "lib/src/utils.js"], function (_export) {
    var _createClass, _classCallCheck, Utils, DEFAULT_SAMPLE_METADATA, Sample;

    return {
        setters: [function (_npmBabelRuntime5217HelpersCreateClass) {
            _createClass = _npmBabelRuntime5217HelpersCreateClass["default"];
        }, function (_npmBabelRuntime5217HelpersClassCallCheck) {
            _classCallCheck = _npmBabelRuntime5217HelpersClassCallCheck["default"];
        }, function (_libSrcUtilsJs) {
            Utils = _libSrcUtilsJs.Utils;
        }],
        execute: function () {
            "use strict";

            "use strict";

            DEFAULT_SAMPLE_METADATA = {
                name: "",
                bits: 8,
                channels: 1,
                littleEndian: true,
                deltaEncoding: false,
                signed: true,
                sampleRate: 8000,
                representedFreq: 440, /* the frequency that this sample will produce if played at it's sample rate */
                pitchOfs: 1,
                repeatType: "NON_REPEATING",
                volume: 64,
                repeatStart: 0,
                repeatEnd: 0,
                sampleLength: 0
            };

            /*
             * Convert a set of raw (byte-wise) samples into arrays of doubles
             *
             * metadata important to parsing samples is of the form:
             * {
             *   "bits":            8|16|24,
             *   "channels":        1|2,
             *   "sampleLength":    number of sample points in the sample,
             *   "littleEndian":    boolean -> true if samples are stored in little endian format,
             *   "signed":          boolean -> true if samples are stored in signed format (-127..128 instead of 0..255)
             *   "deltaEncoding":   boolean -> true if each new sample is stored as a delta from previous value
             * }
             *
             * defaults are: bits=8, channels=1
             *
             * metadata describes the content of samples.
             *
             * samples are read
             *  0..num_samples
             *    0..num_channels
             *      0..bytes_per_sample
             */

            Sample = (function () {
                function Sample(sampleData, metadata, offset) {
                    _classCallCheck(this, Sample);

                    this.metadata = Utils.merge(DEFAULT_SAMPLE_METADATA, metadata);

                    if (typeof sampleData === "function") {
                        this.data = sampleData();
                    } else {
                        this.data = Sample.convertSamplesBytesToDoubles(sampleData, metadata, offset);
                    }

                    /*
                     this looks a little weird, but we're just extending the end of the sample if
                     it's set to repeat, so that interpolation doesn't get confused across repeat
                     boundaries.
                     */
                    if (this.metadata.repeatType !== "NON_REPEATING") {
                        for (var c = 0; c < this.data.length; c++) {
                            this.data[c][metadata.repeatEnd + 1] = this.data[c][metadata.repeatEnd];
                        }
                    }
                }

                _createClass(Sample, null, [{
                    key: "convertSamplesBytesToDoubles",

                    /*
                     * Convert a set of raw (byte-wise) samples into arrays of doubles
                     */
                    value: function convertSamplesBytesToDoubles(samples, meta, offset) {
                        var startOfs = offset || 0;
                        var channelData = [];
                        var rawData = [];
                        var chan;

                        for (chan = 0; chan < meta.channels; chan++) {
                            channelData[chan] = [];
                            rawData[chan] = [];
                        }
                        if (meta.bits % 8 !== 0 || meta.bits > 24) {
                            throw new Error("can only read 8, 16 or 24-bit samples");
                        }
                        var bytesPerSample = meta.bits / 8;
                        var bytesPerSamplePeriod = bytesPerSample * meta.channels;
                        var periodsToRead = meta.sampleLength;
                        for (var i = 0; i < periodsToRead; i++) {
                            var ofs = bytesPerSamplePeriod * i;
                            for (chan = 0; chan < meta.channels; chan++) {
                                var chanOfs = ofs + chan * bytesPerSample;
                                var startBytePos = chanOfs + (meta.littleEndian ? bytesPerSample - 1 : 0);
                                var endBytePos = chanOfs + (meta.littleEndian ? -1 : bytesPerSample);
                                var bytePosDelta = meta.littleEndian ? -1 : 1;
                                var data = 0;
                                var scale = 0.5;
                                var mask = 255;
                                for (var bytePos = startBytePos; bytePos !== endBytePos; bytePos += bytePosDelta) {
                                    data = data * 256 + samples.charCodeAt(startOfs + bytePos);
                                    scale = scale * 256;
                                    mask = mask * 256 + 255;
                                }
                                if (meta.signed) {
                                    /* samp XOR 0x8000 & 0xffff converts from signed to unsigned */
                                    data = (data ^ scale) & mask;
                                }
                                if (meta.deltaEncoding) {
                                    var previousVal = i == 0 ? 0 : rawData[chan][i - 1];
                                    rawData[chan][i] = previousVal + ((data ^ scale) & mask) & 255;
                                    channelData[chan][i] = (((rawData[chan][i] ^ scale) & mask) - scale) / scale;
                                } else {
                                    data = (data - scale) / scale;
                                    channelData[chan][i] = data;
                                }
                            }
                        }
                        return channelData;
                    }
                }]);

                return Sample;
            })();

            _export("Sample", Sample);
        }
    };
});
System.register("lib/src/utils.js", ["npm:babel-runtime@5.2.17/helpers/create-class", "npm:babel-runtime@5.2.17/helpers/class-call-check"], function (_export) {
    var _createClass, _classCallCheck, Utils;

    return {
        setters: [function (_npmBabelRuntime5217HelpersCreateClass) {
            _createClass = _npmBabelRuntime5217HelpersCreateClass["default"];
        }, function (_npmBabelRuntime5217HelpersClassCallCheck) {
            _classCallCheck = _npmBabelRuntime5217HelpersClassCallCheck["default"];
        }],
        execute: function () {
            "use strict";

            "format es6";

            Utils = (function () {
                function Utils() {
                    _classCallCheck(this, Utils);
                }

                _createClass(Utils, null, [{
                    key: "clone",

                    /**
                     * Perform a shallow clone of a JS object
                     * @param obj
                     * @returns {{}}
                     */
                    value: function clone(obj) {
                        var newObj = {};

                        for (var key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                newObj[key] = obj[key];
                            }
                        }
                        return newObj;
                    }
                }, {
                    key: "merge",

                    /**
                     * Take a clone of existingObj and merge new properties into the clone
                     * @param existingObj
                     * @param toMerge
                     * @returns {{}}
                     */
                    value: function merge(existingObj, toMerge) {
                        var newObj = Utils.clone(existingObj);

                        if (toMerge !== undefined && toMerge !== null) {
                            for (var key in toMerge) {
                                if (toMerge.hasOwnProperty(key)) {
                                    newObj[key] = toMerge[key];
                                }
                            }
                        }
                        return newObj;
                    }
                }, {
                    key: "makeArrayOf",

                    /**
                     * Make an array consisting of length copies of value
                     * @param value
                     * @param length
                     * @returns {Array}
                     */
                    value: function makeArrayOf(value, length) {
                        var arr = [],
                            i = length;
                        while (i--) {
                            arr[i] = value;
                        }
                        return arr;
                    }
                }]);

                return Utils;
            })();

            _export("Utils", Utils);
        }
    };
});
System.registerDynamic("npm:core-js@0.9.7/library/modules/$.fw", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function($) {
    $.FW = false;
    $.path = $.core;
    return $;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@0.9.7/library/modules/$", ["npm:core-js@0.9.7/library/modules/$.fw"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = typeof self != 'undefined' ? self : Function('return this')(),
      core = {},
      defineProperty = Object.defineProperty,
      hasOwnProperty = {}.hasOwnProperty,
      ceil = Math.ceil,
      floor = Math.floor,
      max = Math.max,
      min = Math.min;
  var DESC = !!function() {
    try {
      return defineProperty({}, 'a', {get: function() {
          return 2;
        }}).a == 2;
    } catch (e) {}
  }();
  var hide = createDefiner(1);
  function toInteger(it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  }
  function desc(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  }
  function simpleSet(object, key, value) {
    object[key] = value;
    return object;
  }
  function createDefiner(bitmap) {
    return DESC ? function(object, key, value) {
      return $.setDesc(object, key, desc(bitmap, value));
    } : simpleSet;
  }
  function isObject(it) {
    return it !== null && (typeof it == 'object' || typeof it == 'function');
  }
  function isFunction(it) {
    return typeof it == 'function';
  }
  function assertDefined(it) {
    if (it == undefined)
      throw TypeError("Can't call method on  " + it);
    return it;
  }
  var $ = module.exports = $__require('npm:core-js@0.9.7/library/modules/$.fw')({
    g: global,
    core: core,
    html: global.document && document.documentElement,
    isObject: isObject,
    isFunction: isFunction,
    it: function(it) {
      return it;
    },
    that: function() {
      return this;
    },
    toInteger: toInteger,
    toLength: function(it) {
      return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0;
    },
    toIndex: function(index, length) {
      index = toInteger(index);
      return index < 0 ? max(index + length, 0) : min(index, length);
    },
    has: function(it, key) {
      return hasOwnProperty.call(it, key);
    },
    create: Object.create,
    getProto: Object.getPrototypeOf,
    DESC: DESC,
    desc: desc,
    getDesc: Object.getOwnPropertyDescriptor,
    setDesc: defineProperty,
    setDescs: Object.defineProperties,
    getKeys: Object.keys,
    getNames: Object.getOwnPropertyNames,
    getSymbols: Object.getOwnPropertySymbols,
    assertDefined: assertDefined,
    ES5Object: Object,
    toObject: function(it) {
      return $.ES5Object(assertDefined(it));
    },
    hide: hide,
    def: createDefiner(0),
    set: global.Symbol ? simpleSet : hide,
    mix: function(target, src) {
      for (var key in src)
        hide(target, key, src[key]);
      return target;
    },
    each: [].forEach
  });
  if (typeof __e != 'undefined')
    __e = core;
  if (typeof __g != 'undefined')
    __g = global;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@0.9.7/library/fn/object/define-property", ["npm:core-js@0.9.7/library/modules/$"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = $__require('npm:core-js@0.9.7/library/modules/$');
  module.exports = function defineProperty(it, key, desc) {
    return $.setDesc(it, key, desc);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.2.17/core-js/object/define-property", ["npm:core-js@0.9.7/library/fn/object/define-property"], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": $__require('npm:core-js@0.9.7/library/fn/object/define-property'),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.2.17/helpers/create-class", ["npm:babel-runtime@5.2.17/core-js/object/define-property"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _Object$defineProperty = $__require('npm:babel-runtime@5.2.17/core-js/object/define-property')["default"];
  exports["default"] = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        _Object$defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.2.17/helpers/class-call-check", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports["default"] = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

System.register('lib/src/mixer.js', ['npm:babel-runtime@5.2.17/helpers/class-call-check', 'npm:babel-runtime@5.2.17/helpers/create-class', 'lib/src/utils.js'], function (_export) {
    var _classCallCheck, _createClass, Utils, DEFAULT_GLOBAL_STATE, DEFAULT_CHANNEL_STATE, STEP_FUNCS, MixResult, Mixer;

    return {
        setters: [function (_npmBabelRuntime5217HelpersClassCallCheck) {
            _classCallCheck = _npmBabelRuntime5217HelpersClassCallCheck['default'];
        }, function (_npmBabelRuntime5217HelpersCreateClass) {
            _createClass = _npmBabelRuntime5217HelpersCreateClass['default'];
        }, function (_libSrcUtilsJs) {
            Utils = _libSrcUtilsJs.Utils;
        }],
        execute: function () {
            'use strict';

            'format es6';

            DEFAULT_GLOBAL_STATE = {
                numChannels: 8,
                volume: 64,
                secondsPerMix: 0.1,
                filters: null
            };
            DEFAULT_CHANNEL_STATE = {
                panPos: 0, /* -1 = full left, +1 = full right */
                playbackFreqHz: 0,
                sample: undefined,
                samplePosition: -1,
                volume: 64,
                enabled: true
            };
            STEP_FUNCS = { /* step through the sample, key is "repeatType" flag */
                'REP_NORMAL': function REP_NORMAL(samplePos, samplePosStep, repEnd, repLen) {
                    var spTmp = samplePos;
                    spTmp += samplePosStep;
                    while (spTmp >= repEnd) {
                        spTmp -= repLen;
                    }
                    return spTmp;
                },
                'NON_REPEATING': function NON_REPEATING(samplePos, samplePosStep) {
                    return samplePos + samplePosStep;
                }
            };

            MixResult = function MixResult(bufferSize, output) {
                _classCallCheck(this, MixResult);

                this.bufferSize = bufferSize;
                this.output = output;
            };

            Mixer = (function () {
                function Mixer(globalState, defaultChannelState) {
                    _classCallCheck(this, Mixer);

                    this.globalState = Utils.merge(DEFAULT_GLOBAL_STATE, globalState);
                    this.preMixCallback = null;
                    this.preMixObject = null;
                    this.postMixCallback = null;
                    this.postMixObject = null;
                    this.channelState = [];
                    var dcs = Utils.merge(DEFAULT_CHANNEL_STATE, defaultChannelState);
                    for (var chan = 0; chan < this.globalState.numChannels; chan++) {
                        this.channelState[chan] = Utils.clone(dcs);
                    }
                }

                _createClass(Mixer, [{
                    key: 'setPreMixCallback',

                    /**
                     * Set the callback to be called prior to mixing the next batch of samples.
                     *
                     * Note: sample mixing is driven by the audio event loop -
                     *
                     * @param preMixCallback callback function to provide notification toolbar
                     * @param preMixObject object that will receive the notification (sets this)
                     */
                    value: function setPreMixCallback(preMixCallback, preMixObject) {
                        this.preMixCallback = preMixCallback;
                        this.preMixObject = preMixObject;
                    }
                }, {
                    key: 'setPostMixCallback',

                    /**
                     * Set the callback to be called after mixing the next batch of samples
                     * @param postMixCallback
                     * @param postMixObject
                     */
                    value: function setPostMixCallback(postMixCallback, postMixObject) {
                        this.postMixCallback = postMixCallback;
                        this.postMixObject = postMixObject;
                    }
                }, {
                    key: 'setGlobalVolume',
                    value: function setGlobalVolume(vol) {
                        this.globalState.volume = vol;
                    }
                }, {
                    key: 'setSecondsPerMix',

                    /**
                     * Set the number of seconds worth of data to return from each mix() call
                     * @param secondsPerMix
                     */
                    value: function setSecondsPerMix(secondsPerMix) {
                        this.globalState.secondsPerMix = secondsPerMix;
                    }
                }, {
                    key: 'triggerSample',

                    /**
                     * Trigger a sample to start playing on a given channel
                     * @param channel channel to play the sample on
                     * @param sample sample to play
                     * @param freqHz frequency (absolute) to play the sample at
                     */
                    value: function triggerSample(channel, sample, freqHz) {
                        this.channelState[channel].sample = sample;
                        this.channelState[channel].playbackFreqHz = freqHz;
                        this.channelState[channel].samplePosition = 0;
                        this.channelState[channel].volume = sample.metadata.volume;
                    }
                }, {
                    key: 'enableChannels',

                    /**
                     * @param channels a list of channels to enable
                     */
                    value: function enableChannels(channels) {
                        for (var i = 0; i < channels.length; i++) {
                            this.channelState[channels[i]].enabled = true;
                        }
                    }
                }, {
                    key: 'disableChannels',

                    /**
                     * @param channels a list of channels to disable
                     */
                    value: function disableChannels(channels) {
                        for (var i = 0; i < channels.length; i++) {
                            this.channelState[channels[i]].enabled = false;
                        }
                    }
                }, {
                    key: 'setSample',

                    /**
                     * Set sample without updating any other params
                     * @param channel channel to play the sample on
                     * @param sample sample to play
                     * @param freqHz frequency (absolute) to play the sample at
                     */
                    value: function setSample(channel, sample) {
                        this.channelState[channel].sample = sample;
                    }
                }, {
                    key: 'setSamplePosition',

                    /**
                     * Set the current position/offset of the sample playing on a given channel
                     * @param channel
                     * @param offset
                     */
                    value: function setSamplePosition(channel, offset) {
                        var sample = this.channelState[channel].sample;
                        if (sample) {
                            var length = sample.metadata.sampleLength;
                            if (sample.metadata.repeatType !== 'NON_REPEATING') {
                                var repStart = sample.metadata.repeatStart;
                                var repEnd = sample.metadata.repeatEnd;
                                var repLen = repEnd - repStart;
                                while (offset > length) {
                                    offset -= repLen;
                                }
                            }
                            if (offset < length) {
                                this.channelState[channel].samplePosition = offset;
                            } else {
                                this.channelState[channel].samplePosition = -1;
                            }
                        }
                    }
                }, {
                    key: 'addToSamplePosition',

                    /**
                     * Add a phase offset to the sample playing on a given channel
                     * @param channel
                     * @param offset
                     */
                    value: function addToSamplePosition(channel, offset) {
                        var sample = this.channelState[channel].sample;
                        if (sample && this.channelState[channel].samplePosition >= 0) {
                            this.setSamplePosition(channel, this.channelState[channel].samplePosition + offset);
                        }
                    }
                }, {
                    key: 'setFrequency',

                    /**
                     * Change the frequency of a sample playing on a given channel
                     * @param channel
                     * @param freqHz
                     */
                    value: function setFrequency(channel, freqHz) {
                        this.channelState[channel].playbackFreqHz = freqHz;
                    }
                }, {
                    key: 'setVolume',

                    /**
                     * Change the volume of a sample playing on a given channel
                     * @param channel
                     * @param vol
                     */
                    value: function setVolume(channel, vol) {
                        this.channelState[channel].volume = vol;
                    }
                }, {
                    key: 'setPanPosition',

                    /**
                     * Change the L/R mix for a given channel (-1 = full left, +1 = full right)
                     * @param channel
                     * @param panPos
                     */
                    value: function setPanPosition(channel, panPos) {
                        this.channelState[channel].panPos = panPos;
                    }
                }, {
                    key: 'cut',

                    /**
                     * (Immediately) cut playback of a sample playing on a given channel
                     * @param channel
                     */
                    value: function cut(channel) {
                        this.channelState[channel].samplePosition = -1;
                        this.channelState[channel].sample = undefined;
                    }
                }, {
                    key: 'setFilters',

                    /**
                     * Set globally applied filters (array, 0 = left filter, 1 = right filter)
                     * @param filters
                     */
                    value: function setFilters(filters) {
                        if (filters) {
                            this.globalState.filters = filters;
                        } else {
                            this.globalState.filters = null;
                        }
                    }
                }, {
                    key: 'calculatePanMatrix',

                    /* TODO; not sure if things need to get this complicated for now */
                    value: function calculatePanMatrix(pp) {
                        if (pp >= -1 && pp <= 1) {
                            var pp = (pp + 1) / 2; /* shift values from -1 to 1, to be in the range 0..1 (left -> right) */
                            return {
                                ll: 1 - pp, /* left channel, % left mix */
                                lr: 0, /* left channel, % right mix - TODO */
                                rl: 0, /* right channel, % left mix */
                                rr: pp /* right channel, % right mix - TODO */
                            };
                        } else {
                            return { ll: 1, rr: -1 }; /* surround */
                        }
                    }
                }, {
                    key: 'mix',
                    value: function mix(sampleRate) {
                        var self = this;
                        if (this.preMixCallback) {
                            this.preMixCallback.call(this.preMixObject, this, sampleRate);
                        }
                        var i = 0,
                            chan = 0;
                        var output = [];
                        var numSamples = Math.floor(sampleRate * this.globalState.secondsPerMix);
                        output[0] = Utils.makeArrayOf(0, numSamples); /* left */
                        output[1] = Utils.makeArrayOf(0, numSamples); /* right */
                        //output[0] = [];
                        //output[1] = [];
                        var numChannels = this.globalState.numChannels;
                        var globalVolume = this.globalState.volume;
                        for (chan = 0; chan < numChannels; chan++) {
                            var state = this.channelState[chan];
                            if (!state.enabled) {
                                break;
                            }

                            var panPos = this.calculatePanMatrix(state.panPos);
                            var sample = state.sample;

                            var channelVolume = state.volume;
                            var samplePos = state.samplePosition;
                            var samplePosStep = state.playbackFreqHz / sampleRate;
                            var scale = 1 / (numChannels / 2) * (globalVolume / 64) * (channelVolume / 64);
                            var leftScale = scale * panPos.ll;
                            var rightScale = scale * panPos.rr;
                            if (sample && sample.data && samplePos >= 0 && samplePosStep > 0) {
                                var representedFreq = sample.metadata.representedFreq;
                                var sampleSampleRate = sample.metadata.sampleRate;
                                samplePosStep *= sampleSampleRate / representedFreq;

                                var leftSampleData = sample.data[0];
                                var rightSampleData = sample.data[1] || sample.data[0]; /* mix in mono if that's all we've got */
                                var sampleLength = sample.metadata.sampleLength;
                                var repStart = sample.metadata.repeatStart;
                                var repEnd = sample.metadata.repeatEnd;
                                var repLen = repEnd - repStart;
                                var stepFunc = STEP_FUNCS[sample.metadata.repeatType];
                                for (i = 0; i < numSamples && samplePos < sampleLength; i++) {
                                    output[0][i] += leftSampleData[Math.floor(samplePos)] * leftScale;
                                    output[1][i] += rightSampleData[Math.floor(samplePos)] * rightScale;
                                    samplePos = stepFunc(samplePos, samplePosStep, repEnd, repLen);
                                }
                            }
                            state.samplePosition = samplePos;
                        }
                        if (this.globalState.filters) {
                            var filters = this.globalState.filters;
                            for (i = 0; i < numSamples; i++) {
                                output[0][i] = filters[0].next(output[0][i]);
                                output[1][i] = filters[1].next(output[1][i]);
                            }
                        }
                        var mixResult = new MixResult(numSamples, output);
                        if (this.postMixCallback) {
                            window.setTimeout(function () {
                                self.postMixCallback.call(self.postMixObject, mixResult);
                            }, 0);
                        }
                        return mixResult;
                    }
                }]);

                return Mixer;
            })();

            _export('Mixer', Mixer);
        }
    };
});
System.register('lib/jssynth.js', ['lib/src/mixer.js', 'lib/src/sample.js', 'lib/src/instrument.js', 'lib/src/webaudiodriver.js'], function (_export) {
    var Mixer, Sample, Instrument, WebAudioDriver;
    return {
        setters: [function (_libSrcMixerJs) {
            Mixer = _libSrcMixerJs.Mixer;
        }, function (_libSrcSampleJs) {
            Sample = _libSrcSampleJs.Sample;
        }, function (_libSrcInstrumentJs) {
            Instrument = _libSrcInstrumentJs.Instrument;
        }, function (_libSrcWebaudiodriverJs) {
            WebAudioDriver = _libSrcWebaudiodriverJs.WebAudioDriver;
        }],
        execute: function () {
            'use strict';

            _export('Mixer', Mixer);

            _export('Sample', Sample);

            _export('Instrument', Instrument);

            _export('WebAudioDriver', WebAudioDriver);
        }
    };
});
//# sourceMappingURL=jssynth.js.map