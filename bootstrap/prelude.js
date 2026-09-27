/** @type {typeof import("./files.js")} */
/// @ts-expect-error
const { pathJoin } = module.import("./files.js", []);
const require = globalThis.module.createPrelude((targetGlobal, targetModule) => {
    targetGlobal.require = (/** @type {string} */ path) => {
        const truePath = path.startsWith(".") ? path : pathJoin("/", targetModule.path.split("/")[1], path);
        targetModule.import(truePath, [require])
    };
});

module.exports = {
    require,
};
