/**
 * @import { LiteralFragment } from "./fragment.js"
 */
const { chunkToString } = require("./chunk.js");

/** @type {Map<string, LiteralFragment>} */
const instance = new Map();

/**
 * note: requires the first chunk of the fragment be a literal
 *
 * @param {LiteralFragment} fragment
 * @returns {void}
 */
function register(fragment) {
    if (fragment.chunk.type !== "literal")
        throw new Error(
            `Expected first chunk of the fragment be a literal, got ${chunkToString(fragment.chunk)}`,
        );

    if (instance.has(fragment.chunk.value))
        throw new Error(
            `Command ${fragment.chunk.value} is already registered using the JSC command registrar`,
        );

    instance.set(fragment.chunk.value, fragment);
}

/**
 * @param {string} commandId
 * @returns {void}
 */
function unregister(commandId) {
    if (!instance.has(commandId))
        throw new Error(
            `Command ${commandId} has not been registered with the JSC command registrar`,
        );

    instance.delete(commandId);
}

module.exports = { register, unregister };
