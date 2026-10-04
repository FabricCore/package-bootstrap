/**
 * @typedef {{
 *   unregister: () => void
 * }} RegisteredCommand
 */

/**
 * @import { Meta, CommandSource } from "./universal/fragment.js"
 * @import { Chunk } from "./universal/chunk.js"
 * @import { LiteralFragment } from "./universal/fragment.js";
 */

/**
 * @type {(fragment: LiteralFragment<any>, onunregister: () => void) => RegisteredCommand}
 */
let registerCommand;
let environment = /** @type {any} */ (module).path.split("/")[1];

switch (environment) {
    case "client":
        registerCommand = require("./client/addRemove.js").registerClientCommand;
        break;
    case "server":
        registerCommand = require("./server/addRemove.js").registerServerCommand;
        break;
    default:
        throw new Error(`Unknown execution environment ${environment} (calculated from path)`);
}

const tree = require("./universal/tree.js");
const { fragment } = require("./universal/fragment.js");
const { arg, literal } = require("./universal/chunk.js");
const { executes, child, requires } = require("./universal/helpers.js");

/**
 * @template {CommandSource} Source
 * @param {(Chunk | string)[] | Chunk | string} chunks
 * @param {...Meta<Source>} additionalMetadata
 * @returns {RegisteredCommand}
 */
function newCommand(chunks, ...additionalMetadata) {
    const createdFragment = fragment(chunks, additionalMetadata);
    if (createdFragment.chunk.type !== "literal") throw new Error();

    /** @type {any} */
    const createdLiteral = createdFragment;

    tree.register(createdLiteral);
    return registerCommand(createdLiteral, () => tree.unregister(createdLiteral.chunk.value));
}

module.exports = {
    newCommand,
    arg,
    literal,
    executes,
    requires,
    child,
};
