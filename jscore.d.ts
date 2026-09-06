/**
 * Ambient types for the jscore runtime.
 *
 * Every module is evaluated as a *script* (Source has no module mime type), with a
 * `module` object injected into the global scope by
 * jscore/src/main/java/ws/siri/jscore/runtime/Module.java. Members are backed by
 * JsModule.java in jscore-js-runtime.
 */

interface JscoreModule {
  /**
   * This module's exported value. Assigning `module.exports = ...` is also what
   * makes TypeScript treat the file as a module.
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
   * @param preludes Names of preludes to apply, must match any previous load of the
   * same module. Required: JsModule rejects a one-argument call.
   */
  import(path: string, preludes: string[]): unknown;

  /**
   * Remove this module's dependency on the module at `path`, resolved the same
   * way as `import` -- relative to this file, or root-absolute against the
   * scripts root when the path starts with `/`.
   *
   * The values from the unimported module are undefined behaviour after an
   * unimport.
   */
  unimport(path: string): void;
}

declare var module: JscoreModule;
