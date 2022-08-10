import * as idb from 'idb';
import { Disposable, DisposableCollection } from '@tart/core/lib/common';
import { BuiltinThemeProvider, ThemeService, ThemeServiceSymbol } from '@tart/core/lib/browser/theming';
// type ThemeMix = import('./textmate/monaco-theme-registry').ThemeMix;
let _monacoDB;
if ('indexedDB' in window) {
    _monacoDB = idb.openDB('wm-monaco', 1, {
        upgrade: db => {
            if (!db.objectStoreNames.contains('themes')) {
                db.createObjectStore('themes', { keyPath: 'id' });
            }
        }
    });
}
export const monacoDB = _monacoDB;
export var MonacoThemeState;
(function (MonacoThemeState) {
    function is(state) {
        return !!state && typeof state === 'object' && 'id' in state && 'label' in state && 'uiTheme' in state && 'data' in state;
    }
    MonacoThemeState.is = is;
})(MonacoThemeState || (MonacoThemeState = {}));
export async function getThemes() {
    if (!monacoDB) {
        return [];
    }
    const db = await monacoDB;
    const result = await db.transaction('themes', 'readonly').objectStore('themes').getAll();
    return result.filter(MonacoThemeState.is);
}
export function putTheme(state) {
    const toDispose = new DisposableCollection(Disposable.create(() => {
    }));
    doPutTheme(state, toDispose);
    return toDispose;
}
async function doPutTheme(state, toDispose) {
    if (!monacoDB) {
        return;
    }
    const db = await monacoDB;
    if (toDispose.disposed) {
        return;
    }
    const id = state.id;
    await db.transaction('themes', 'readwrite').objectStore('themes').put(state);
    if (toDispose.disposed) {
        await deleteTheme(id);
        return;
    }
    toDispose.push(Disposable.create(() => deleteTheme(id)));
}
export async function deleteTheme(id) {
    if (!monacoDB) {
        return;
    }
    const db = await monacoDB;
    await db.transaction('themes', 'readwrite').objectStore('themes').delete(id);
}
export function stateToTheme(state) {
    const { id, label, description, uiTheme, data } = state;
    const type = uiTheme === 'vs' ? 'light' : uiTheme === 'vs-dark' ? 'dark' : 'hc';
    const builtInTheme = uiTheme === 'vs' ? BuiltinThemeProvider.lightCss : BuiltinThemeProvider.darkCss;
    return {
        type,
        id,
        label,
        description,
        editorTheme: data.name,
        activate() {
            builtInTheme.use();
        },
        deactivate() {
            builtInTheme.unuse();
        }
    };
}
async function getThemeFromDB(id) {
    const matchingState = (await getThemes()).find(theme => theme.id === id);
    return matchingState && stateToTheme(matchingState);
}
export class ThemeServiceWithDB extends ThemeService {
    static get() {
        const global = window; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!global[ThemeServiceSymbol]) {
            const themeService = new ThemeServiceWithDB();
            themeService.register(...BuiltinThemeProvider.themes);
            themeService.startupTheme();
            global[ThemeServiceSymbol] = themeService;
        }
        return global[ThemeServiceSymbol];
    }
    loadUserTheme() {
        this.loadUserThemeWithDB();
    }
    async loadUserThemeWithDB() {
        var _a, _b;
        const themeId = window.localStorage.getItem('theme') || this.defaultTheme.id;
        const theme = (_b = (_a = this.themes[themeId]) !== null && _a !== void 0 ? _a : await getThemeFromDB(themeId)) !== null && _b !== void 0 ? _b : this.defaultTheme;
        this.setCurrentTheme(theme.id);
    }
}
ThemeService.get = ThemeServiceWithDB.get;

//# sourceMappingURL=../../lib/browser/monaco-indexed-db.js.map
