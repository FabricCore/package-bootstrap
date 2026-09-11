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
     * @param {Map<string, Manifest>} manifests
     * @returns {Dag}
     */
    static dagFromManifests(manifests) {
        let out = new Dag();

        manifests.keys().forEach((id) => out.addNode(id));
        manifests.values().forEach((manifest) =>
            manifest.dependencies.keys().forEach((dependency) => {
                if (!manifests.has(dependency))
                    throw new Error(`${manifest.id} requires ${dependency} but is not present`);

                out.addEdge(dependency, manifest.id);
            }),
        );

        return out;
    }

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
                const manifest = ModuleIndex.readManifest(pathJoin(base, author, packageName, "package.json"));

                if (manifest.author !== author)
                    throw new Error(
                        `Manifest author does not match path author - manifest=${manifest.author}, path=${author}`,
                    );
                if (manifest.name !== packageName)
                    throw new Error(
                        `Manifest package name does not match path package name - manifest=${manifest.name}, path=${packageName}`,
                    );

                this.manifests.set(manifest.id, manifest);
            }
        }

        this.dag = ModuleIndex.dagFromManifests(this.manifests);
    }

    /**
     * @param {string} packageRoot 
     * @returns {Manifest}
     */
    static readManifest(packageRoot) {
        const realPath = pathJoin(packageRoot, "package.json");
        if (!fileExists(realPath))
            throw new Error(
                `package.json not found in ${realPath}`,
            );

        // TODO: add debug logging so we know which package failed to be indexed
        const manifestContent = readFile(realPath);
        return new Manifest(JSON.parse(manifestContent));
    }

    /**
     * @typedef {{
     *   dependent: string,
     *   dependency: string,
     *   requiredVersion: SemverPattern,
     *   error: {kind: "missing"} | {kind: "versionMismatch", gotVersion: Semver }
     * }} DependencyViolation
     *
     * @param {Map<string, Manifest>} manifests
     * @returns {DependencyViolation[]}
     */
    static getDependencyViolations(manifests) {
        /** @type {DependencyViolation[]} */
        let violations = [];

        for (const manifest of manifests.values()) {
            for (const [depName, depVersionPattern] of manifest.dependencies.entries()) {
                const depManifest = manifests.get(depName);

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

    /**
     * @typedef {string} PackagePath
     * @typedef {string} PackageId
     * @typedef {{
     *   toLoad?: PackagePath[],
     *   toReplace?: PackagePath[],
     *   toUnload?: PackageId[],
     *   apply: boolean
     * }} ChangeRequest
     *
     * @param {ChangeRequest} changes
     *
     * the 3 sets should be disjoint, but are not
     * @typedef {{ type: "nondisjoint", ids: string[] }} NonDisjointRejection
     * @typedef {{ type: "un/reload notfound", ids: string[] }} UnloadReloadNotFoundRejection
     *
     * @typedef {NonDisjointRejection | UnloadReloadNotFoundRejection} RejectionReason
     * @typedef {{result: "rejected", reason: RejectionReason[]}} Rejection
     * @typedef {{result: "accepted"}} Accept
     *
     * @returns {Rejection | Accept}
     */
    propose({ toLoad, toReplace, toUnload }) {
        // =========== reading manifests ============
        const toLoadManifests = toLoad?.map(packageRoot => ({ packageRoot, manifest: ModuleIndex.readManifest(packageRoot) })) ?? [];
        const toReplaceManifests = toReplace?.map(packageRoot => ({ packageRoot, manifest: ModuleIndex.readManifest(packageRoot) })) ?? [];

        // ================= validate nondisjoint ======================
        const toLoadSet = new Set(toLoadManifests.map((manifest) => manifest.manifest.id));
        const toReplaceSet = new Set(toReplaceManifests.map((manifest) => manifest.manifest.id));
        const toUnloadSet = new Set(toUnload);

        const loadReplaceInter = toLoadSet.intersection(toReplaceSet);
        const unloadReplaceInter = toUnloadSet.intersection(toReplaceSet);
        const loadUnloadInter = toUnloadSet.intersection(toLoadSet);

        /** @type {RejectionReason[]} */
        let rejectReasons = [];

        /** @returns {Rejection} */
        function mkReject() {
            if (rejectReasons.length === 0) throw new Error("Cannot reject without a reason");

            return {
                result: "rejected",
                reason: rejectReasons,
            };
        }

        const intersection = loadReplaceInter.union(unloadReplaceInter).union(loadUnloadInter);
        if (intersection.size !== 0) {
            rejectReasons.push({ type: "nondisjoint", ids: Array.from(intersection).sort() });
            return mkReject();
        }

        // ====== validate unload and reloads are packages that are currently loaded ======
        const toUnloadNotFound = Array.from(toUnloadSet).filter((id) => !this.manifests.has(id));
        const toReplaceNotFound = Array.from(toReplaceSet).filter((id) => !this.manifests.has(id));

        if (toUnloadNotFound.length || toReplaceNotFound.length) {
            rejectReasons.push({
                type: "un/reload notfound",
                ids: toUnloadNotFound.concat(toReplaceNotFound).sort(),
            });
            return mkReject();
        }
    }
}

module.exports = ModuleIndex;
