import { Disposable, DisposableCollection } from '@tart/core/lib/common';
import { ThemeService } from '@tart/core/lib/browser/theming';
import { MonacoThemeState } from './monaco-indexed-db';
export declare const ThemeServiceSymbol: unique symbol;
export declare class MonacoThemingService {
    protected static toUpdateUiTheme: DisposableCollection;
    static get(): ThemeService;
    static init(): void;
    protected static doRegister(state: MonacoThemeState): Disposable;
    protected static restore(): Promise<void>;
    protected static updateBodyUiTheme(): void;
}
