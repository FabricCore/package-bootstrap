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
 * @typedef {import("./semver.js").SemverPattern} SemverPattern
 * @typedef {import("./semver.js").Semver} Semver
 */

/** @type {Map<string, ModuleIndex>} */
const instances = new Map();

class ModuleIndex {
    /** @type {Dag} */
    dag = new Dag();
    /** @type {Map<string, Manifest>} */
    manifests = new Map();

    /**
     * @typedef {{
     *   base: string,
     *   load: (manifest: Manifest) => void,
     *   unload: (manifest: Manifest) => void
     * }} IndexProps
     *
     * @param {IndexProps} props
     */
    constructor({ base, load, unload }) {
        if (!fileExists(base)) throw new Error(`Could not find base path "${base}"`);
        /** @type {string} */
        this.base = base;
        /** @type {(manifest: Manifest) => void} */
        this.load = load;
        /** @type {(manifest: Manifest) => void} */
        this.unload = unload;

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

    /**
     * @typedef {{
     *   dependent: string,
     *   dependency: string,
     *   requiredVersion: SemverPattern,
     *   error: {kind: "missing"} | {kind: "versionMismatch", gotVersion: Semver }
     * }} DependencyViolation
     *
     * @returns {DependencyViolation[]}
     */
    getDependencyViolations() {
        /** @type {DependencyViolation[]} */
        let violations = [];

        for (const manifest of this.manifests.values()) {
            for (const [depName, depVersionPattern] of manifest.dependencies.entries()) {
                const depManifest = this.manifests.get(depName);

                if (depManifest === undefined)
                    violations.push({
                        dependent: manifest.name,
                        dependency: depName,
                        requiredVersion: depVersionPattern,
                        error: { kind: "missing" },
                    });
                else if (!depVersionPattern.isMatch(depManifest.version))
                    violations.push({
                        dependent: manifest.name,
                        dependency: depName,
                        requiredVersion: depVersionPattern,
                        error: { kind: "versionMismatch", gotVersion: depManifest.version },
                    });
            }
        }

        return violations;
    }

    /**
     * @param {string} base
     * @returns {ModuleIndex}
     */
    static getIndex(base) {
        const foundInstance = instances.get(base);

        if (foundInstance !== undefined) return foundInstance;

        throw new Error(`Module index base=${base} does not exist, maybe create it first?`);
    }

    /**
     * @param {IndexProps} props
     * @returns {ModuleIndex}
     */
    static createIndex(props) {
        const foundInstance = instances.get(props.base);

        if (foundInstance !== undefined)
            throw new Error(`Creating module index base=${props.base} but it already exists`);

        const newInstance = new ModuleIndex(props);
        instances.set(props.base, newInstance);
        return newInstance;
    }

    destroy() {
        for (const packageId of this.dag.toposort().reverse()) {
            const packageManifest = this.manifests.get(packageId);
            if (packageManifest === undefined)
                throw new Error(`${packageId} is in DAG but not in manifest index`);
            this.unload(packageManifest);
        }
        instances.delete(this.base);
    }

    loadAll() {
        for (const packageId of this.dag.toposort()) {
            const packageManifest = this.manifests.get(packageId);
            if (packageManifest === undefined)
                throw new Error(`${packageId} is in DAG but not in manifest index`);
            this.load(packageManifest);
        }
    }
}

module.exports = ModuleIndex;
