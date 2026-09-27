/** @type {typeof import("./moduleIndex.js")} */
/// @ts-expect-error
const ModuleIndex = module.import("./moduleIndex.js", []);

const require = globalThis.module.createPrelude((targetGlobal, targetModule) => {
    targetGlobal.require = (/** @type {string} */ path) => {
        const base = targetModule.path.split("/")[1];
        const index = ModuleIndex.getIndex(base);

        const requestedPackageId = path;
        const requestedPackageManifest = index.manifests.get(requestedPackageId);
        if (requestedPackageManifest === undefined)
            throw new Error(`cannot find package ${requestedPackageId}`);

        const truePath = path.startsWith(".") ? path : requestedPackageManifest.getMain(base);
        return targetModule.import(truePath, [require]);
    };
});

module.exports = {
    require,
};
