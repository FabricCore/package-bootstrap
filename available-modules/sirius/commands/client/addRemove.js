/** @import { FabricClientCommandSource } from "/types/full/net/fabricmc/fabric/api/client/command/v2/FabricClientCommandSource"; */
/** @import { LiteralArgumentBuilder } from "/types/full/com/mojang/brigadier/builder/LiteralArgumentBuilder"; */
/** @import { LiteralCommandNode } from "/types/full/com/mojang/brigadier/tree/LiteralCommandNode"; */

const ClientCommands = Java.type("net.fabricmc.fabric.api.client.command.v2.ClientCommands");

/**
 * @param {LiteralArgumentBuilder<FabricClientCommandSource>} builder 
 * @returns {LiteralCommandNode<FabricClientCommandSource> | undefined} used for removing the registered command
 */
function register(builder) {
    const dispatcher = ClientCommands.getActiveDispatcher();
    if (dispatcher === null)
        return; // not in a world yet

    const node = dispatcher.register(builder);
    ClientCommands.refreshCommandCompletions();
    return node;
}
