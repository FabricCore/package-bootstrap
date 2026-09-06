const Minecraft = Java.type("net.minecraft.client.Minecraft");
const ClientPlayerBlockBreakEvents = Java.type(
    "net.fabricmc.fabric.api.event.client.player.ClientPlayerBlockBreakEvents",
);
const Component = Java.type("net.minecraft.network.chat.Component");

/** @type {typeof import("../bootstrap/loader.js")} */
/// @ts-expect-error
const { createLoader } = module.import("../bootstrap/loader.js", []);

/**
 * @typedef {import("../bootstrap/moduleIndex.js")} ModuleIndex
 * @type {ModuleIndex?}
 */
let index = null;

ClientPlayerBlockBreakEvents.AFTER.register(
    new (Java.extend(ClientPlayerBlockBreakEvents.After))({
        afterBlockBreak: (world, player, blockPos, state) => {
            if (index === null) {
                index = createLoader("client");
                index.loadAll();
                module.onunload = () => {
                    index?.destroy();
                };
            } else {
                index.destroy();
                index = null;
            }

            Minecraft.getInstance()
                .gui.hud.getChat()
                .addClientSystemMessage(Component.literal("hello"));
        },
    }),
);
