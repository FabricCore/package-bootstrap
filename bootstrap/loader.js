/** @type {typeof import("./moduleIndex.js")} */
/// @ts-expect-error
const ModuleIndex = module.import("./moduleIndex.js", []);

/** @type {typeof import("./files.js")} */
/// @ts-expect-error
const { pathJoin } = module.import("./files.js", []);

/** @type {typeof import("./prelude.js")} */
/// @ts-expect-error
const { require } = module.import("./prelude.js", []);

/**
 * @typedef {import("./moduleIndex.js")} ModuleIndex
 * @param {string} base
 * @returns {ModuleIndex}
 */
function createLoader(base) {
    return ModuleIndex.createIndex({
        base,
        load: (manifest) => {
            try {
                const mainPath = pathJoin("/", base, manifest.author, manifest.name, manifest.main);
                /// @ts-expect-error
                module.import(mainPath, [require]);
            } catch (e) {
                console.log(e);
                // TODO: load errors
            }
        },
        unload: (manifest) => {
            try {
                const mainPath = pathJoin("/", base, manifest.author, manifest.name, manifest.main);
                /// @ts-expect-error
                module.unimport(mainPath);
            } catch (e) {
                console.log(e);
                // TODO: load errors
            }
        },
    });
}

module.exports = { createLoader };
