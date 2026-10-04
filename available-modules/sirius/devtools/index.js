const { newCommand, arg, executes, requires, child } = require("sirius/commands");
const { base } = require("sirius/fs");
const { propose } = require("sirius/loader-api");

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

    child(
        ["load", arg("packages", "greedy")],
        executes((_ctx, /** @type {string} */ packages) => {
            propose({
                toLoad: packages.split(" ").filter((s) => s.length !== 0),
                apply: true,
            });
        }),
    ),

    child(
        ["unload", arg("packages", "greedy")],
        executes((ctx, /** @type {string} */ packages) => {
            const res = propose({
                toUnload: packages.split(" ").filter((s) => s.length !== 0),
                apply: true,
            });

            if (res.result === "rejected") {
                ctx.getSource().reply("Unload rejected");
            } else {
                ctx.getSource().reply("Unload accepted");
            }

            return 1; // important, errors with "context closed" if removed!
            // this is because using "??" accesses context for some reason
        }),
    ),
);

module.onunload = () => {
    cmd.unregister();
};
