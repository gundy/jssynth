export const S3M_RETRIG_TABLE = [
    function(vol) { return vol; },
    function(vol) { return vol-1; },
    function(vol) { return vol-2; },
    function(vol) { return vol-4; },
    function(vol) { return vol-8; },
    function(vol) { return vol-16; },
    function(vol) { return vol*2/3; },
    function(vol) { return vol/2; },
    function(vol) { return vol; },
    function(vol) { return vol+1; },
    function(vol) { return vol+2; },
    function(vol) { return vol+4; },
    function(vol) { return vol+8; },
    function(vol) { return vol+16; },
    function(vol) { return vol*3/2; },
    function(vol) { return vol*2; }
];
