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
import { Emitter } from '../common';
import { Disposable } from '../common/disposable';
import darkCss from '../assets/style/variables-dark.useable.css';
import lightCss from '../assets/style/variables-bright.useable.css';
/**
 * @deprecated since 1.20.0. Import from `@tart/core/lib/common/theme` instead.
 */
export * from '../common/theme';
export const ThemeServiceSymbol = Symbol('ThemeService');
export class ThemeService {
    themes = {};
    activeTheme;
    themeChange = new Emitter();
    onDidColorThemeChange = this.themeChange.event;
    /**
     * The default theme. If that is not applicable, returns with the fallback theme.
     */
    get defaultTheme() {
        return this.themes['dark'] || this.themes['dark'];
    }
    get getAllThemes() {
        return this.themes;
    }
    static get() {
        const global = window;
        if (!global[ThemeServiceSymbol]) {
            const themeService = new ThemeService();
            themeService.register(...BuiltinThemeProvider.themes);
            themeService.startupTheme();
            global[ThemeServiceSymbol] = themeService;
        }
        return global[ThemeServiceSymbol];
    }
    register(...themes) {
        for (const theme of themes) {
            this.themes[theme.id] = theme;
        }
        this.validateActiveTheme();
        return Disposable.create(() => {
            for (const theme of themes) {
                delete this.themes[theme.id];
            }
            this.validateActiveTheme();
        });
    }
    getThemes() {
        const result = [];
        for (const o in this.themes) {
            if (this.themes.hasOwnProperty(o)) {
                result.push(this.themes[o]);
            }
        }
        return result;
    }
    getTheme(themeId) {
        return this.themes[themeId];
    }
    startupTheme() {
        const theme = this.getCurrentTheme();
        // console.log(theme);
        theme.activate();
    }
    loadUserTheme() {
        const theme = this.getCurrentTheme();
        this.setCurrentTheme(theme.id);
    }
    setCurrentTheme(themeId) {
        const newTheme = this.getTheme(themeId);
        const oldTheme = this.activeTheme;
        if (oldTheme) {
            if (oldTheme.id === newTheme.id) {
                return;
            }
            oldTheme.deactivate();
        }
        newTheme.activate();
        this.activeTheme = newTheme;
        window.localStorage.setItem('theme', themeId);
        this.themeChange.fire({
            newTheme, oldTheme
        });
    }
    getCurrentTheme() {
        const themeId = window.localStorage.getItem('theme') || this.defaultTheme.id;
        return this.getTheme(themeId);
    }
    /**
     * Resets the state to the user's default, or to the fallback theme. Also discards any persisted state in the local storage.
     */
    reset() {
        // this.setCurrentTheme(this.defaultTheme.id);
    }
    validateActiveTheme() {
        if (!this.activeTheme) {
            return;
        }
        const theme = this.themes[this.activeTheme.id];
        if (!theme) {
            this.loadUserTheme();
        }
        else if (theme !== this.activeTheme) {
            this.activeTheme = undefined;
            this.setCurrentTheme(theme.id);
        }
    }
}
export class BuiltinThemeProvider {
    static darkCss = darkCss;
    static lightCss = lightCss;
    // Webpack converts these `require` in some Javascript object that wraps the `.css` files
    static darkTheme = {
        id: 'dark',
        type: 'dark',
        label: 'Dark (Tart)',
        editorTheme: 'dark-tart',
        activate() {
            BuiltinThemeProvider.darkCss.use();
        },
        deactivate() {
            BuiltinThemeProvider.darkCss.unuse();
        }
    };
    static lightTheme = {
        id: 'light',
        type: 'light',
        label: 'Light (Tart)',
        editorTheme: 'light-tart',
        activate() {
            BuiltinThemeProvider.lightCss.use();
        },
        deactivate() {
            BuiltinThemeProvider.lightCss.unuse();
        }
    };
    static hcTheme = {
        id: 'hc-tart',
        type: 'hc',
        label: 'High Contrast (Tart)',
        editorTheme: 'hc-tart',
        activate() {
            BuiltinThemeProvider.darkCss.use();
        },
        deactivate() {
            BuiltinThemeProvider.darkCss.unuse();
        }
    };
    static themes = [
        this.darkTheme,
        this.lightTheme,
        this.hcTheme
    ];
}

//# sourceMappingURL=../../lib/browser/theming.js.map
