/** @import { FabricClientCommandSource } from "/types/full/net/fabricmc/fabric/api/client/command/v2/FabricClientCommandSource"; */
/** @import { LiteralArgumentBuilder } from "/types/full/com/mojang/brigadier/builder/LiteralArgumentBuilder"; */
/** @import { LiteralCommandNode } from "/types/full/com/mojang/brigadier/tree/LiteralCommandNode"; */
/** @import { CommandBuildContext } from "/types/full/net/minecraft/commands/CommandBuildContext"; */
/** @import { LiteralFragment } from "../universal/fragment.js" */

const ClientCommands = Java.type("net.fabricmc.fabric.api.client.command.v2.ClientCommands");
const ClientCommandRegistrationCallback = Java.type(
    "net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback",
);
const ClientCommandRegistrationCallbackExt = Java.extend(ClientCommandRegistrationCallback);
const CommandNode = Java.type("com.mojang.brigadier.tree.CommandNode");
const { registerListener } = require("sirius/array-backed-event");

const { getCommands } = require("../universal/tree.js");
const { buildLiteral } = require("../universal/buildCommand.js");

/** @type {CommandBuildContext | null} */
let buildContextCache = null;

class RegisteredClientCommand {
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

        const dispatcher = ClientCommands.getActiveDispatcher();
        if (dispatcher === null) return;

        const root = dispatcher.getRoot();

        // children is the actual map
        // literals is the cache
        // we need to remove from both
        ["children", "literals"].forEach((fieldName) => {
            const field = CommandNode.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.get(root).remove(this.name);
        });

        ClientCommands.refreshCommandCompletions();
    }
}

/**
 * @param {LiteralFragment<FabricClientCommandSource>} fragment
 * @param {() => void} onunregister
 * @returns {RegisteredClientCommand} used for removing the registered command
 */
function registerClientCommand(fragment, onunregister) {
    const dispatcher = ClientCommands.getActiveDispatcher();
    const buildContext = buildContextCache;
    if (dispatcher !== null && buildContext !== null) {
        // is in a world
        dispatcher.register(buildLiteral(fragment, buildContext));
        ClientCommands.refreshCommandCompletions();
    }

    return new RegisteredClientCommand(fragment.chunk.value, onunregister);
}

const handle = registerListener(
    ClientCommandRegistrationCallback.EVENT,
    new ClientCommandRegistrationCallbackExt({
        register: (dispatcher, commandBuildContext) => {
            /** @type {CommandBuildContext} */
            /// @ts-expect-error -- CommandBuildContext inherits a call signature from HolderGetter.Provider, so the generated JavaFn<CommandBuildContext> widens to a union with a function type; it is always a real CommandBuildContext at runtime here.
            const buildContext = commandBuildContext;
            buildContextCache = buildContext;

            getCommands().forEach((fragment) =>
                dispatcher.register(buildLiteral(fragment, buildContext)),
            );
        },
    }),
);

module.onunload = () => {
    handle.unregister();
};

module.exports = {
    registerClientCommand,
};
