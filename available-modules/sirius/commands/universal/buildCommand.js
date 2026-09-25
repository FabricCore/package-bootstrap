/**
 * @import { Fragment, LiteralFragment, ArgumentFragment } from "./fragment.js"
 * @import { CommandBuildContext } from "/types/full/net/minecraft/commands/CommandBuildContext"
 */

const LiteralArgumentBuilder = Java.type("com.mojang.brigadier.builder.LiteralArgumentBuilder");
const RequiredArgumentBuilder = Java.type("com.mojang.brigadier.builder.RequiredArgumentBuilder");
const JavaObject = Java.type("java.lang.Object");

/**
 * @template Source
 * @typedef {import("/types/full/com/mojang/brigadier/builder/LiteralArgumentBuilder").LiteralArgumentBuilder<Source>} LiteralArgumentBuilder
 */

/**
 * @template Source
 * @typedef {import("/types/full/com/mojang/brigadier/builder/RequiredArgumentBuilder.js").RequiredArgumentBuilder<Source, any>} RequiredArgumentBuilder
 */


/**
 * @template Source
 * @param {LiteralArgumentBuilder<Source> | RequiredArgumentBuilder<Source>} builder 
 * @param {Fragment<Source>} fragment 
 * @param {CommandBuildContext} buildContext 
 * @param {string[]} argumentNames
 * @returns {void}
 */
function finishBuilder(builder, { executes, children }, buildContext, argumentNames) {
    if (executes !== undefined)
        builder.executes((ctx) => executes(ctx, ...argumentNames.map(name => ctx.getArgument(name, JavaObject.class))));

    children.forEach(child => buildCommand(child, buildContext, argumentNames));
}

/**
 * @template Source
 * @param {Fragment<Source>} fragment 
 * @param {CommandBuildContext} buildContext 
 * @param {string[]} argumentNames
 * @returns {LiteralArgumentBuilder<Source> | RequiredArgumentBuilder<Source>}
 */
function buildCommand(fragment, buildContext, argumentNames) {
    switch (fragment.chunk.type) {
        case "literal": {
            /** @type {LiteralFragment<Source>} */
            /// @ts-expect-error
            const literalFragment = fragment;
            return buildLiteral(literalFragment, buildContext, argumentNames);
        }
        case "argument": {
            /** @type {ArgumentFragment<Source>} */
            /// @ts-expect-error
            const argumentFragment = fragment;
            return buildArgument(argumentFragment, buildContext, argumentNames);
        }
    }
}

/**
 * @template Source
 * @param {LiteralFragment<Source>} fragment 
 * @param {CommandBuildContext} buildContext 
 * @param {string[]} argumentNames
 * @returns {LiteralArgumentBuilder<Source>}
 */
function buildLiteral(fragment, buildContext, argumentNames) {
    const builder = LiteralArgumentBuilder.literal(fragment.chunk.value);
    finishBuilder(builder, fragment, buildContext, argumentNames);
    return builder;
}

/**
 * @template Source
 * @param {ArgumentFragment<Source>} fragment 
 * @param {CommandBuildContext} buildContext 
 * @param {string[]} argumentNames
 * @returns {RequiredArgumentBuilder<Source>}
 */
function buildArgument(fragment, buildContext, argumentNames) {
    argumentNames = argumentNames.concat([fragment.chunk.value]);
    const builder = RequiredArgumentBuilder.argument(fragment.chunk.value, fragment.chunk.argumentType(buildContext));
    finishBuilder(builder, fragment, buildContext, argumentNames);
    return builder;
}
