import {TEMPLATE_EFFECT} from '../../mod/effects/AbstractEffect';

import {MOD_ARPEGGIO} from '../../mod/effects/MOD_ARPEGGIO';
import {MOD_PORTA_UP} from '../../mod/effects/MOD_PORTA_UP';
import {MOD_PORTA_DOWN} from '../../mod/effects/MOD_PORTA_DOWN';
import {MOD_PORTA_TO_NOTE} from '../../mod/effects/MOD_PORTA_TO_NOTE';
import {MOD_VIBRATO} from '../../mod/effects/MOD_VIBRATO';
import {MOD_PAN} from '../../mod/effects/MOD_PAN';
import {MOD_PORTA_PLUS_VOL_SLIDE} from '../../mod/effects/MOD_PORTA_PLUS_VOL_SLIDE';
import {MOD_VIBRATO_PLUS_VOL_SLIDE} from '../../mod/effects/MOD_VIBRATO_PLUS_VOL_SLIDE';
import {MOD_TREMOLO} from '../../mod/effects/MOD_TREMOLO';
import {MOD_VOLUME_SLIDE} from '../../mod/effects/MOD_VOLUME_SLIDE';
import {MOD_PROTRACKER} from '../../mod/effects/MOD_PROTRACKER';
import {MOD_SET_VOLUME} from '../../mod/effects/MOD_SET_VOLUME';
import {MOD_SET_SPEED} from '../../mod/effects/MOD_SET_SPEED';
import {MOD_SAMPLE_OFFSET} from '../../mod/effects/MOD_SAMPLE_OFFSET';
import {MOD_JUMP_TO_PATTERN} from '../../mod/effects/MOD_JUMP_TO_PATTERN';
import {MOD_PATTERN_BREAK} from '../../mod/effects/MOD_PATTERN_BREAK';
/*
import {S3M_SET_SPEED} from '../../s3m/effects/S3M_SET_SPEED';
import {S3M_SET_TEMPO} from '../../s3m/effects/S3M_SET_TEMPO';
import {S3M_VOLUME_SLIDE} from '../../s3m/effects/S3M_VOLUME_SLIDE';
import {S3M_PORTA_DOWN} from '../../s3m/effects/S3M_PORTA_DOWN';
import {S3M_PORTA_UP} from '../../s3m/effects/S3M_PORTA_UP';
*/
import {S3M_TREMOR} from '../../s3m/effects/S3M_TREMOR';
import {S3M_RETRIG_PLUS_VOLUME_SLIDE} from '../../s3m/effects/S3M_RETRIG_PLUS_VOLUME_SLIDE';
/*
import {S3M_EXTENDED} from '../../s3m/effects/S3M_EXTENDED';
import {S3M_FINE_VIBRATO} from '../../s3m/effects/S3M_FINE_VIBRATO';
*/
import {S3M_SET_GLOBAL_VOLUME} from '../../s3m/effects/S3M_SET_GLOBAL_VOLUME';
import {XM_GLOBAL_VOLUME_SLIDE} from './XM_GLOBAL_VOLUME_SLIDE';

import {MOD_PT_SET_FILTER} from '../../mod/effects/MOD_PT_SET_FILTER';
import {MOD_PT_FINE_PORTA_UP} from '../../mod/effects/MOD_PT_FINE_PORTA_UP';
import {MOD_PT_FINE_PORTA_DOWN} from '../../mod/effects/MOD_PT_FINE_PORTA_DOWN';
import {MOD_PT_GLISSANDO_CONTROL} from '../../mod/effects/MOD_PT_GLISSANDO_CONTROL';
import {MOD_PT_SET_VIBRATO_WAVEFORM} from '../../mod/effects/MOD_PT_SET_VIBRATO_WAVEFORM';
import {MOD_PT_SET_FINETUNE} from '../../mod/effects/MOD_PT_SET_FINETUNE';
import {MOD_PT_PATTERN_LOOP} from '../../mod/effects/MOD_PT_PATTERN_LOOP';
import {MOD_PT_SET_TREMOLO_WAVEFORM} from '../../mod/effects/MOD_PT_SET_TREMOLO_WAVEFORM';
import {MOD_PT_16_POS_PAN} from '../../mod/effects/MOD_PT_16_POS_PAN';
import {MOD_PT_RETRIG_NOTE} from '../../mod/effects/MOD_PT_RETRIG_NOTE';
import {MOD_PT_FINE_VOLSLIDE_UP} from '../../mod/effects/MOD_PT_FINE_VOLSLIDE_UP';
import {MOD_PT_FINE_VOLSLIDE_DOWN} from '../../mod/effects/MOD_PT_FINE_VOLSLIDE_DOWN';
import {MOD_PT_CUT_NOTE} from '../../mod/effects/MOD_PT_CUT_NOTE';
import {MOD_PT_DELAY_NOTE} from '../../mod/effects/MOD_PT_DELAY_NOTE';
import {MOD_PT_DELAY_PATTERN} from '../../mod/effects/MOD_PT_DELAY_PATTERN';
import {MOD_PT_INVERT_LOOP} from '../../mod/effects/MOD_PT_INVERT_LOOP';

export const XM_EFFECT_MAP = {
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
    /*
     G      Set global volume
     H  (*) Global volume slide
     K      Key off
     L      Set envelope position
     P  (*) Panning slide
     R  (*) Multi retrig note
     T      Tremor
     X1 (*) Extra fine porta up
     X2 (*) Extra fine porta down

     */

    0x10: { code: 'G', effect: S3M_SET_GLOBAL_VOLUME },
    0x11: { code: 'H', effect: XM_GLOBAL_VOLUME_SLIDE },  // TODO GLOBAL VOLUME SLIDE
    0x12: { code: 'I', effect: TEMPLATE_EFFECT },  // NOTHING
    0x13: { code: 'J', effect: TEMPLATE_EFFECT },  // NOTHING
    0x14: { code: 'K', effect: TEMPLATE_EFFECT },  // TODO KEY OFF
    0x15: { code: 'L', effect: TEMPLATE_EFFECT },  // TODO SET ENVELOPE POSITION
    0x16: { code: 'M', effect: TEMPLATE_EFFECT },  // NOTHING
    0x17: { code: 'N', effect: TEMPLATE_EFFECT },  // NOTHING
    0x18: { code: 'O', effect: TEMPLATE_EFFECT },  // NOTHING
    0x19: { code: 'P', effect: TEMPLATE_EFFECT },  // TODO PANNING SLIDE
    0x1a: { code: 'R', effect: S3M_RETRIG_PLUS_VOLUME_SLIDE },
    0x1b: { code: 'S', effect: TEMPLATE_EFFECT },  // NOTHING
    0x1c: { code: 'T', effect: S3M_TREMOR },
    0x1d: { code: 'U', effect: TEMPLATE_EFFECT },  // NOTHING
    0x1e: { code: 'V', effect: TEMPLATE_EFFECT },  // NOTHING
    0x1f: { code: 'W', effect: TEMPLATE_EFFECT },  // NOTHING
    0x20: { code: 'X', effect: TEMPLATE_EFFECT },  // NOTHING

    /* protracker commands */
    0xe0: MOD_PT_SET_FILTER,
    0xe1: MOD_PT_FINE_PORTA_UP,
    0xe2: MOD_PT_FINE_PORTA_DOWN,
    0xe3: MOD_PT_GLISSANDO_CONTROL,
    0xe4: MOD_PT_SET_VIBRATO_WAVEFORM,
    0xe5: MOD_PT_SET_FINETUNE,
    0xe6: MOD_PT_PATTERN_LOOP,
    0xe7: MOD_PT_SET_TREMOLO_WAVEFORM,
    0xe8: MOD_PT_16_POS_PAN,
    0xe9: MOD_PT_RETRIG_NOTE,
    0xea: MOD_PT_FINE_VOLSLIDE_UP,
    0xeb: MOD_PT_FINE_VOLSLIDE_DOWN,
    0xec: MOD_PT_CUT_NOTE,
    0xed: MOD_PT_DELAY_NOTE,
    0xee: MOD_PT_DELAY_PATTERN,
    0xef: MOD_PT_INVERT_LOOP
};
