/**
 * Ambient types for the jscore runtime.
 *
 * Every module is evaluated as a *script* (Source has no module mime type), with a
 * `module` object injected into the global scope by
 * jscore/src/main/java/ws/siri/jscore/runtime/Module.java. Members are backed by
 * JsModule.java in jscore-js-runtime.
 *
 * ## `module` vs `globalThis.module`
 *
 * In a `.js` file, an assignment to `module.exports` makes TypeScript bind the
 * file as CommonJS and synthesise its *own* `module` symbol, typed
 * `{ exports: <inferred> }`. That symbol shadows the `JscoreModule` declared
 * here for the whole file, so in any file that assigns `module.exports`, the
 * bare `module.import(...)`, `module.unimport(...)` and
 * `module.createPrelude(...)` are all TS2339 errors -- the `/// @ts-expect-error`
 * lines around `module.import` in bootstrap/loader.js are (partly) suppressing
 * exactly that.
 *
 * That inference is worth keeping: it is what makes `typeof import("./x.js")`
 * resolve to `x.js`'s `module.exports`. So keep writing `module.exports = ...`,
 * and reach the runtime-only members through `globalThis.module`, which the
 * synthesised symbol does not shadow:
 *
 * ```js
 * const prelude = globalThis.module.createPrelude((globalScope) => { ... });
 * module.exports = { prelude };
 * ```
 *
 * Aliasing (`const mod = module;`) does *not* work around it -- the alias just
 * picks up the shadowing type.
 */

interface JscoreModule {
  /**
   * This module's exported value. Assigning `module.exports = ...` is also what
   * makes TypeScript infer the file's exports for `typeof import("./file.js")`
   * -- at the cost of shadowing this interface for the rest of the file, see the
   * note at the top.
   */
  exports: any;

  /**
   * Called when the module is unloaded. Write-only in practice: JsModule.getMember
   * currently returns `exports` for this key.
   */
  onunload: (() => void) | undefined;

  /**
   * Load a module and return its `module.exports`, applying preludes, resolved
   * relative to *this* file -- or against the scripts root when the path starts
   * with `/`.
   *
   * ```js
   * const { readString, getJavaPath } = module.import("../loader/files.js", []);
   * ```
   *
   * Paths behave exactly like a normal `import`: relative to this file, or
   * root-absolute against the scripts root (`/` is mapped to the project root by
   * `paths` in jsconfig.json, and Module.importRelative gets the same result
   * because `Path.resolve` returns an absolute argument unchanged).
   *
   * The `.js` extension is required -- there is no extension or index resolution.
   *
   * The specifier is a plain path string, so its type can't be inferred here --
   * `typeof import(P)` only works for a literal `P` (TS1141), and `path` is a
   * parameter, not a literal. Cast the result with an explicit `@type`, and
   * suppress the resulting mismatch (the call is genuinely typed `unknown`):
   *
   * ```js
   * /** @type {typeof import("./semver.js")} *\/
   * /// @ts-expect-error
   * const { Semver, SemverPattern } = module.import("./semver.js", []);
   * ```
   *
   * @param preludes Preludes to apply to the module, from `createPrelude`. They
   * are only actually applied on the load that *creates* the module; a load that
   * hits the cache just checks the list, and throws
   * `prelude list does not match previous calls` if it differs from the list the
   * cached module was created with (order included). Required: JsModule rejects a
   * one-argument call.
   */
  import(path: string, preludes: JscorePrelude[]): unknown;

  /**
   * Remove this module's dependency on the module at `path`, resolved the same
   * way as `import` -- relative to this file, or root-absolute against the
   * scripts root when the path starts with `/`.
   *
   * The values from the unimported module are undefined behaviour after an
   * unimport.
   */
  unimport(path: string): void;

  /**
   * Create a prelude owned by *this* module, to be passed to `module.import`.
   *
   * `handler` runs once per module the prelude is applied to, before that
   * module's source is evaluated. Whatever it puts on `globalScope` becomes a
   * global of that module:
   *
   * ```js
   * const logging = globalThis.module.createPrelude((globalScope, target) => {
   *   globalScope.log = (msg) => console.log(msg);
   *   globalScope.strict = true;
   * });
   *
   * module.exports = { logging };
   * ```
   *
   * (`globalThis.module` rather than `module`, because this file assigns
   * `module.exports` -- see the note at the top.)
   *
   * and on the consuming side:
   *
   * ```js
   * /** @type {typeof import("./logging.js")} *\/
   * /// @ts-expect-error
   * const { logging } = module.import("./logging.js", []);
   * globalThis.module.import("./worker.js", [logging]); // worker.js sees a global `log`
   * ```
   *
   * `target` is the `module` object of the module being loaded, *not* this one.
   * It is handed over before evaluation, so `target.exports` is `undefined` at
   * that point -- it is useful for `target.import(...)` on that module's behalf,
   * or for keying per-module state off nothing more than object identity.
   *
   * The `module` global itself is bound *after* preludes are applied, so a
   * `globalScope.module = ...` from a prelude is overwritten and cannot shadow
   * it.
   *
   * Two things worth knowing about lifetimes:
   *
   * - A module loaded with a prelude gains a dependency on the prelude's source
   *   module (this one), exactly as if it had imported it: this module cannot
   *   unload while it is loaded, and unloading it can cascade into unloading
   *   this one. The source module must be `ACTIVE` when the prelude is used --
   *   which it is whenever the prelude was obtained through a normal `import`.
   * - Preludes compare by (source module, handler function), and each
   *   `createPrelude` call wraps the function afresh, so calling it twice with
   *   the same function does not reliably produce equal preludes. Create the
   *   prelude once at module scope, export it, and pass that same object every
   *   time -- otherwise a later `import` of an already loaded module trips the
   *   "prelude list does not match previous calls" check.
   */
  createPrelude(
    handler: (targetGlobal: Record<string, any>, targetModule: Module) => void,
  ): JscorePrelude;
}

declare var module: JscoreModule;
