const FileUtils = Java.type("org.apache.commons.io.FileUtils");

const { getJavaPath } = require("./path.js");
const { fileExists } = require("./stat.js");

/**
 * NOOP if from and to are the same
 * @param {string} from
 * @param {string} to
 * @param {{overwrite?: boolean}} [options={}]
 * @returns {void}
 */
function copyDirectory(from, to, options = {}) {
    const fromPath = getJavaPath(from).toFile();
    const toPath = getJavaPath(to).toFile();

    if (fromPath.getCanonicalPath() === toPath.getCanonicalPath()) return;

    if (fileExists(to)) {
        if (options.overwrite ?? false) rm(to);
        else throw new Error(`copying from ${from} to ${to} but the target directory exists`);
    }

    FileUtils.copyDirectory(fromPath, toPath);
}

/**
 * @param {string} path
 * @returns {void}
 */
function rm(path) {
    FileUtils.deleteQuietly(getJavaPath(path).toFile());
}

module.exports = {
    copyDirectory,
    rm,
};
