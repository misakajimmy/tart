export type RequiredRecursive<T> = {
  [K in keyof T]-?: T[K] extends object ? RequiredRecursive<T[K]> : T[K]
};

/**
 * Base configuration for the tart application.
 */
export interface ApplicationConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [key: string]: any;
}

export type FrontendApplicationConfig = RequiredRecursive<FrontendApplicationConfig.Partial>;
export namespace FrontendApplicationConfig {
  export const DEFAULT: FrontendApplicationConfig = {
    applicationName: 'Waffle Maker',
    defaultTheme: 'dark',
    defaultIconTheme: 'none',
  };

  export interface Partial extends ApplicationConfig {

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
