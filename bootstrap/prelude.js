/** @type {typeof import("./moduleIndex.js")} */
/// @ts-expect-error
const ModuleIndex = module.import("./moduleIndex.js", []);
/** @type {typeof import("./files.js")} */
/// @ts-expect-error
const { pathJoin } = module.import("./files.js", []);

const require = globalThis.module.createPrelude((targetGlobal, targetModule) => {
    const base = targetModule.path.split("/")[1];
    const index = ModuleIndex.getIndex(base);

    const requesterPackageId = targetModule.path.split("/").slice(2, 4).join("/");
    const requesterPackageManifest = index.manifests.get(requesterPackageId) ?? null;
    if (requesterPackageManifest === null)
        throw new Error(`cannot find self ${requesterPackageId}`);

    targetGlobal.require = (/** @type {string} */ path) => {
        if (path.startsWith(".")) return targetModule.import(path, [require]);

        const pathChunks = path.split("/");
        const requestedPackageId = pathChunks.slice(0, 2).join("/");

        if (!requesterPackageManifest.dependencies.has(requestedPackageId))
            throw new Error(
                `${requestedPackageId} is not a dependency of ${requesterPackageId} so cannot be imported`,
            );

        const requestedPackageManifest = index.manifests.get(requestedPackageId) ?? null;
        if (requestedPackageManifest === null)
            throw new Error(`cannot find package ${requestedPackageId}`);

        const truePath =
            pathChunks.length === 2
                ? requestedPackageManifest.getMain(base)
                : pathJoin(requestedPackageManifest.getRoot(base), ...pathChunks.slice(2));
        return targetModule.import(truePath, [require]);
    };
});

module.exports = {
    require,
};
