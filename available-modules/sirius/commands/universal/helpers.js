/**
 * @import {
 *   ExecutionHandler,
 *   MetaExecutes,
 *   MetaChild,
 *   MetaRequires,
 *   Meta,
 *   CommandSource,
 *   Context,
 * } from "./fragment.js"
 * @import { Chunk } from "./chunk.js"
 * @import { Component as ComponentType } from "/types/full/net/minecraft/network/chat/Component"
 * @import { Entity } from "/types/full/net/minecraft/world/entity/Entity"
 * @import { Vec3 } from "/types/full/net/minecraft/world/phys/Vec3"
 * @import { Vec2 } from "/types/full/net/minecraft/world/phys/Vec2"
 * @import { ServerPlayer } from "/types/full/net/minecraft/server/level/ServerPlayer"
 * @import { ServerLevel } from "/types/full/net/minecraft/server/level/ServerLevel"
 * @import { LocalPlayer } from "/types/full/net/minecraft/client/player/LocalPlayer"
 * @import { ClientLevel } from "/types/full/net/minecraft/client/multiplayer/ClientLevel"
 * @import { PermissionSet } from "/types/full/net/minecraft/server/permissions/PermissionSet"
 * @import { RegistryAccess } from "/types/full/net/minecraft/core/RegistryAccess"
 * @import { FeatureFlagSet } from "/types/full/net/minecraft/world/flag/FeatureFlagSet"
 * @import { Collection } from "/types/full/java/util/Collection"
 * @import { CompletableFuture } from "/types/full/java/util/concurrent/CompletableFuture"
 * @import { Suggestions } from "/types/full/com/mojang/brigadier/suggestion/Suggestions"
 * @import { SuggestionsBuilder } from "/types/full/com/mojang/brigadier/suggestion/SuggestionsBuilder"
 * @import { SuggestionProvider } from "/types/full/com/mojang/brigadier/suggestion/SuggestionProvider"
 */

const { fragment } = require("./fragment.js");

const CommandSourceStack = Java.type("net.minecraft.commands.CommandSourceStack");
const SuggestionProvider = Java.type("com.mojang.brigadier.suggestion.SuggestionProvider");
const Component = Java.type("net.minecraft.network.chat.Component");

/**
 * @param {string | ComponentType} message
 * @returns {ComponentType}
 */
function toComponent(message) {
    return typeof message === "string" ? Component.literal(message) : message;
}

/**
 * one api over CommandSourceStack (server) and FabricClientCommandSource (client)
 *
 * a client source is always the local player, so player-related methods
 * are trivial there; a server source may be the console, a command block, any entity...
 */
class UnifiedSource {
    /**
     * @param {CommandSource} source
     */
    constructor(source) {
        /** @type {CommandSource} the wrapped source, for anything not unified here */
        this.internal = source;
    }

    /**
     * @returns {boolean}
     */
    isServer() {
        return this.internal instanceof CommandSourceStack;
    }

    /**
     * server: sendSuccess, client: sendFeedback
     *
     * @param {string | ComponentType} message
     * @param {boolean} [broadcast=false] also echo to ops, ignored on client
     * @returns {void}
     */
    reply(message, broadcast = false) {
        const component = toComponent(message);
        if (this.internal instanceof CommandSourceStack)
            this.internal.sendSuccess(() => component, broadcast);
        else this.internal.sendFeedback(component);
    }

    /**
     * server: sendFailure, client: sendError
     *
     * @param {string | ComponentType} message
     * @returns {void}
     */
    error(message) {
        const component = toComponent(message);
        if (this.internal instanceof CommandSourceStack) this.internal.sendFailure(component);
        else this.internal.sendError(component);
    }

    /**
     * @returns {boolean}
     */
    isPlayer() {
        if (this.internal instanceof CommandSourceStack) return this.internal.isPlayer();
        return this.internal.getPlayer() !== null;
    }

    /**
     * @returns {ServerPlayer | LocalPlayer | null} null if not run by a player
     */
    getPlayer() {
        return this.internal.getPlayer();
    }

    /**
     * @returns {Entity | null} null if not run by an entity
     */
    getEntity() {
        return this.internal.getEntity();
    }

    /**
     * @returns {Vec3}
     */
    getPosition() {
        return this.internal.getPosition();
    }

    /**
     * @returns {Vec2}
     */
    getRotation() {
        return this.internal.getRotation();
    }

    /**
     * @returns {ServerLevel | ClientLevel}
     */
    getLevel() {
        return this.internal.getLevel();
    }

    /**
     * server: getTextName, client: the local player's name
     *
     * @returns {string}
     */
    getName() {
        if (this.internal instanceof CommandSourceStack) return this.internal.getTextName();
        return this.internal.getPlayer().getName().getString();
    }

    /**
     * @returns {ComponentType}
     */
    getDisplayName() {
        if (this.internal instanceof CommandSourceStack) return this.internal.getDisplayName();
        return this.internal.getPlayer().getDisplayName();
    }

    /**
     * @returns {PermissionSet}
     */
    permissions() {
        return this.internal.permissions();
    }

    /**
     * @returns {RegistryAccess}
     */
    registryAccess() {
        return this.internal.registryAccess();
    }

    /**
     * @returns {FeatureFlagSet}
     */
    enabledFeatures() {
        return this.internal.enabledFeatures();
    }

    /**
     * @returns {Collection<string>}
     */
    getOnlinePlayerNames() {
        return this.internal.getOnlinePlayerNames();
    }

    /**
     * @returns {Collection<string>}
     */
    getAllTeams() {
        return this.internal.getAllTeams();
    }
}

/**
 * @template {CommandSource} Source
 * @typedef {Omit<Context<Source>, "getSource" | "getChild" | "getLastChild" | "copyFor"> & {
 *   raw: Context<Source>,
 *   getSource(): UnifiedSource,
 *   getChild(): UnifiedContext<Source> | null,
 *   getLastChild(): UnifiedContext<Source>,
 *   copyFor(source: Source | UnifiedSource): UnifiedContext<Source>,
 * }} UnifiedContext
 */

/**
 * @template {CommandSource} Source
 * @param {Context<Source>} ctx
 * @returns {UnifiedContext<Source>}
 */
function unifyContext(ctx) {
    const source = new UnifiedSource(ctx.getSource());

    /** @type {Record<string | symbol, unknown>} */
    const overrides = {
        raw: ctx,
        getSource: () => source,
        getChild: () => {
            const child = ctx.getChild();
            return child === null ? null : unifyContext(child);
        },
        getLastChild: () => unifyContext(ctx.getLastChild()),
        /** @param {Source | UnifiedSource} newSource */
        copyFor: (newSource) => {
            /** @type {any} */
            const raw = newSource instanceof UnifiedSource ? newSource.internal : newSource;
            return unifyContext(ctx.copyFor(raw));
        },
    };

    /** @type {any} */
    const proxy = new Proxy(overrides, {
        get(target, key) {
            if (key in target) return target[key];

            /** @type {any} */
            const raw = ctx;
            const value = raw[key];
            // forward with the real context as receiver
            return typeof value === "function"
                ? (/** @type {any[]} */ ...args) => raw[key](...args)
                : value;
        },
        has(target, key) {
            return key in target || key in ctx;
        },
    });

    return proxy;
}

/**
 * @template {CommandSource} Source
 * @callback UnifiedExecutionHandler
 * @param {UnifiedContext<Source>} ctx
 * @param {...any} args
 * @returns {number | void}
 */

/**
 * the handler receives a UnifiedContext instead of the raw brigadier context
 *
 * @template {CommandSource} Source
 * @param {UnifiedExecutionHandler<Source>} handler
 * @return {MetaExecutes<Source>}
 */
function executes(handler) {
    /** @type {ExecutionHandler<Source>} */
    const wrapped = (ctx, ...args) => handler(unifyContext(ctx), ...args) ?? 1;

    return {
        type: "executes",
        value: wrapped,
    };
}

/**
 * @template {CommandSource} Source
 * @callback UnifiedSuggestionHandler
 * @param {UnifiedContext<Source>} ctx
 * @param {SuggestionsBuilder} builder
 * @returns {CompletableFuture<Suggestions> | void} void builds whatever was added to builder
 */

/**
 * a java SuggestionProvider passes through untouched, a js function
 * receives a UnifiedContext instead of the raw brigadier context
 *
 * @template {CommandSource} Source
 * @param {SuggestionProvider<Source> | UnifiedSuggestionHandler<Source>} provider
 * @returns {SuggestionProvider.Fn<Source>}
 */
function suggestionProvider(provider) {
    // typeof can't tell them apart: a host object of a functional interface is executable too
    if (SuggestionProvider.class.isInstance(provider))
        return /** @type {SuggestionProvider<Source>} */ (provider);

    const handler = /** @type {UnifiedSuggestionHandler<Source>} */ (provider);
    return (ctx, builder) => handler(unifyContext(ctx), builder) ?? builder.buildFuture();
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
 * @param {(Chunk<Source> | string)[] | Chunk<Source> | string} chunks
 * @param {...Meta<Source>} additionalMetadata
 * @return {MetaChild<Source>}
 */
function child(chunks, ...additionalMetadata) {
    return {
        type: "child",
        value: fragment(chunks, additionalMetadata),
    };
}

module.exports = { child, executes, requires, suggestionProvider, UnifiedSource, unifyContext };
