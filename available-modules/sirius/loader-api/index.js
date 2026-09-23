/** @type {typeof import("../../../bootstrap/moduleIndex.js")} */
/// @ts-expect-error
const moduleIndex = module.require("../../../bootstrap/moduleIndex.js", []);

/**
 * toLoad: package path
 * toReplace: package path
 * toUnload: package id
 *
 * @import {ChangeRequest, Rejection, Accept} from "../../../bootstrap/moduleIndex.js"
 * @param {string} base
 * @param {boolean} apply
 * @param {Pick<ChangeRequest, "toLoad" | "toReplace" | "toUnload">} changes
 * @returns {Rejection | Accept}
 */
function propose(base, apply, { toLoad, toReplace, toUnload }) {
    return moduleIndex.getIndex(base).propose({
        toLoad,
        toReplace,
        toUnload,
        apply,
    });
}

module.exports = {
    propose,
};
