/** @type {typeof import("./moduleIndex.js")} */
/// @ts-expect-error
const ModuleIndex = module.import("./moduleIndex.js", []);

/** @type {typeof import("./files.js")} */
/// @ts-expect-error
const { pathJoin } = module.import("./files.js", []);

/** @type {typeof import("./prelude.js")} */
/// @ts-expect-error
const { require } = module.import("./prelude.js", []);

/** @type {Map<string, ModuleIndex>} */
let createdIndices = new Map();

/**
 * @param {any} e
 */
function printError(e) {
    if (typeof e === "object" && e !== null && "stack" in e) console.log(e.stack.toString());
    else console.log(e);
}

class CreatedLoader {
    /**
     * @param {ModuleIndex} index
     */
    constructor(index) {
        /** @type {ModuleIndex} */
        this.index = index;
    }

    /**
     * @returns {string}
     */
    base() {
        return this.index.base;
    }

    loadAll() {
        this.index.loadAll();
    }

    destroy() {
        if (!createdIndices.has(this.base()))
            throw new Error(`Cannot destroy loader base=${this.base()} because it does not exist`);

        createdIndices.get(this.base())?.destroy();
        createdIndices.delete(this.base());
    }
}

/**
 * @typedef {import("./moduleIndex.js")} ModuleIndex
 * @param {string} base
 * @returns {CreatedLoader}
 */
function createLoader(base) {
    const index = ModuleIndex.createIndex({
        base,
        load: (manifest, preludes) => {
            try {
                const mainPath = pathJoin(manifest.getRoot(base), manifest.main);
                /** @type {JscoreExports} */
                /// @ts-expect-error
                const exports = module.import(mainPath, [require, ...preludes]);
                return exports;
            } catch (e) {
                printError(e);
                // TODO: load errors
            }
        },
        unload: (manifest) => {
            try {
                const mainPath = pathJoin(manifest.getRoot(base), manifest.main);
                module.unimport(mainPath);
            } catch (e) {
                printError(e);
                // TODO: load errors
            }
        },
    });

    createdIndices.set(base, index);

    return new CreatedLoader(index);
}

module.onunload = () => {
    createdIndices.forEach((index) => index.destroy());
};

module.exports = { createLoader };
