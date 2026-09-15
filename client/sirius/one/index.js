const Minecraft = Java.type("net.minecraft.client.Minecraft");
const Component = Java.type("net.minecraft.network.chat.Component");
const ClientPlayerBlockBreakEvents = Java.type(
    "net.fabricmc.fabric.api.event.client.player.ClientPlayerBlockBreakEvents",
);

Minecraft.getInstance().gui.hud.getChat().addClientSystemMessage(Component.literal("one"));

module.onunload = () => {
    console.log("unload 1");
};

module.exports = {
    prelude: module.createPrelude((targetGlobal, targetModule) => {
        targetGlobal.one = 1;
    }),
    one: 1,
};
