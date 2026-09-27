/**
 * @import {
 *   ExecutionHandler,
 *   MetaExecutes,
 *   MetaChild,
 *   Meta,
 * } from "./fragment.js"
 * @import { Chunk } from "./chunk.js"
 */

const { fragment } = require("./fragment.js");

/**
 * @template Source
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
 * @template Source
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

module.exports = { child, executes };
