declare module '@mappable-world/mappable-types/import' {
    interface Import {
        (pkg: '@mappable-world/mappable-hint'): Promise<typeof import('./index')>;
    }
}

export {};
