/**
 * Ambient types for the jscore runtime.
 *
 * Every module is evaluated as a *script* (Source has no module mime type), with a
 * `module` object injected into the global scope by
 * jscore/src/main/java/ws/siri/jscore/runtime/Module.java. Members are backed by
 * JsModule.java in jscore-js-runtime.
 */

/**
 * Unwraps the synthetic `default` that TypeScript adds when modelling a
 * `module.exports = ...` file as a dynamic import. For an `export =` module that
 * synthetic default *is* the exports object, so this recovers exactly what
 * `module.import` returns at runtime -- without an `Omit`, which would flatten
 * callable and constructable exports.
 */
type JscoreExports<T> = T extends { default: infer D } ? D : T;

/**
 * Load a module and return its `module.exports`, resolved relative to *this* file --
 * or against the scripts root when the path starts with `/`.
 *
 * ```js
 * const { readString, getJavaPath } = require("../loader/files.js");
 * ```
 *
 * This declaration is documentation only. TypeScript special-cases `require` in a .js
 * file and types the call from the specifier itself, which is why this is the one
 * import form that needs no registry, no annotation, and no change to any other file
 * when you add a module.
 *
 * The special case is narrow, and the runtime matches it deliberately: the callee must
 * be the bare identifier `require` (a member call such as `module.import(...)` is never
 * special-cased) and it must take exactly one string literal (a second argument
 * disables it). Preludes therefore go through `module.import`.
 *
 * The `.js` extension is required -- there is no extension or index resolution.
 *
 * Bound by JsLangDef.globals in jscore-js-runtime.
 */
declare function require(path: string): unknown;

interface JscoreModule {
  /**
   * This module's exported value. Assigning `module.exports = ...` is also what
   * makes TypeScript treat the file as a module, so a `() => import("./x.js")`
   * loader elsewhere resolves to whatever was assigned here.
   */
  exports: any;

  /**
   * Called when the module is unloaded. Write-only in practice: JsModule.getMember
   * currently returns `exports` for this key.
   */
  onunload: (() => void) | undefined;

  /**
   * Load a module and return its `module.exports`, applying preludes.
   *
   * Prefer `require(path)` -- it is plain, and TypeScript types it natively. Reach
   * for this only when you need preludes, which `require` cannot carry.
   *
   * The module is named by a **loader thunk** rather than a path string:
   *
   * ```js
   * const dag = module.import(() => import("../sys/dag.js"), []);
   * ```
   *
   * The thunk is never called. It exists so the specifier is a real `import()`
   * in *this* file, which is the only construct that makes TypeScript resolve a
   * module type relative to the calling file -- `typeof import(P)` for a
   * non-literal `P` is rejected outright (TS1141), so no signature over a path
   * string can ever infer the right type. JsModule.specifierOf reads the
   * specifier back out of the thunk's source text.
   *
   * Paths behave exactly like a normal `import`: relative to this file, or
   * root-absolute against the scripts root (`/` is mapped to the project root by
   * `paths` in jsconfig.json, and Module.importRelative gets the same result
   * because `Path.resolve` returns an absolute argument unchanged).
   *
   * The `.js` extension is required -- there is no extension or index resolution.
   *
   * A plain path string is still accepted by the host for backwards compatibility,
   * but is typed as `unknown` here, since its type cannot be inferred.
   *
   * @param preludes Names of preludes to apply, must match any previous load of the
   * same module. Required: JsModule rejects a one-argument call.
   */
  import<T>(loader: () => Promise<T>, preludes: string[]): JscoreExports<T>;
  import(path: string, preludes: string[]): unknown;
}

declare var module: JscoreModule;
