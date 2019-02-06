
export class Utils {
    constructor() {}

    /**
     * Perform a shallow clone of a JS object
     * @param obj
     * @returns {{}}
     */
    static clone<T>(obj: T): T {
        let newObj:any = {};

        for(let key in obj) {
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
    static merge<T>(existingObj: T, toMerge: any) {
        let newObj = Utils.clone(existingObj);

        if (toMerge !== undefined && toMerge !== null) {
            for(let key in toMerge) {
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
        let arr = [], i = length;
        while (i--) {
            arr[i] = value;
        }
        return arr;
    }
}
