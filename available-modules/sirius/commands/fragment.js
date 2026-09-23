const { chunksToString } = require("./chunk.js");
/**
 * @import {Chunk, LiteralChunk, ArgumentChunk} from "./chunk.js"
 */

/**
 * @template {any[]} Args
 * @callback IntFunction
 * @param {...Args} args
 * @returns {number}
 */

/**
 * @typedef {{
 *   chunk: LiteralChunk,
 *   handler?: IntFunction<any>,
 *   children: Set<Fragment>
 * }} LiteralFragment
 * @typedef {{
 *   chunk: ArgumentChunk,
 *   handler?: IntFunction<any>,
 *   children: Set<Fragment>
 * }} ArgumentFragment
 * @typedef {{
 *   chunk: Chunk,
 *   handler?: IntFunction<any>,
 *   children: Set<Fragment>
 * }} Fragment
 */

/**
 * on collision, throws error
 *
 * @param {Fragment[]} fragments
 * @param {Chunk[]} path
 * @returns {Set<Fragment>}
 */
function mergeFragments(fragments, path) {
    /** @type {Map<Chunk["type"], Map<string, Fragment[]>>} */
    let fragmentMap = new Map();

    fragments.forEach((fragment) =>
        fragmentMap
            .getOrInsert(fragment.chunk.type, new Map())
            .getOrInsert(fragment.chunk.value, [])
            .push(fragment),
    );

    // at this point, guarantees if fragmentMap[type][value] exists, then it is nonempty

    const mergedFragmentMap = new Map(
        fragmentMap.entries().map(([type, typedFragmentMap]) => {
            const innerMap = new Map(
                typedFragmentMap.entries().map(([value, fragments]) => {
                    const currentPath = [...path, fragments[0].chunk];

                    if (fragments.filter((fragment) => fragment.handler).length > 1)
                        throw new Error(
                            `Multiple fragments provide handler function for /${chunksToString(currentPath)}`,
                        );

                    if (fragments[0].chunk.type === "argument") {
                        const expectedArgumentType = fragments[0].chunk.argumentTypeId;
                        fragments.forEach((fragment) => {
                            if (fragment.chunk.type !== "argument")
                                throw new Error(
                                    "should be unreachable because chunk type should be the same as the first",
                                );

                            if (fragment.chunk.argumentTypeId !== expectedArgumentType)
                                throw new Error(
                                    `Expected all fragments of ${chunksToString(currentPath)} to have type ${expectedArgumentType}, but one fragment uses ${fragment.chunk.argumentTypeId}`,
                                );
                        });
                    }

                    /** @type {Fragment} */
                    const mergedFragment = {
                        chunk: fragments[0].chunk,
                        handler: fragments.find((fragment) => fragment.handler)?.handler,
                        children: mergeFragments(
                            fragments.flatMap((fragment) => Array.from(fragment.children)),
                            currentPath,
                        ),
                    };

                    return [value, mergedFragment];
                }),
            );

            return [type, innerMap];
        }),
    );

    return new Set(mergedFragmentMap.values().flatMap((type) => Array.from(type.values())));
}

/**
 * @template {any[]} Args
 * @param {Chunk[]} chunks
 * @param {IntFunction<Args>} handler
 * @param {Fragment[]} [children=[]]
 * @returns {Fragment}
 */
function fragment(chunks, handler, children = []) {
    if (chunks.length === 0) throw new Error("fragment should supply at least 1 chunk, got 0");

    return {
        chunk: chunks[0],
        handler: chunks.length === 1 ? handler : undefined,
        children:
            chunks.length === 1
                ? new Set(children)
                : new Set([fragment(chunks.slice(1), handler, children)]),
    };
}

module.exports = { fragment, mergeFragments };
