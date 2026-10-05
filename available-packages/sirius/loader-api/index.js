/** @type {typeof import("../../../bootstrap/moduleIndex.js")} */
/// @ts-expect-error
const moduleIndex = module.import("../../../bootstrap/moduleIndex.js", []);
const { base, listFiles, fileType, fileExists } = require("sirius/fs");

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

/**
 * @returns {string[]}
 */
function loadedPackages() {
    return moduleIndex.getIndex(base).manifests.keys().toArray();
}

function availablePackages() {
    return listFiles("/available-packages")
        .flatMap((author) => {
            if (fileType(`/available-packages/${author}`) === "file") return null;

            return listFiles(`/available-packages/${author}`).map((packageName) =>
                fileExists(`/available-packages/${author}/${packageName}`)
                    ? `${author}/${packageName}`
                    : null,
            );
        })
        .filter((id) => id !== null);
}

module.exports = {
    propose,
    loadedPackages,
    availablePackages,
};
