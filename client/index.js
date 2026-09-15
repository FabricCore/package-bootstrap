/** @type {typeof import("../bootstrap/loader.js")} */
/// @ts-expect-error
const { createLoader, destroyLoader } = module.import("../bootstrap/loader.js", []);

createLoader("client").loadAll();

module.onunload = () => destroyLoader("client");
