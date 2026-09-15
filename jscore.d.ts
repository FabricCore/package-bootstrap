interface JscorePrelude {
    readonly __jscorePrelude: never;
}

interface JscoreModule {
    exports: JscoreExports;
    onunload: (() => void) | undefined;
    readonly path: string;
    import(path: string, preludes: JscorePrelude[]): unknown;
    unimport(path: string): void;
    createPrelude(
        handler: (targetGlobal: Record<string, any>, targetModule: Module) => void,
    ): JscorePrelude;
}
type JscoreExports =
    | { prelude?: JscorePrelude;[key: string]: any }
    | string | number | boolean | bigint | symbol | null | undefined;

declare var module: JscoreModule;
