"format es6";

export class Utils {
    constructor() {}

    /**
     * Perform a shallow clone of a JS object
     * @param obj
     * @returns {{}}
     */
    static clone(obj) {
        var newObj = {};

        for(var key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }

    /**
     * Take a clone of existingObj and merge new properties into the clone
     * @param existingObj
     * @param toMerge
     * @returns {{}}
     */
    static merge(existingObj, toMerge) {
        var newObj = Utils.clone(existingObj);

        if (toMerge !== undefined && toMerge !== null) {
            for(var key in toMerge) {
                if (toMerge.hasOwnProperty(key)) {
                    newObj[key] = toMerge[key];
                }
            }
        }
        return newObj;
    }

    /**
     * Make an array consisting of length copies of value
     * @param value
     * @param length
     * @returns {Array}
     */
    static makeArrayOf(value, length) {
        var arr = [], i = length;
        while (i--) {
            arr[i] = value;
        }
        return arr;
    }
}
