/** @type {typeof import("./manifest.js")} */

/// @ts-expect-error
const Manifest = module.import("./manifest.js", []);
/** @type {typeof import("./files.js")} */
/// @ts-expect-error
const { readFile, listFiles, fileType, fileExists, pathJoin } = module.import("./files.js", []);
/** @type {typeof import("./dag.js")} */
/// @ts-expect-error
const Dag = module.import("./dag.js", []);

/**
 * @typedef {import("./dag.js")} Dag
 * @typedef {import("./manifest.js")} Manifest
 */

/** @type {Map<string, ModuleIndex>} */
const instances = new Map();

class ModuleIndex {
    /** @type {Dag} */
    dag = new Dag();
    /** @type {Map<string, Manifest>} */
    manifests = new Map();

    /**
     * @param {string} base
     */
    constructor(base) {
        if (!fileExists(base)) throw new Error(`Could not find base path "${base}"`);
        this.base = base;

        const authors = listFiles(base).filter(
            (author) => fileType(pathJoin(base, author)) === "dir",
        );

        for (const author of authors) {
            const packages = listFiles(pathJoin(base, author)).filter(
                (packageName) => fileType(pathJoin(base, author, packageName)) === "dir",
            );

            for (const packageName of packages) {
                if (!fileExists(pathJoin(base, author, packageName, "package.json")))
                    throw new Error(
                        `package.json not found for package ${base}/${author}/${packageName}`,
                    );

                // TODO: add debug logging so we know which package failed to be indexed
                const manifestContent = readFile(
                    pathJoin(base, author, packageName, "package.json"),
                );
                const manifest = new Manifest(JSON.parse(manifestContent));

                if (manifest.author !== author)
                    throw new Error(
                        `Manifest author does not match path author - manifest=${manifest.author}, path=${author}`,
                    );
                if (manifest.name !== packageName)
                    throw new Error(
                        `Manifest package name does not match path package name - manifest=${manifest.name}, path=${packageName}`,
                    );

                this.manifests.set(manifest.id, manifest);
                this.dag.addNode(manifest.id);
            }
        }

        for (const manifest of this.manifests.values()) {
            for (const dependency of Object.keys(manifest.dependencies)) {
                if (!this.manifests.has(dependency))
                    throw new Error(`${manifest.id} requires ${dependency} but is not present`);

                this.dag.addEdge(dependency, manifest.id);
            }
        }
    }
}

/**
 * @param {string} base
 * @returns {ModuleIndex}
 */
function getModuleIndex(base) {
    const foundInstance = instances.get(base);

    if (foundInstance !== undefined) return foundInstance;

    const newInstance = new ModuleIndex(base);
    instances.set(base, newInstance);
    return newInstance;
}

module.exports = { getModuleIndex };
