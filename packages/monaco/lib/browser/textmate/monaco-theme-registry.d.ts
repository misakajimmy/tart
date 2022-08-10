/// <reference types="@theia/monaco-editor-core/monaco" />
import { IRawTheme } from 'vscode-textmate';
export interface ThemeMix extends IRawTheme, monaco.editor.IStandaloneThemeData {
}
export interface MixStandaloneTheme extends monaco.services.IStandaloneTheme {
    themeData: ThemeMix;
}
export declare class MonacoThemeRegistry {
    getThemeData(): ThemeMix;
    getThemeData(name: string): ThemeMix | undefined;
    getTheme(): MixStandaloneTheme;
    getTheme(name: string): MixStandaloneTheme | undefined;
    setTheme(name: string, data: ThemeMix): void;
    /**
     * Register VS Code compatible themes
     */
    register(json: any, includes?: {
        [includePath: string]: any;
    }, givenName?: string, monacoBase?: monaco.editor.BuiltinTheme): ThemeMix;
    protected doGetTheme(name: string | undefined): MixStandaloneTheme | undefined;
    protected transform(tokenColor: any, acceptor: (rule: monaco.editor.ITokenThemeRule) => void): void;
    protected normalizeColor(color: string | monaco.color.Color | undefined): string | undefined;
}
export declare namespace MonacoThemeRegistry {
    const SINGLETON: MonacoThemeRegistry;
    const DARK_DEFAULT_THEME: string;
    const LIGHT_DEFAULT_THEME: string;
    const HC_DEFAULT_THEME: string;
}
