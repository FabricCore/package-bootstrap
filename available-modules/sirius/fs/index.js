/** @type {"client" | "server"} */
const base = /** @type {any} */ (module).path.split("/")[1];

if (base !== "client" && base !== "server") throw new Error(`Unknown execution base ${base}`);

module.exports = {
    base,
};
