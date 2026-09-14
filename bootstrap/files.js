const Files = Java.type("java.nio.file.Files");
const FabricLoader = Java.type("net.fabricmc.loader.api.FabricLoader");
const BasicFileAttributes = Java.type("java.nio.file.attribute.BasicFileAttributes");
const Path = Java.type("java.nio.file.Path");
const FileUtils = Java.type("org.apache.commons.io.FileUtils");

/**
 * @param {string} path
 * @returns {java.nio.file.Path}
 */
function getJavaPath(path) {
    const p = Path.of("/").resolve(path).normalize();
    return FabricLoader.getInstance()
        .getConfigDir()
        .resolve("jscore")
        .resolve(Path.of("/").relativize(p));
}

/**
 * @param {string} path
 * @returns {string}
 */
function readFile(path) {
    return Files.readString(getJavaPath(path));
}

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

/**
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
function pathBinaryJoin(a, b) {
    if (a === "") return b;
    if (b === "") return a;
    if (b.startsWith("/")) return b;
    if (a.endsWith("/")) return `${a.slice(0, -1)}/${b}`;

    return `${a}/${b}`;
}

/**
 * @param {...string} paths
 * @returns {string}
 */
function pathJoin(...paths) {
    return paths.reduce(pathBinaryJoin, "");
}

/**
 * @param {string} path
 * @returns {string}
 */
function pathNormalise(path) {
    const isAbsolute = path.startsWith("/");
    if (isAbsolute) path = path.slice(1);

    // normalisedChunks.last is "..", then all items are ".."
    /** @type {string[]} */
    let normalisedChunks = [];

    for (const chunk of path.split("/")) {
        if (chunk === ".") continue;

        if (normalisedChunks.length === 0) {
            normalisedChunks.push(chunk);
            continue;
        }

        if (chunk === "..") {
            if (normalisedChunks[normalisedChunks.length - 1] === "..") normalisedChunks.push("..");
            else normalisedChunks.pop();
        } else {
            normalisedChunks.push(chunk);
        }
    }

    if (!isAbsolute) return normalisedChunks.join("/");

    return `/${normalisedChunks.filter((chunk) => chunk !== "..").join("/")}`;
}

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
    readFile,
    listFiles,
    fileType,
    fileExists,
    pathJoin,
    pathNormalise,
    copyDirectory,
    rm,
};
