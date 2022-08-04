/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Emitter, Event } from '../common';
import { Disposable } from '../common/disposable';
import { Theme, ThemeChangeEvent } from '../common/theme';
/**
 * @deprecated since 1.20.0. Import from `@tart/core/lib/common/theme` instead.
 */
export * from '../common/theme';
export declare const ThemeServiceSymbol: unique symbol;
export declare class ThemeService {
    protected themes: {
        [id: string]: Theme;
    };
    protected activeTheme: Theme | undefined;
    protected readonly themeChange: Emitter<ThemeChangeEvent>;
    readonly onDidColorThemeChange: Event<ThemeChangeEvent>;
    /**
     * The default theme. If that is not applicable, returns with the fallback theme.
     */
    get defaultTheme(): Theme;
    get getAllThemes(): {
        [id: string]: Theme;
    };
    static get(): ThemeService;
    register(...themes: Theme[]): Disposable;
    getThemes(): Theme[];
    getTheme(themeId: string): Theme;
    startupTheme(): void;
    loadUserTheme(): void;
    setCurrentTheme(themeId: string): void;
    getCurrentTheme(): Theme;
    /**
     * Resets the state to the user's default, or to the fallback theme. Also discards any persisted state in the local storage.
     */
    reset(): void;
    protected validateActiveTheme(): void;
}
export declare class BuiltinThemeProvider {
    static readonly darkCss: any;
    static readonly lightCss: any;
    static readonly darkTheme: Theme;
    static readonly lightTheme: Theme;
    static readonly hcTheme: Theme;
    static readonly themes: Theme[];
}
