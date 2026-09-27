/**
 * @typedef {{
 *   unregister: () => void
 * }} RegisteredCommand
 */

/**
 * @import {
 *   ExecutionHandler,
 *   Fragment,
 *   MetaExecutes,
 *   MetaChild,
 *   LiteralFragment,
 *   Meta,
 * } from "./universal/fragment.js"
 * @import { Chunk } from "./universal/chunk.js"
 */

const { registerClientCommand } = require("./client/addRemove.js");
const tree = require("./universal/tree.js");
const { fragment } = require("./universal/fragment.js");
const { arg, literal } = require("./universal/chunk.js");
const { executes, child } = require("./universal/helpers.js");

/**
 * @template Source
 * @param {Chunk[]} chunks
 * @param {...Meta<Source>} additionalMetadata
 * @returns {RegisteredCommand}
 */
function register(chunks, ...additionalMetadata) {
    const createdFragment = fragment(chunks, additionalMetadata);
    if (createdFragment.chunk.type !== "literal")
        throw new Error();

    /** @type {any} */
    const createdLiteral = createdFragment;

    tree.register(createdLiteral);
    return registerClientCommand(createdLiteral, () => tree.unregister(createdLiteral.chunk.value));
}

console.log("got here!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

register(
    [literal("hello")],
    executes(() => { return 1; })
)

module.exports = {
    register,
    arg, literal,
    executes, child
};
