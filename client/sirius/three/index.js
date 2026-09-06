const Minecraft = Java.type("net.minecraft.client.Minecraft");
const Component = Java.type("net.minecraft.network.chat.Component");

Minecraft.getInstance().gui.hud.getChat().addClientSystemMessage(Component.literal("three"));

module.onunload = () => {
    console.log("unload 3");
};
