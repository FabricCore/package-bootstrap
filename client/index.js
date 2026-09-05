const Minecraft = Java.type("net.minecraft.client.Minecraft");
const ClientPlayerBlockBreakEvents = Java.type(
    "net.fabricmc.fabric.api.event.client.player.ClientPlayerBlockBreakEvents",
);
const Component = Java.type("net.minecraft.network.chat.Component");
/** @type {import("../bootstrap/moduleIndex.js")} */
/// @ts-expect-error
const { getModuleIndex } = module.import("../bootstrap/moduleIndex.js", []);

ClientPlayerBlockBreakEvents.AFTER.register(
    new (Java.extend(ClientPlayerBlockBreakEvents.After))({
        afterBlockBreak: (world, player, blockPos, state) => {
            Minecraft.getInstance()
                .gui.hud.getChat()
                .addClientSystemMessage(
                    Component.literal(JSON.stringify(getModuleIndex("client").dag.toposort())),
                );
        },
    }),
);
