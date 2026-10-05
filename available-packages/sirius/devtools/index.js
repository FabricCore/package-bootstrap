const { newCommand, requires } = require("sirius/commands");
const { base } = require("sirius/fs");
const loader = require("./loader.js");

const Permissions = Java.type("net.minecraft.server.permissions.Permissions");
const CommandSourceStack = Java.type("net.minecraft.commands.CommandSourceStack");

const cmd = newCommand(
    base === "client" ? "dev" : "devsrv",

    // command source stack is server side command only
    requires(
        (source) =>
            !(source instanceof CommandSourceStack) ||
            source.permissions().hasPermission(Permissions.COMMANDS_ADMIN),
    ),

    ...loader.children,
);

module.onunload = () => {
    cmd.unregister();
};
