const FabricLoader = Java.type("net.fabricmc.loader.api.FabricLoader");
const Path = Java.type("java.nio.file.Path");

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

module.exports = {
    getJavaPath,
    pathJoin,
    pathNormalise,
};
