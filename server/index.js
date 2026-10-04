/** @type {typeof import("../bootstrap/loader.js")} */
/// @ts-expect-error
const { createLoader } = module.import("../bootstrap/loader.js", []);

const loader = createLoader("server");
loader.loadAll();

module.onunload = () => loader.destroy();
