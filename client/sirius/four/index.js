const Minecraft = Java.type("net.minecraft.client.Minecraft");
const Component = Java.type("net.minecraft.network.chat.Component");

Minecraft.getInstance().gui.hud.getChat().addClientSystemMessage(Component.literal("four"));

module.onunload = () => {
    console.log("unload 4");
};
