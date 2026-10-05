const Files = Java.type("java.nio.file.Files");

const { getJavaPath } = require("./path.js");

/**
 * @param {string} path
 * @returns {string}
 */
function readFile(path) {
    return Files.readString(getJavaPath(path));
}

module.exports = {
    readFile,
};
