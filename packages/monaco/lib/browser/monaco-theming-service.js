var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MonacoThemingService_1;
import { injectable } from 'inversify';
import { Disposable, DisposableCollection } from '@tart/core/lib/common';
import { BuiltinThemeProvider, ThemeService } from '@tart/core/lib/browser/theming';
import { getThemes, putTheme, stateToTheme } from './monaco-indexed-db';
import { MonacoThemeRegistry } from './textmate/monaco-theme-registry';
export const ThemeServiceSymbol = Symbol('ThemeService');
let MonacoThemingService = MonacoThemingService_1 = class MonacoThemingService {
    static get() {
        const global = window; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!global[ThemeServiceSymbol]) {
            const themeService = new ThemeService();
            themeService.register(...BuiltinThemeProvider.themes);
            themeService.startupTheme();
            global[ThemeServiceSymbol] = themeService;
        }
        return global[ThemeServiceSymbol];
    }
    static init() {
        this.updateBodyUiTheme();
        ThemeService.get().onDidColorThemeChange(() => this.updateBodyUiTheme());
        this.restore();
    }
    static doRegister(state) {
        return new DisposableCollection(ThemeService.get().register(stateToTheme(state)), putTheme(state));
    }
    static async restore() {
        try {
            const themes = await getThemes();
            for (const state of themes) {
                MonacoThemeRegistry.SINGLETON.setTheme(state.data.name, state.data);
                MonacoThemingService_1.doRegister(state);
            }
        }
        catch (e) {
            console.error('Failed to restore monaco themes', e);
        }
    }
    static updateBodyUiTheme() {
        this.toUpdateUiTheme.dispose();
        const type = ThemeService.get().getCurrentTheme().type;
        const uiTheme = type === 'hc' ? 'hc-black' : type === 'light' ? 'vs' : 'vs-dark';
        document.body.classList.add(uiTheme);
        this.toUpdateUiTheme.push(Disposable.create(() => document.body.classList.remove(uiTheme)));
    }
};
MonacoThemingService.toUpdateUiTheme = new DisposableCollection();
MonacoThemingService = MonacoThemingService_1 = __decorate([
    injectable()
], MonacoThemingService);
export { MonacoThemingService };

//# sourceMappingURL=../../lib/browser/monaco-theming-service.js.map
