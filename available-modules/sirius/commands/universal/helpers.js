/**
 * @import {
 *   ExecutionHandler,
 *   MetaExecutes,
 *   MetaChild,
 *   MetaRequires,
 *   Meta,
 *   CommandSource,
 * } from "./fragment.js"
 * @import { Chunk } from "./chunk.js"
 */

const { fragment } = require("./fragment.js");

/**
 * @template {CommandSource} Source
 * @param {ExecutionHandler<Source>} handler
 * @return {MetaExecutes<Source>}
 */
function executes(handler) {
    return {
        type: "executes",
        value: handler,
    };
}

/**
 * @template {CommandSource} Source
 * @param {(source: Source) => boolean} handler
 * @return {MetaRequires<Source>}
 */
function requires(handler) {
    return {
        type: "requires",
        value: handler,
    };
}

/**
 * @template {CommandSource} Source
 * @param {(Chunk | string)[] | Chunk | string} chunks
 * @param {...Meta<Source>} additionalMetadata
 * @return {MetaChild<Source>}
 */
function child(chunks, ...additionalMetadata) {
    return {
        type: "child",
        value: fragment(chunks, additionalMetadata),
    };
}

module.exports = { child, executes, requires };
