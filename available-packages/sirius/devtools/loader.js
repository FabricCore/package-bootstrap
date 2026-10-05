const SharedSuggestionProvider = Java.type("net.minecraft.commands.SharedSuggestionProvider");

const { arg, executes, child } = require("sirius/commands");
const { propose, loadedPackages, availablePackages } = require("sirius/loader-api");
const { base } = require("sirius/fs");

/**
 * @param {Object} param0
 * @param {string[]} param0.ids
 * @returns {string}
 */
function idsToList({ ids }) {
    return ids.map((s) => `- ${s}`).join("\n");
}

/**
 * @import { DependencyViolation } from "/bootstrap/moduleIndex";
 * @param {DependencyViolation} violation
 * @returns {string}
 */
function depViolation({ dependency, dependent, error, requiredVersion }) {
    const errorMsg =
        error.kind === "missing"
            ? "is missing"
            : `found ${dependent} [${error.gotVersion.chunks.join(".")}]`;
    return `${dependency} requires ${dependent} [${requiredVersion}] but ${errorMsg}`;
}

/**
 * @import { Rejection } from "/bootstrap/moduleIndex";
 * @param {Rejection} rej
 * @returns {string}
 */
function rejectReason(rej) {
    switch (rej.reason.type) {
        case "nonDisjoint":
            return `The list of packages to unload contains duplicates:\n${idsToList(rej.reason)}`;
        case "loadNameCollision":
            return `Some of the packages to load are already loaded:\n${idsToList(rej.reason)}`;
        case "unloadReplaceNonExistingPackage":
            return `The package to unload/replace does not already exist:\n${idsToList(rej.reason)}`;
        case "dependentBlocksUnload":
            return `The package to unload is required by another package:\n${rej.reason.packages.map(({ id, requiredBy }) => `- ${id} (required by ${requiredBy.join(" ")})`)}`;
        case "dependencyViolation":
            return `Some of the packages does not have the required dependencies:\n${rej.reason.cases.map(depViolation)}`;
    }
}

/**
 * @import { CommandSource } from "sirius/commands/universal/fragment";
 * @import { UnifiedSuggestionHandler } from "sirius/commands/universal/helpers";
 * @type {UnifiedSuggestionHandler<CommandSource>}
 */
function suggestExistingPackage(_ctx, builder) {
    const packageNames = loadedPackages();
    const remaining = builder.getRemaining(); // all values before cursor
    const wordStart = remaining.lastIndexOf(" ") + 1;
    const word = builder.createOffset(builder.getStart() + wordStart);

    const incompletePackageName = remaining.slice(wordStart);
    return SharedSuggestionProvider.suggest(
        packageNames.filter((id) => id.startsWith(incompletePackageName)),
        word,
    );
}

/**
 * @type {UnifiedSuggestionHandler<CommandSource>}
 */
function suggestAvailablePackage(_ctx, builder) {
    const alreadyLoaded = new Set(loadedPackages());
    const packageNames = availablePackages().filter((s) => !alreadyLoaded.has(s));
    const remaining = builder.getRemaining(); // all values before cursor
    const wordStart = remaining.lastIndexOf(" ") + 1;
    const word = builder.createOffset(builder.getStart() + wordStart);

    const incompletePackageName = remaining.slice(wordStart);
    return SharedSuggestionProvider.suggest(
        packageNames.filter((id) => id.startsWith(incompletePackageName)),
        word,
    );
}

/**
 * @type {UnifiedSuggestionHandler<CommandSource>}
 */
function suggestReplacableablePackage(_ctx, builder) {
    const alreadyLoaded = new Set(loadedPackages());
    const packageNames = availablePackages().filter((s) => alreadyLoaded.has(s));
    const remaining = builder.getRemaining(); // all values before cursor
    const wordStart = remaining.lastIndexOf(" ") + 1;
    const word = builder.createOffset(builder.getStart() + wordStart);

    const incompletePackageName = remaining.slice(wordStart);
    return SharedSuggestionProvider.suggest(
        packageNames.filter((id) => id.startsWith(incompletePackageName)),
        word,
    );
}

module.exports = {
    children: [
        child(
            ["load", arg("packages", "greedy", { suggests: suggestAvailablePackage })],
            executes((ctx, /** @type {string} */ packages) => {
                const res = propose({
                    toLoad: packages
                        .split(" ")
                        .filter((s) => s.length !== 0)
                        .map((s) => `available-packages/${s}`),
                    apply: true,
                });

                if (res.result === "rejected")
                    ctx.getSource().error(`Load rejected. ${rejectReason(res)}`);
                else ctx.getSource().reply("Load accepted");
            }),
        ),

        child(
            ["replace", arg("packages", "greedy", { suggests: suggestAvailablePackage })],
            executes((ctx, /** @type {string} */ packages) => {
                const res = propose({
                    toReplace: packages
                        .split(" ")
                        .filter((s) => s.length !== 0)
                        .map((s) => `available-packages/${s}`),
                    apply: true,
                });

                if (res.result === "rejected")
                    ctx.getSource().error(`Replace rejected. ${rejectReason(res)}`);
                else ctx.getSource().reply("Replace accepted");
            }),
        ),

        child(
            ["reload", arg("packages", "greedy", { suggests: suggestExistingPackage })],
            executes((ctx, /** @type {string} */ packages) => {
                const res = propose({
                    toReplace: packages
                        .split(" ")
                        .filter((s) => s.length !== 0)
                        .map((s) => `/${base}/${s}`),
                    apply: true,
                });

                if (res.result === "rejected")
                    ctx.getSource().error(`Reload rejected. ${rejectReason(res)}`);
                else ctx.getSource().reply("Reload accepted");

                return 1; // important, errors with "context closed" if removed!
                // this is because using "??" accesses context for some reason
            }),
        ),

        child(
            ["unload", arg("packages", "greedy", { suggests: suggestExistingPackage })],
            executes((ctx, /** @type {string} */ packages) => {
                const res = propose({
                    toUnload: packages.split(" ").filter((s) => s.length !== 0),
                    apply: true,
                });

                if (res.result === "rejected")
                    ctx.getSource().error(`Unload rejected. ${rejectReason(res)}`);
                else ctx.getSource().reply("Unload accepted");

                return 1; // important, errors with "context closed" if removed!
                // this is because using "??" accesses context for some reason
            }),
        ),
    ],
};
