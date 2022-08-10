import {injectable} from 'inversify';
import {Disposable, DisposableCollection} from '@tartjs/core/lib/common';
import {BuiltinThemeProvider, ThemeService} from '@tartjs/core/lib/browser/theming';
import {getThemes, MonacoThemeState, putTheme, stateToTheme} from './monaco-indexed-db';
import {MonacoThemeRegistry} from './textmate/monaco-theme-registry';

export const ThemeServiceSymbol = Symbol('ThemeService');

@injectable()
export class MonacoThemingService {

    protected static toUpdateUiTheme = new DisposableCollection();

    static get(): ThemeService {
        const global = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!global[ThemeServiceSymbol]) {
            const themeService = new ThemeService();
            themeService.register(...BuiltinThemeProvider.themes);
            themeService.startupTheme();
            global[ThemeServiceSymbol] = themeService;
        }
        return global[ThemeServiceSymbol];
    }

    static init(): void {
        this.updateBodyUiTheme();
        ThemeService.get().onDidColorThemeChange(() => this.updateBodyUiTheme());
        this.restore();
    }

    protected static doRegister(state: MonacoThemeState): Disposable {
        return new DisposableCollection(
            ThemeService.get().register(stateToTheme(state)),
            putTheme(state)
        );
    }

    protected static async restore(): Promise<void> {
        try {
            const themes = await getThemes();
            for (const state of themes) {
                MonacoThemeRegistry.SINGLETON.setTheme(state.data.name!, state.data);
                MonacoThemingService.doRegister(state);
            }
        } catch (e) {
            console.error('Failed to restore monaco themes', e);
        }
    }

    protected static updateBodyUiTheme(): void {
        this.toUpdateUiTheme.dispose();
        const type = ThemeService.get().getCurrentTheme().type;
        const uiTheme: monaco.editor.BuiltinTheme = type === 'hc' ? 'hc-black' : type === 'light' ? 'vs' : 'vs-dark';
        document.body.classList.add(uiTheme);
        this.toUpdateUiTheme.push(Disposable.create(() => document.body.classList.remove(uiTheme)));
    }
}
