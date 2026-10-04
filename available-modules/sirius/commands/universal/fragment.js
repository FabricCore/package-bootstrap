const { chunksToString, literal } = require("./chunk.js");
/**
 * @import {Chunk, LiteralChunk, ArgumentChunk} from "./chunk.js"
 */

/**
 * @template S
 * @typedef {import("/types/full/com/mojang/brigadier/context/CommandContext").CommandContext<S>} Context
 */

/**
 */

/**
 * @template Source
 * @callback ExecutionHandler
 * @param {Context<Source>} ctx
 * @param {...any} args
 * @returns {number}
 */

/**
 * @template Source
 * @typedef {{
 *   chunk: LiteralChunk,
 *   executes: ExecutionHandler<Source> | null,
 *   requires: ((source: Source) => boolean) | null,
 *   children: Set<Fragment<Source>>
 * }} LiteralFragment
 */

/**
 * @template Source
 * @typedef {{
 *   chunk: ArgumentChunk,
 *   executes: ExecutionHandler<Source> | null,
 *   requires: ((source: Source) => boolean) | null,
 *   children: Set<Fragment<Source>>
 * }} ArgumentFragment
 */

/**
 * @template Source
 * @typedef {{
 *   chunk: Chunk,
 *   executes: ExecutionHandler<Source> | null,
 *   requires: ((source: Source) => boolean) | null,
 *   children: Set<Fragment<Source>>
 * }} Fragment
 */

/**
 * @template Source
 * @typedef {{
 *   type: "child",
 *   value: Fragment<Source>
 * }} MetaChild
 */

/**
 * @template Source
 * @typedef {{
 *   type: "executes",
 *   value: ExecutionHandler<Source>
 * }} MetaExecutes
 */

/**
 * @template Source
 * @typedef {{
 *   type: "requires",
 *   value: (source: Source) => boolean
 * }} MetaRequires
 */

/**
 * @template Source
 * @typedef {MetaChild<Source> | MetaExecutes<Source> | MetaRequires<Source>} Meta
 */

/**
 * on collision, throws error
 *
 * @template Source
 * @param {Fragment<Source>[]} fragments
 * @param {Chunk[]} path
 * @returns {Set<Fragment<Source>>}
 */
function mergeFragments(fragments, path) {
    /** @type {Map<Chunk["type"], Map<string, Fragment<Source>[]>>} */
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

                    if (fragments.filter((fragment) => fragment.executes).length > 1)
                        throw new Error(
                            `Multiple fragments provide handler function for /${chunksToString(currentPath)}`,
                        );

                    if (fragments.filter((fragment) => fragment.requires).length > 1)
                        throw new Error(
                            `Multiple fragments provide requires predicate for /${chunksToString(currentPath)}`,
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

                    /** @type {Fragment<Source>} */
                    const mergedFragment = {
                        chunk: fragments[0].chunk,
                        executes: fragments.find((fragment) => fragment.executes)?.executes ?? null,
                        requires: fragments.find((fragment) => fragment.requires)?.requires ?? null,
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
 * @template Source
 * @param {(Chunk | string)[] | Chunk | string} chunks
 * @param {Meta<Source>[]} [additionalMetadata=[]]
 * @returns {Fragment<Source>}
 */
function fragment(chunks, additionalMetadata = []) {
    if (!Array.isArray(chunks)) chunks = [chunks];

    switch (chunks.length) {
        case 0:
            throw new Error("fragment should supply at least 1 chunk, got 0");
        case 1:
            return {
                chunk: typeof chunks[0] === "string" ? literal(chunks[0]) : chunks[0],
                executes:
                    additionalMetadata.find((meta) => meta.type === "executes")?.value ?? null,
                requires:
                    additionalMetadata.find((meta) => meta.type === "requires")?.value ?? null,
                children: new Set(
                    additionalMetadata
                        .filter((meta) => meta.type === "child")
                        .map((meta) => meta.value),
                ),
            };
        default:
            return {
                chunk: typeof chunks[0] === "string" ? literal(chunks[0]) : chunks[0],
                executes: null,
                requires: null,
                children: new Set([fragment(chunks.slice(1), additionalMetadata)]),
            };
    }
}

module.exports = { fragment, mergeFragments };
