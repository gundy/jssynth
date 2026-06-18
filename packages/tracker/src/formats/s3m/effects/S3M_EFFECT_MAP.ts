import {TEMPLATE_EFFECT} from '../../mod/effects/AbstractEffect';

import {MOD_ARPEGGIO} from '../../mod/effects/MOD_ARPEGGIO';
import {MOD_PORTA_TO_NOTE} from '../../mod/effects/MOD_PORTA_TO_NOTE';
import {MOD_VIBRATO} from '../../mod/effects/MOD_VIBRATO';
import {MOD_PORTA_PLUS_VOL_SLIDE} from '../../mod/effects/MOD_PORTA_PLUS_VOL_SLIDE';
import {MOD_VIBRATO_PLUS_VOL_SLIDE} from '../../mod/effects/MOD_VIBRATO_PLUS_VOL_SLIDE';
import {MOD_TREMOLO} from '../../mod/effects/MOD_TREMOLO';
import {MOD_SAMPLE_OFFSET} from '../../mod/effects/MOD_SAMPLE_OFFSET';
import {MOD_JUMP_TO_PATTERN} from '../../mod/effects/MOD_JUMP_TO_PATTERN';
import {MOD_PATTERN_BREAK} from '../../mod/effects/MOD_PATTERN_BREAK';
import {S3M_SET_SPEED} from './S3M_SET_SPEED';
import {S3M_SET_TEMPO} from './S3M_SET_TEMPO';
import {S3M_VOLUME_SLIDE} from './S3M_VOLUME_SLIDE';
import {S3M_PORTA_DOWN} from './S3M_PORTA_DOWN';
import {S3M_PORTA_UP} from './S3M_PORTA_UP';
import {S3M_TREMOR} from './S3M_TREMOR';
import {S3M_RETRIG_PLUS_VOLUME_SLIDE} from './S3M_RETRIG_PLUS_VOLUME_SLIDE';
import {S3M_EXTENDED} from './S3M_EXTENDED';
import {S3M_FINE_VIBRATO} from './S3M_FINE_VIBRATO';
import {S3M_SET_GLOBAL_VOLUME} from './S3M_SET_GLOBAL_VOLUME';
import {EffectMapEntry} from "../../Effect";

export const S3M_EFFECT_MAP: {[key:number]:EffectMapEntry} = {
    /* - */  0x00: { code: '-', effect: TEMPLATE_EFFECT },
    /* A */  0x01: { code: 'A', effect: S3M_SET_SPEED },
    /* B */  0x02: { code: 'B', effect: MOD_JUMP_TO_PATTERN },
    /* C */  0x03: { code: 'C', effect: MOD_PATTERN_BREAK },
    /* D */  0x04: { code: 'D', effect: S3M_VOLUME_SLIDE },  // ???
    /* E */  0x05: { code: 'E', effect: S3M_PORTA_DOWN },
    /* F */  0x06: { code: 'F', effect: S3M_PORTA_UP },
    /* G */  0x07: { code: 'G', effect: MOD_PORTA_TO_NOTE },
    /* H */  0x08: { code: 'H', effect: MOD_VIBRATO },
    /* I */  0x09: { code: 'I', effect: S3M_TREMOR },
    /* J */  0x0a: { code: 'J', effect: MOD_ARPEGGIO },
    /* K */  0x0b: { code: 'K', effect: MOD_VIBRATO_PLUS_VOL_SLIDE },
    /* L */  0x0c: { code: 'L', effect: MOD_PORTA_PLUS_VOL_SLIDE },
    /* M */  0x0d: { code: 'M', effect: TEMPLATE_EFFECT },
    /* N */  0x0e: { code: 'N', effect: TEMPLATE_EFFECT },
    /* O */  0x0f: { code: 'O', effect: MOD_SAMPLE_OFFSET },
    /* P */  0x10: { code: 'P', effect: TEMPLATE_EFFECT },
    /* Q */  0x11: { code: 'Q', effect: S3M_RETRIG_PLUS_VOLUME_SLIDE },
    /* R */  0x12: { code: 'R', effect: MOD_TREMOLO },
    /* S */  0x13: { code: 'S', effect: S3M_EXTENDED },
    /* T */  0x14: { code: 'T', effect: S3M_SET_TEMPO },
    /* U */  0x15: { code: 'U', effect: S3M_FINE_VIBRATO },
    /* V */  0x16: { code: 'V', effect: S3M_SET_GLOBAL_VOLUME }
};

