export declare type RequiredRecursive<T> = {
    [K in keyof T]-?: T[K] extends object ? RequiredRecursive<T[K]> : T[K];
};
/**
 * Base configuration for the tart application.
 */
export interface ApplicationConfig {
    readonly [key: string]: any;
}
export declare type FrontendApplicationConfig = RequiredRecursive<FrontendApplicationConfig.Partial>;
export declare namespace FrontendApplicationConfig {
    const DEFAULT: FrontendApplicationConfig;
    interface Partial extends ApplicationConfig {
        /**
         * The default theme for the application.
         *
         * Defaults to `dark`.
         */
        readonly defaultTheme?: string;
        /**
         * The default icon theme for the application.
         *
         * Defaults to `none`.
         */
        readonly defaultIconTheme?: string;
        /**
         * The name of the application.
         *
         * Defaults to `Eclipse tart`.
         */
        readonly applicationName?: string;
    }
}
