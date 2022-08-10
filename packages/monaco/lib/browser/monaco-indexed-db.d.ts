/// <reference types="@theia/monaco-editor-core/monaco" />
import * as idb from 'idb';
import { Disposable } from '@tart/core/lib/common';
import { Theme, ThemeService } from '@tart/core/lib/browser/theming';
declare type ThemeMix = import('./textmate/monaco-theme-registry').ThemeMix;
export declare const monacoDB: Promise<idb.IDBPDatabase<unknown>>;
export interface MonacoThemeState {
    id: string;
    label: string;
    description?: string;
    uiTheme: monaco.editor.BuiltinTheme;
    data: ThemeMix;
}
export declare namespace MonacoThemeState {
    function is(state: Object | undefined): state is MonacoThemeState;
}
export declare function getThemes(): Promise<MonacoThemeState[]>;
export declare function putTheme(state: MonacoThemeState): Disposable;
export declare function deleteTheme(id: string): Promise<void>;
export declare function stateToTheme(state: MonacoThemeState): Theme;
export declare class ThemeServiceWithDB extends ThemeService {
    static get(): ThemeService;
    loadUserTheme(): void;
    protected loadUserThemeWithDB(): Promise<void>;
}
export {};
