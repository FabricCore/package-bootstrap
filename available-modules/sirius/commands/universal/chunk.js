/** @typedef {import("/types/full/com/mojang/brigadier/arguments/ArgumentType").ArgumentType<any>} ArgumentType */
/** @typedef {import("/types/full/net/minecraft/commands/CommandBuildContext").CommandBuildContext} CommandBuildContext */

const BoolArgumentType = Java.type("com.mojang.brigadier.arguments.BoolArgumentType");
const DoubleArgumentType = Java.type("com.mojang.brigadier.arguments.DoubleArgumentType");
const FloatArgumentType = Java.type("com.mojang.brigadier.arguments.FloatArgumentType");
const IntegerArgumentType = Java.type("com.mojang.brigadier.arguments.IntegerArgumentType");
const LongArgumentType = Java.type("com.mojang.brigadier.arguments.LongArgumentType");
const StringArgumentType = Java.type("com.mojang.brigadier.arguments.StringArgumentType");

const AngleArgument = Java.type("net.minecraft.commands.arguments.AngleArgument");
const ComponentArgument = Java.type("net.minecraft.commands.arguments.ComponentArgument");
const CompoundTagArgument = Java.type("net.minecraft.commands.arguments.CompoundTagArgument");
const DimensionArgument = Java.type("net.minecraft.commands.arguments.DimensionArgument");
const EntityAnchorArgument = Java.type("net.minecraft.commands.arguments.EntityAnchorArgument");
const EntityArgument = Java.type("net.minecraft.commands.arguments.EntityArgument");
const GameModeArgument = Java.type("net.minecraft.commands.arguments.GameModeArgument");
const GameProfileArgument = Java.type("net.minecraft.commands.arguments.GameProfileArgument");
const HeightmapTypeArgument = Java.type("net.minecraft.commands.arguments.HeightmapTypeArgument");
const HexColorArgument = Java.type("net.minecraft.commands.arguments.HexColorArgument");
const IdentifierArgument = Java.type("net.minecraft.commands.arguments.IdentifierArgument");
const MessageArgument = Java.type("net.minecraft.commands.arguments.MessageArgument");
const NbtPathArgument = Java.type("net.minecraft.commands.arguments.NbtPathArgument");
const NbtTagArgument = Java.type("net.minecraft.commands.arguments.NbtTagArgument");
const ObjectiveArgument = Java.type("net.minecraft.commands.arguments.ObjectiveArgument");
const ObjectiveCriteriaArgument = Java.type(
    "net.minecraft.commands.arguments.ObjectiveCriteriaArgument",
);
const OperationArgument = Java.type("net.minecraft.commands.arguments.OperationArgument");
const ParticleArgument = Java.type("net.minecraft.commands.arguments.ParticleArgument");
const RangeArgument = Java.type("net.minecraft.commands.arguments.RangeArgument");
const ResourceArgument = Java.type("net.minecraft.commands.arguments.ResourceArgument");
const ResourceKeyArgument = Java.type("net.minecraft.commands.arguments.ResourceKeyArgument");
const ResourceOrIdArgument = Java.type("net.minecraft.commands.arguments.ResourceOrIdArgument");
const ResourceOrTagArgument = Java.type("net.minecraft.commands.arguments.ResourceOrTagArgument");
const ResourceOrTagKeyArgument = Java.type(
    "net.minecraft.commands.arguments.ResourceOrTagKeyArgument",
);
const ResourceSelectorArgument = Java.type(
    "net.minecraft.commands.arguments.ResourceSelectorArgument",
);
const ScoreHolderArgument = Java.type("net.minecraft.commands.arguments.ScoreHolderArgument");
const ScoreboardSlotArgument = Java.type("net.minecraft.commands.arguments.ScoreboardSlotArgument");
const SlotArgument = Java.type("net.minecraft.commands.arguments.SlotArgument");
const SlotsArgument = Java.type("net.minecraft.commands.arguments.SlotsArgument");
const StyleArgument = Java.type("net.minecraft.commands.arguments.StyleArgument");
const TeamArgument = Java.type("net.minecraft.commands.arguments.TeamArgument");
const TeamColorArgument = Java.type("net.minecraft.commands.arguments.TeamColorArgument");
const TemplateMirrorArgument = Java.type("net.minecraft.commands.arguments.TemplateMirrorArgument");
const TemplateRotationArgument = Java.type(
    "net.minecraft.commands.arguments.TemplateRotationArgument",
);
const TimeArgument = Java.type("net.minecraft.commands.arguments.TimeArgument");
const UuidArgument = Java.type("net.minecraft.commands.arguments.UuidArgument");

const BlockPredicateArgument = Java.type(
    "net.minecraft.commands.arguments.blocks.BlockPredicateArgument",
);
const BlockStateArgument = Java.type("net.minecraft.commands.arguments.blocks.BlockStateArgument");
const BlockPosArgument = Java.type("net.minecraft.commands.arguments.coordinates.BlockPosArgument");
const ColumnPosArgument = Java.type(
    "net.minecraft.commands.arguments.coordinates.ColumnPosArgument",
);
const RotationArgument = Java.type("net.minecraft.commands.arguments.coordinates.RotationArgument");
const SwizzleArgument = Java.type("net.minecraft.commands.arguments.coordinates.SwizzleArgument");
const Vec2Argument = Java.type("net.minecraft.commands.arguments.coordinates.Vec2Argument");
const Vec3Argument = Java.type("net.minecraft.commands.arguments.coordinates.Vec3Argument");
const FunctionArgument = Java.type("net.minecraft.commands.arguments.item.FunctionArgument");
const ItemArgument = Java.type("net.minecraft.commands.arguments.item.ItemArgument");
const ItemPredicateArgument = Java.type(
    "net.minecraft.commands.arguments.item.ItemPredicateArgument",
);

const Identifier = Java.type("net.minecraft.resources.Identifier");
const ResourceKey = Java.type("net.minecraft.resources.ResourceKey");

/**
 * Options for the argument types that take parameters. Everything is optional --
 * an argument type ignores whatever does not apply to it.
 *
 * @typedef {object} ArgumentOptions
 * @property {number} [min] lower bound for the numeric types, minimum tick count for "time"
 * @property {number} [max] upper bound for the numeric types; only read when min is given too
 * @property {boolean} [centerCorrect] for "vec2" and "vec3": whole coordinates snap to block centres
 * @property {string} [registry] registry id for the resource types, e.g. "minecraft:item"
 */

/**
 * Vanilla argument types come in two flavours: the ones that stand alone, and the ones
 * that need the CommandBuildContext the server hands to CommandRegistrationCallback
 * (anything that resolves against a registry). A chunk therefore holds a factory rather
 * than a built ArgumentType -- call it once, at registration time, with that context.
 *
 * @typedef {(ctx: CommandBuildContext) => ArgumentType} ArgumentTypeFactory
 * @typedef {(options: ArgumentOptions, ctx: CommandBuildContext) => ArgumentType} ArgumentTypeBuilder
 * @typedef {{type: "literal", value: string}} LiteralChunk
 * @typedef {{type: "argument", value: string, argumentTypeId: ArgumentTypeId, argumentType: ArgumentTypeFactory}} ArgumentChunk
 * @typedef {LiteralChunk | ArgumentChunk} Chunk
 */

/**
 * Brigadier's numeric types overload on arity instead of taking sentinels, so a bound is
 * either passed or left out entirely. An upper bound without a lower one has nothing to
 * pass for the lower, and is ignored.
 *
 * @template T
 * @param {(...bounds: number[]) => T} factory
 * @param {ArgumentOptions} options
 * @returns {T}
 */
function ranged(factory, { min, max }) {
    if (min === undefined) return factory();
    if (max === undefined) return factory(min);
    return factory(min, max);
}

/**
 * @param {string | undefined} registry
 * @returns {any} ResourceKey<? extends Registry<?>>
 */
function registryKey(registry) {
    if (registry === undefined)
        throw new Error('this argument type needs options.registry, e.g. "minecraft:item"');

    return ResourceKey.createRegistryKey(Identifier.parse(registry));
}

/**
 * Every argument type the vanilla server knows how to send to a client, keyed by a short
 * name. Anything outside this table cannot be synchronised to clients and so cannot be
 * used in a command tree.
 */
const ARGUMENT_TYPES = {
    // brigadier primitives
    bool: () => BoolArgumentType.bool(),
    double: (/** @type {ArgumentOptions} */ o) => ranged(DoubleArgumentType.doubleArg, o),
    float: (/** @type {ArgumentOptions} */ o) => ranged(FloatArgumentType.floatArg, o),
    integer: (/** @type {ArgumentOptions} */ o) => ranged(IntegerArgumentType.integer, o),
    long: (/** @type {ArgumentOptions} */ o) => ranged(LongArgumentType.longArg, o),
    word: () => StringArgumentType.word(),
    phrase: () => StringArgumentType.string(),
    greedy: () => StringArgumentType.greedyString(),

    // positions and angles
    angle: () => AngleArgument.angle(),
    blockPos: () => BlockPosArgument.blockPos(),
    columnPos: () => ColumnPosArgument.columnPos(),
    rotation: () => RotationArgument.rotation(),
    swizzle: () => SwizzleArgument.swizzle(),
    vec2: (/** @type {ArgumentOptions} */ { centerCorrect }) =>
        centerCorrect === undefined ? Vec2Argument.vec2() : Vec2Argument.vec2(centerCorrect),
    vec3: (/** @type {ArgumentOptions} */ { centerCorrect }) =>
        centerCorrect === undefined ? Vec3Argument.vec3() : Vec3Argument.vec3(centerCorrect),

    // entities and players
    entity: () => EntityArgument.entity(),
    entities: () => EntityArgument.entities(),
    player: () => EntityArgument.player(),
    players: () => EntityArgument.players(),
    entityAnchor: () => EntityAnchorArgument.anchor(),
    gameProfile: () => GameProfileArgument.gameProfile(),

    // nbt
    compoundTag: () => CompoundTagArgument.compoundTag(),
    nbtTag: () => NbtTagArgument.nbtTag(),
    nbtPath: () => NbtPathArgument.nbtPath(),

    // scoreboard
    objective: () => ObjectiveArgument.objective(),
    objectiveCriteria: () => ObjectiveCriteriaArgument.criteria(),
    operation: () => OperationArgument.operation(),
    scoreboardSlot: () => ScoreboardSlotArgument.displaySlot(),
    scoreHolder: () => ScoreHolderArgument.scoreHolder(),
    scoreHolders: () => ScoreHolderArgument.scoreHolders(),
    team: () => TeamArgument.team(),
    teamColor: () => TeamColorArgument.teamColor(),

    // inventory
    slot: () => SlotArgument.slot(),
    slots: () => SlotsArgument.slots(),

    // misc scalars
    dimension: () => DimensionArgument.dimension(),
    gameMode: () => GameModeArgument.gameMode(),
    heightmap: () => HeightmapTypeArgument.heightmap(),
    hexColor: () => HexColorArgument.hexColor(),
    identifier: () => IdentifierArgument.id(),
    message: () => MessageArgument.message(),
    templateMirror: () => TemplateMirrorArgument.templateMirror(),
    templateRotation: () => TemplateRotationArgument.templateRotation(),
    time: (/** @type {ArgumentOptions} */ { min }) =>
        min === undefined ? TimeArgument.time() : TimeArgument.time(min),
    uuid: () => UuidArgument.uuid(),
    function: () => FunctionArgument.functions(),
    intRange: () => RangeArgument.intRange(),
    floatRange: () => RangeArgument.floatRange(),

    // registry-backed, context free -- these carry the key only, nothing is resolved
    resourceKey: (/** @type {ArgumentOptions} */ { registry }) =>
        ResourceKeyArgument.key(registryKey(registry)),
    resourceOrTagKey: (/** @type {ArgumentOptions} */ { registry }) =>
        ResourceOrTagKeyArgument.resourceOrTagKey(registryKey(registry)),

    // need a CommandBuildContext
    component: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ComponentArgument.textComponent(ctx),
    style: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        StyleArgument.style(ctx),
    particle: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ParticleArgument.particle(ctx),
    blockState: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        BlockStateArgument.block(ctx),
    blockPredicate: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        BlockPredicateArgument.blockPredicate(ctx),
    item: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ItemArgument.item(ctx),
    itemPredicate: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ItemPredicateArgument.itemPredicate(ctx),
    lootTable: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ResourceOrIdArgument.lootTable(ctx),
    lootModifier: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ResourceOrIdArgument.lootModifier(ctx),
    lootPredicate: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ResourceOrIdArgument.lootPredicate(ctx),
    dialog: (/** @type {ArgumentOptions} */ _o, /** @type {CommandBuildContext} */ ctx) =>
        ResourceOrIdArgument.dialog(ctx),
    resource: (
        /** @type {ArgumentOptions} */ { registry },
        /** @type {CommandBuildContext} */ ctx,
    ) => ResourceArgument.resource(ctx, registryKey(registry)),
    resourceOrTag: (
        /** @type {ArgumentOptions} */ { registry },
        /** @type {CommandBuildContext} */ ctx,
    ) => ResourceOrTagArgument.resourceOrTag(ctx, registryKey(registry)),
    resourceSelector: (
        /** @type {ArgumentOptions} */ { registry },
        /** @type {CommandBuildContext} */ ctx,
    ) => ResourceSelectorArgument.resourceSelector(ctx, registryKey(registry)),
};

/** @typedef {keyof typeof ARGUMENT_TYPES} ArgumentTypeId */

/** The subset of ARGUMENT_TYPES that cannot be built without a CommandBuildContext. */
const NEEDS_CONTEXT = new Set([
    "component",
    "style",
    "particle",
    "blockState",
    "blockPredicate",
    "item",
    "itemPredicate",
    "lootTable",
    "lootModifier",
    "lootPredicate",
    "dialog",
    "resource",
    "resourceOrTag",
    "resourceSelector",
]);

/**
 * @param {string} value
 * @returns {LiteralChunk}
 */
function literal(value) {
    return {
        type: "literal",
        value,
    };
}

/**
 * @param {string} label
 * @param {ArgumentTypeId} kind
 * @param {ArgumentOptions} [options]
 * @returns {ArgumentChunk}
 */
function arg(label, kind, options = {}) {
    // Collapsed to one signature up front: calling straight off the table makes the
    // checker intersect every entry's signature, which blows its instantiation depth.
    const factory = /** @type {ArgumentTypeBuilder} */ (
        /** @type {unknown} */ (ARGUMENT_TYPES[kind])
    );

    if (factory === undefined) throw new Error(`no such argument type "${kind}"`);

    return {
        type: "argument",
        value: label,
        argumentTypeId: kind,
        argumentType: (ctx) => {
            if ((ctx === undefined || ctx === null) && NEEDS_CONTEXT.has(kind))
                throw new Error(`argument type "${kind}" needs a CommandBuildContext`);

            return factory(options, ctx);
        },
    };
}

/**
 * @param {Chunk} chunk
 * @returns {string}
 */
function chunkToString(chunk) {
    switch (chunk.type) {
        case "literal":
            return chunk.value;
        case "argument":
            return `<${chunk.value}:${chunk.argumentTypeId}>`;
    }
}

/**
 * @param {Chunk[]} chunks
 * @returns {string}
 */
function chunksToString(chunks) {
    return chunks.map(chunkToString).join(" ");
}

module.exports = { literal, arg, chunkToString, chunksToString };
