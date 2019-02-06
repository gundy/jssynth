import {EffectMapEntry} from "../../Effect";
import {TEMPLATE_EFFECT} from './AbstractEffect';
import {MOD_ARPEGGIO} from './MOD_ARPEGGIO';
import {MOD_PORTA_UP} from './MOD_PORTA_UP';
import {MOD_PORTA_DOWN} from './MOD_PORTA_DOWN';
import {MOD_PORTA_TO_NOTE} from './MOD_PORTA_TO_NOTE';
import {MOD_VIBRATO} from './MOD_VIBRATO';
import {MOD_PORTA_PLUS_VOL_SLIDE} from './MOD_PORTA_PLUS_VOL_SLIDE';
import {MOD_VIBRATO_PLUS_VOL_SLIDE} from './MOD_VIBRATO_PLUS_VOL_SLIDE';
import {MOD_TREMOLO} from './MOD_TREMOLO';
import {MOD_PAN} from './MOD_PAN';
import {MOD_SAMPLE_OFFSET} from './MOD_SAMPLE_OFFSET';
import {MOD_VOLUME_SLIDE} from './MOD_VOLUME_SLIDE';
import {MOD_JUMP_TO_PATTERN} from './MOD_JUMP_TO_PATTERN';
import {MOD_SET_VOLUME} from './MOD_SET_VOLUME';
import {MOD_PATTERN_BREAK} from './MOD_PATTERN_BREAK';
import {MOD_PROTRACKER} from './MOD_PROTRACKER';
import {MOD_SET_SPEED} from './MOD_SET_SPEED';

export const MOD_EFFECT_MAP: {[key:number]:EffectMapEntry} = {
    0x00: { code: '0', effect: MOD_ARPEGGIO },
    0x01: { code: '1', effect: MOD_PORTA_UP },
    0x02: { code: '2', effect: MOD_PORTA_DOWN },
    0x03: { code: '3', effect: MOD_PORTA_TO_NOTE },
    0x04: { code: '4', effect: MOD_VIBRATO },
    0x05: { code: '5', effect: MOD_PORTA_PLUS_VOL_SLIDE },
    0x06: { code: '6', effect: MOD_VIBRATO_PLUS_VOL_SLIDE },
    0x07: { code: '7', effect: MOD_TREMOLO },
    0x08: { code: '8', effect: MOD_PAN },
    0x09: { code: '9', effect: MOD_SAMPLE_OFFSET },
    0x0a: { code: 'a', effect: MOD_VOLUME_SLIDE },
    0x0b: { code: 'b', effect: MOD_JUMP_TO_PATTERN },
    0x0c: { code: 'c', effect: MOD_SET_VOLUME },
    0x0d: { code: 'd', effect: MOD_PATTERN_BREAK },
    0x0e: { code: 'e', effect: MOD_PROTRACKER },
    0x0f: { code: 'f', effect: MOD_SET_SPEED },
    0x10: { code: 'g', effect: TEMPLATE_EFFECT },
    0x11: { code: 'h', effect: TEMPLATE_EFFECT },
    0x12: { code: 'i', effect: TEMPLATE_EFFECT },
    0x13: { code: 'j', effect: TEMPLATE_EFFECT },
    0x14: { code: 'k', effect: TEMPLATE_EFFECT },
    0x15: { code: 'l', effect: TEMPLATE_EFFECT },
    0x16: { code: 'm', effect: TEMPLATE_EFFECT },
    0x17: { code: 'n', effect: TEMPLATE_EFFECT },
    0x18: { code: 'o', effect: TEMPLATE_EFFECT },
    0x19: { code: 'p', effect: TEMPLATE_EFFECT },
    0x1a: { code: 'q', effect: TEMPLATE_EFFECT },
    0x1b: { code: 'r', effect: TEMPLATE_EFFECT },
    0x1c: { code: 's', effect: TEMPLATE_EFFECT },
    0x1d: { code: 't', effect: TEMPLATE_EFFECT },
    0x1e: { code: 'u', effect: TEMPLATE_EFFECT },
    0x1f: { code: 'v', effect: TEMPLATE_EFFECT },
    0x20: { code: 'w', effect: TEMPLATE_EFFECT },
    0x21: { code: 'x', effect: TEMPLATE_EFFECT },
    0x22: { code: 'y', effect: TEMPLATE_EFFECT },
    0x23: { code: 'z', effect: TEMPLATE_EFFECT }
};
