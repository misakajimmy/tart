var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { Registry } from 'vscode-textmate';
import darkTheme from '../../assets/data/monaco-themes/vscode/dark_wm.json';
import darkDefaults from '../../assets/data/monaco-themes/vscode/dark_defaults.json';
import darkVs from '../../assets/data/monaco-themes/vscode/dark_vs.json';
import darkPlus from '../../assets/data/monaco-themes/vscode/dark_plus.json';
import lightTheme from '../../assets/data/monaco-themes/vscode/light_wm.json';
import lightDefaults from '../../assets/data/monaco-themes/vscode/light_defaults.json';
import lightVs from '../../assets/data/monaco-themes/vscode/light_vs.json';
import lightPlus from '../../assets/data/monaco-themes/vscode/light_plus.json';
import hcTheme from '../../assets/data/monaco-themes/vscode/hc_wm.json';
import hcBlackDefault from '../../assets/data/monaco-themes/vscode/hc_black_defaults.json';
import hcBlack from '../../assets/data/monaco-themes/vscode/hc_black.json';
let MonacoThemeRegistry = class MonacoThemeRegistry {
    getThemeData(name) {
        const theme = this.doGetTheme(name);
        return theme && theme.themeData;
    }
    getTheme(name) {
        return this.doGetTheme(name);
    }
    setTheme(name, data) {
        // monaco auto refreshes a theme with new data
        monaco.editor.defineTheme(name, data);
    }
    /**
     * Register VS Code compatible themes
     */
    register(json, includes, givenName, monacoBase) {
        const name = givenName || json.name;
        const result = {
            name,
            base: monacoBase || 'vs',
            inherit: true,
            colors: {},
            rules: [],
            settings: []
        };
        if (typeof json.include !== 'undefined') {
            if (!includes || !includes[json.include]) {
                console.error(`Couldn't resolve includes theme ${json.include}.`);
            }
            else {
                const parentTheme = this.register(includes[json.include], includes);
                Object.assign(result.colors, parentTheme.colors);
                result.rules.push(...parentTheme.rules);
                result.settings.push(...parentTheme.settings);
            }
        }
        const tokenColors = json.tokenColors;
        if (Array.isArray(tokenColors)) {
            for (const tokenColor of tokenColors) {
                if (tokenColor.scope && tokenColor.settings) {
                    result.settings.push({
                        scope: tokenColor.scope,
                        settings: {
                            foreground: this.normalizeColor(tokenColor.settings.foreground),
                            background: this.normalizeColor(tokenColor.settings.background),
                            fontStyle: tokenColor.settings.fontStyle
                        }
                    });
                }
            }
        }
        if (json.colors) {
            Object.assign(result.colors, json.colors);
            result.encodedTokensColors = Object.keys(result.colors).map(key => result.colors[key]);
        }
        if (monacoBase && givenName) {
            for (const setting of result.settings) {
                this.transform(setting, rule => result.rules.push(rule));
            }
            // the default rule (scope empty) is always the first rule. Ignore all other default rules.
            const defaultTheme = monaco.services.StaticServices.standaloneThemeService.get()._knownThemes.get(result.base);
            const foreground = result.colors['editor.foreground'] || defaultTheme.getColor('editor.foreground');
            const background = result.colors['editor.background'] || defaultTheme.getColor('editor.background');
            result.settings.unshift({
                settings: {
                    foreground: this.normalizeColor(foreground),
                    background: this.normalizeColor(background)
                }
            });
            const reg = new Registry();
            reg.setTheme(result);
            result.encodedTokensColors = reg.getColorMap();
            // index 0 has to be set to null as it is 'undefined' by default, but monaco code expects it to be null
            // eslint-disable-next-line no-null/no-null
            result.encodedTokensColors[0] = null;
            this.setTheme(givenName, result);
        }
        return result;
    }
    doGetTheme(name) {
        const standaloneThemeService = monaco.services.StaticServices.standaloneThemeService.get();
        const theme = !name ? standaloneThemeService.getColorTheme() : standaloneThemeService._knownThemes.get(name);
        return theme;
    }
    transform(tokenColor, acceptor) {
        if (typeof tokenColor.scope === 'undefined') {
            tokenColor.scope = [''];
        }
        else if (typeof tokenColor.scope === 'string') {
            tokenColor.scope = tokenColor.scope.split(',').map((scope) => scope.trim());
        }
        for (const scope of tokenColor.scope) {
            acceptor(Object.assign(Object.assign({}, tokenColor.settings), { token: scope }));
        }
    }
    normalizeColor(color) {
        if (!color) {
            return undefined;
        }
        const normalized = String(color).replace(/^\#/, '').slice(0, 6);
        if (normalized.length < 6 || !(normalized).match(/^[0-9A-Fa-f]{6}$/)) {
            // ignoring not normalized colors to avoid breaking token color indexes between monaco and vscode-textmate
            console.error(`Color '${normalized}' is NOT normalized, it must have 6 positions.`);
            return undefined;
        }
        return '#' + normalized;
    }
};
MonacoThemeRegistry = __decorate([
    injectable()
], MonacoThemeRegistry);
export { MonacoThemeRegistry };
(function (MonacoThemeRegistry) {
    MonacoThemeRegistry.SINGLETON = new MonacoThemeRegistry();
    MonacoThemeRegistry.DARK_DEFAULT_THEME = MonacoThemeRegistry.SINGLETON.register(darkTheme, {
        './dark_defaults.json': darkDefaults,
        './dark_vs.json': darkVs,
        './dark_plus.json': darkPlus
    }, 'dark-wm', 'vs-dark').name;
    MonacoThemeRegistry.LIGHT_DEFAULT_THEME = MonacoThemeRegistry.SINGLETON.register(lightTheme, {
        './light_defaults.json': lightDefaults,
        './light_vs.json': lightVs,
        './light_plus.json': lightPlus,
    }, 'light-wm', 'vs').name;
    MonacoThemeRegistry.HC_DEFAULT_THEME = MonacoThemeRegistry.SINGLETON.register(hcTheme, {
        './hc_black_defaults.json': hcBlackDefault,
        './hc_black.json': hcBlack
    }, 'hc-wm', 'hc-black').name;
})(MonacoThemeRegistry || (MonacoThemeRegistry = {}));

//# sourceMappingURL=../../../lib/browser/textmate/monaco-theme-registry.js.map
