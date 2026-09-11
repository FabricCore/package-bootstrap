const require = globalThis.module.createPrelude((targetGlobal, targetModule) => {
    targetGlobal.require = (/** @type {string} */ path) => targetModule.import(path, [require]);
});

module.exports = {
    require,
};
