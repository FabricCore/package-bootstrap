/** @import { CommandSourceStack } from "/types/full/net/minecraft/commands/CommandSourceStack"; */
/** @import { CommandBuildContext } from "/types/full/net/minecraft/commands/CommandBuildContext"; */
/** @import { MinecraftServer } from "/types/full/net/minecraft/server/MinecraftServer"; */
/** @import { HolderLookup } from "/types/full/net/minecraft/core/HolderLookup"; */
/** @import { LiteralFragment } from "../universal/fragment.js" */

const CommandRegistrationCallback = Java.type(
    "net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback",
);
const CommandRegistrationCallbackExt = Java.extend(CommandRegistrationCallback);
const FabricLoader = Java.type("net.fabricmc.loader.api.FabricLoader");
const EnvType = Java.type("net.fabricmc.api.EnvType");
const CommandNode = Java.type("com.mojang.brigadier.tree.CommandNode");
const CommandBuildContext = Java.type("net.minecraft.commands.CommandBuildContext");
const { registerListener } = require("sirius/array-backed-event");

const { getCommands } = require("../universal/tree.js");
const { buildLiteral } = require("../universal/buildCommand.js");
/**
 * @returns {MinecraftServer | null}
 */
function getServer() {
    const loader = FabricLoader.getInstance();
    if (loader.getEnvironmentType() === EnvType.SERVER) return loader.getGameInstance();

    // only resolvable on the client, the class does not exist on a dedicated server
    const Minecraft = Java.type("net.minecraft.client.Minecraft");
    return Minecraft.getInstance().getSingleplayerServer();
}

/**
 * @param {MinecraftServer} server
 * @returns {CommandBuildContext}
 */
function buildContextOf(server) {
    /** @type {HolderLookup.Provider} */
    /// @ts-expect-error -- the generated Registry's get(int)/get(Identifier) hide HolderGetter's get(ResourceKey)/get(TagKey) (TS overload hiding), so Frozen stops matching Provider; in Java it is one.
    const registries = server.registryAccess();
    return CommandBuildContext.simple(registries, server.getWorldData().enabledFeatures());
}

/**
 * resend the command tree so clients pick up added/removed commands
 *
 * @param {MinecraftServer} server
 * @returns {void}
 */
function refreshCommandTrees(server) {
    const commands = server.getCommands();
    server
        .getPlayerList()
        .getPlayers()
        .forEach((player) => commands.sendCommands(player));
}

class RegisteredServerCommand {
    /**
     * @param {string} name
     * @param {() => void} onunregister
     */
    constructor(name, onunregister) {
        /** @type {string} */
        this.name = name;
        /** @type {() => void} */
        this.onunregister = onunregister;
        /** @type {boolean} */
        this.hasUnregistered = false;
    }

    unregister() {
        if (this.hasUnregistered) return;

        this.hasUnregistered = true;
        this.onunregister();

        const server = getServer();
        if (server === null) return;

        server.execute(() => {
            const root = server.getCommands().getDispatcher().getRoot();

            // children is the actual map
            // literals is the cache
            // we need to remove from both
            ["children", "literals"].forEach((fieldName) => {
                const field = CommandNode.class.getDeclaredField(fieldName);
                field.setAccessible(true);
                field.get(root).remove(this.name);
            });

            refreshCommandTrees(server);
        });
    }
}

/**
 * @param {LiteralFragment<CommandSourceStack>} fragment
 * @param {() => void} onunregister
 * @returns {RegisteredServerCommand} used for removing the registered command
 */
function registerServerCommand(fragment, onunregister) {
    const server = getServer();
    if (server !== null) {
        server
            .getCommands()
            .getDispatcher()
            .register(buildLiteral(fragment, buildContextOf(server)));
        refreshCommandTrees(server);
    }

    return new RegisteredServerCommand(fragment.chunk.value, onunregister);
}

// fires whenever a Commands instance is built after this module loaded, i.e. every /reload
const registrationHandle = registerListener(
    CommandRegistrationCallback.EVENT,
    new CommandRegistrationCallbackExt({
        register: (dispatcher, commandBuildContext, _selection) => {
            /** @type {CommandBuildContext} */
            /// @ts-expect-error -- CommandBuildContext inherits a call signature from HolderGetter.Provider, so the generated JavaFn<CommandBuildContext> widens to a union with a function type; it is always a real CommandBuildContext at runtime here.
            const buildContext = commandBuildContext;

            getCommands().forEach((fragment) =>
                dispatcher.register(buildLiteral(fragment, buildContext)),
            );
        },
    }),
);

module.onunload = () => {
    registrationHandle.unregister();
};

module.exports = {
    registerServerCommand,
};
