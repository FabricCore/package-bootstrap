/** @type {typeof import("../bootstrap/loader.js")} */
/// @ts-expect-error
const { createLoader } = module.import("../bootstrap/loader.js", []);

/**
 * @typedef {import("../bootstrap/moduleIndex.js")} ModuleIndex
 * @type {ModuleIndex?}
 */
let index = createLoader("client");
index.loadAll();

module.onunload = () => {
    index?.destroy();
};
