/** @type {typeof import("../../../bootstrap/moduleIndex.js")} */
/// @ts-expect-error
const moduleIndex = module.import("../../../bootstrap/moduleIndex.js", []);
const { base } = require("sirius/fs");

/**
 * toLoad: package path
 * toReplace: package path
 * toUnload: package id
 *
 * @import {ChangeRequest, Rejection, Accept} from "../../../bootstrap/moduleIndex.js"
 * @param {Pick<ChangeRequest, "toLoad" | "toReplace" | "toUnload" | "apply">} changes
 * @returns {Rejection | Accept}
 */
function propose({ toLoad, toReplace, toUnload, apply }) {
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
