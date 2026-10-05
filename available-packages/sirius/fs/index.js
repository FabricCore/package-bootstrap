/** @type {"client" | "server"} */
const base = /** @type {any} */ (module).path.split("/")[1];

if (base !== "client" && base !== "server") throw new Error(`Unknown execution base ${base}`);

const { getJavaPath, pathJoin, pathNormalise } = require("./path.js");
const { listFiles, fileType, fileExists } = require("./stat.js");
const { readFile } = require("./read.js");
const { copyDirectory, rm } = require("./ops.js");

module.exports = {
    base,
    readFile,
    listFiles,
    fileType,
    fileExists,
    getJavaPath,
    pathJoin,
    pathNormalise,
    copyDirectory,
    rm,
};
