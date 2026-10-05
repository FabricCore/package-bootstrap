const Files = Java.type("java.nio.file.Files");
const BasicFileAttributes = Java.type("java.nio.file.attribute.BasicFileAttributes");

const { getJavaPath } = require("./path.js");

/**
 * @param {string} path
 * @returns {string[]} - immediate name of the files + directories
 */
function listFiles(path) {
    const stream = Files.list(getJavaPath(path));
    try {
        const list = stream
            .map(
                /**
                 * @param {java.nio.file.Path} p
                 */
                (p) => p.getFileName().toString(),
            )
            .toList();
        return [...list];
    } finally {
        stream.close();
    }
}

/**
 * @param {string} path
 * @returns {"file" | "dir"}
 */
function fileType(path) {
    const attr = Files.readAttributes(getJavaPath(path), BasicFileAttributes.class);
    return attr.isDirectory() ? "dir" : "file";
}

/**
 * @param {string} path
 * @returns {boolean}
 */
function fileExists(path) {
    return Files.exists(getJavaPath(path));
}

module.exports = {
    listFiles,
    fileType,
    fileExists,
};
