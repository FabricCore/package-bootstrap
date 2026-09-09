const Minecraft = Java.type("net.minecraft.client.Minecraft");
const Component = Java.type("net.minecraft.network.chat.Component");

const { pi } = require("../one/index.js");

Minecraft.getInstance().gui.hud.getChat().addClientSystemMessage(Component.literal(pi.toString()));

module.onunload = () => {
    console.log("unload 2");
};
