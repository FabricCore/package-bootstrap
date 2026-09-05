/**
 * @typedef {{
 *   author: string,
 *   name: string,
 *   version: string,
 *   description: string,
 *   keywords: string,
 *   license: string,
 *   executable: boolean,
 *   main: string,
 *   dependencies: Record<string, string>
 * }} Props
 */
class Manifest {
    /**
     * @param {Props} props
     */
    constructor(props) {
        if (typeof props.author !== "string")
            throw new Error(
                `Expected manifest field "author" to be a string, got ${typeof props.author}`,
            );
        /** @type {string} */
        this.author = props.author;

        if (typeof props.name !== "string")
            throw new Error(
                `Expected manifest field "name" to be a string, got ${typeof props.name}`,
            );
        /** @type {string} */
        this.name = props.name;

        if (typeof props.version !== "string")
            throw new Error(
                `Expected manifest field "version" to be a string, got ${typeof props.version}`,
            );
        /** @type {string} */
        this.version = props.version;

        if (typeof props.description !== "string")
            throw new Error(
                `Expected manifest field "description" to be a string, got ${typeof props.description}`,
            );
        /** @type {string} */
        this.description = props.description;

        if (typeof props.keywords !== "string")
            throw new Error(
                `Expected manifest field "keywords" to be a string, got ${typeof props.keywords}`,
            );
        /** @type {string} */
        this.keywords = props.keywords;

        if (typeof props.license !== "string")
            throw new Error(
                `Expected manifest field "license" to be a string, got ${typeof props.license}`,
            );
        /** @type {string} */
        this.license = props.license;

        if (typeof props.executable !== "boolean")
            throw new Error(
                `Expected manifest field "executable" to be a boolean, got ${typeof props.executable}`,
            );
        /** @type {boolean} */
        this.executable = props.executable;

        if (typeof props.main !== "string")
            throw new Error(
                `Expected manifest field "main" to be a string, got ${typeof props.main}`,
            );
        /** @type {string} */
        this.main = props.main;

        if (typeof props.dependencies !== "object")
            throw new Error(
                `Expected manifest field "dependencies" to be a object, got ${typeof props.dependencies}`,
            );
        /** @type {Record<string, string>} */
        this.dependencies = props.dependencies;
    }

    /** @returns {string} */
    get id() {
        return `${this.author}/${this.name}`;
    }
}

module.exports = Manifest;
