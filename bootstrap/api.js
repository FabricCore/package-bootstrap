/** @type {typeof import("./moduleIndex.js")} */
/// @ts-expect-error
const ModuleIndex = module.import("./moduleIndex.js", []);

/**
 * Propose changes, returns Accept if proposal is valid
 *
 * Set apply=true to apply the changes
 *
 * @import { ChangeRequest, Rejection, Accept } from "./moduleIndex";
 * @param {string} base
 * @param {ChangeRequest} changes
 * @returns {Rejection | Accept}
 */
function propose(base, changes) {
    return ModuleIndex.getIndex(base).propose(changes);
}

/**
 * Reload all user modules
 *
 * @param {string} base
 * @returns {void}
 */
function reload(base) {
    return ModuleIndex.getIndex(base).reload();
}

module.exports = {
    propose,
    reload,
};
