'use strict';

/**
 * Binary search
 * @param {Array} array the array to search in
 * @param {(item: any) => number} predicate
 *   return < 0 if the item should come before,
 *          0 if it's a match,
 *          > 0 if it should come after
 * @returns {number} index
 */
function binarySearch(array, predicate) {
    let low = 0;
    let high = array.length;

    // Base cases — allow entering a sorted collection in O(N)
    if (array.length === 0) return low;

    if (predicate(array[low]) < 0) return low - 1;
    if (predicate(array[low]) === 0) return low;

    const maxPred = predicate(array[high - 1]);
    if (maxPred > 0) return high;
    if (maxPred === 0) return high - 1;

    while (low !== high) {
        const mid  = low + Math.floor((high - low) / 2);
        const pred = predicate(array[mid]);

        if (pred < 0) high = mid;
        else if (pred > 0) low = mid + 1;
        else return mid;
    }
    return low;
}

module.exports = binarySearch;
module.exports.default = binarySearch;
