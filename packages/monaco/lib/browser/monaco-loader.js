export function loadMonaco(vsRequire) {
    return new Promise(resolve => {
        vsRequire(['vs/editor/editor.main'], () => {
            vsRequire([
                'vs/platform/commands/common/commands',
                'vs/platform/actions/common/actions',
                'vs/platform/keybinding/common/keybindingsRegistry',
                'vs/platform/keybinding/common/keybindingResolver',
                'vs/platform/keybinding/common/usLayoutResolvedKeybinding',
                'vs/base/common/keybindingLabels',
                'vs/base/common/keyCodes',
                'vs/base/common/mime',
                'vs/editor/browser/editorExtensions',
                'vs/editor/standalone/browser/simpleServices',
                'vs/editor/standalone/browser/standaloneServices',
                'vs/editor/standalone/browser/standaloneLanguages',
                'vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess',
                'vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess',
                'vs/base/parts/quickinput/browser/quickInput',
                'vs/platform/quickinput/browser/quickInput',
                'vs/platform/quickinput/common/quickAccess',
                'vs/platform/quickinput/browser/quickAccess',
                'vs/platform/quickinput/browser/pickerQuickAccess',
                'vs/base/browser/ui/list/listWidget',
                'vs/platform/registry/common/platform',
                'vs/base/common/filters',
                'vs/platform/theme/common/themeService',
                'vs/platform/theme/common/styler',
                'vs/platform/theme/common/colorRegistry',
                'vs/base/common/color',
                'vs/base/common/platform',
                'vs/editor/common/modes',
                'vs/editor/contrib/suggest/suggest',
                'vs/editor/contrib/snippet/snippetParser',
                'vs/editor/contrib/format/format',
                'vs/platform/configuration/common/configuration',
                'vs/platform/configuration/common/configurationModels',
                'vs/editor/common/services/resolverService',
                'vs/editor/browser/services/codeEditorService',
                'vs/editor/browser/services/codeEditorServiceImpl',
                'vs/editor/browser/services/openerService',
                'vs/platform/markers/common/markerService',
                'vs/platform/contextkey/common/contextkey',
                'vs/platform/contextkey/browser/contextKeyService',
                'vs/editor/common/model/wordHelper',
                'vs/base/common/errors',
                'vs/base/common/path',
                'vs/editor/common/model/textModel',
                'vs/base/common/strings',
                'vs/base/common/async'
            ], (commands, actions, keybindingsRegistry, keybindingResolver, resolvedKeybinding, keybindingLabels, keyCodes, mime, editorExtensions, simpleServices, standaloneServices, standaloneLanguages, standaloneGotoLineQuickAccess, standaloneGotoSymbolQuickAccess, quickInput, quickInputPlatform, quickAccess, quickAccessBrowser, pickerQuickAccess, listWidget, // helpQuickAccess: any, commandsQuickAccess: any,
            platformRegistry, filters, themeService, styler, colorRegistry, color, platform, modes, suggest, snippetParser, format, configuration, configurationModels, resolverService, codeEditorService, codeEditorServiceImpl, openerService, markerService, contextKey, contextKeyService, wordHelper, error, path, textModel, strings, async) => {
                const global = self;
                global.monaco.commands = commands;
                global.monaco.actions = actions;
                global.monaco.keybindings = Object.assign({}, keybindingsRegistry, keybindingResolver, resolvedKeybinding, keybindingLabels, keyCodes);
                global.monaco.services = Object.assign({}, simpleServices, standaloneServices, standaloneLanguages, configuration, configurationModels, resolverService, codeEditorService, codeEditorServiceImpl, markerService, openerService);
                console.log(quickAccess);
                global.monaco.quickInput = Object.assign({}, quickInput, quickAccess, quickAccessBrowser, quickInputPlatform, pickerQuickAccess, standaloneGotoLineQuickAccess, standaloneGotoSymbolQuickAccess);
                global.monaco.filters = filters;
                global.monaco.theme = Object.assign({}, themeService, styler);
                global.monaco.color = Object.assign({}, colorRegistry, color);
                global.monaco.platform = Object.assign({}, platform, platformRegistry);
                global.monaco.editorExtensions = editorExtensions;
                global.monaco.modes = modes;
                global.monaco.suggest = suggest;
                global.monaco.snippetParser = snippetParser;
                global.monaco.format = format;
                global.monaco.contextkey = contextKey;
                global.monaco.contextKeyService = contextKeyService;
                global.monaco.mime = mime;
                global.monaco.wordHelper = wordHelper;
                global.monaco.error = error;
                global.monaco.path = path;
                global.monaco.textModel = textModel;
                global.monaco.strings = strings;
                global.monaco.async = async;
                global.monaco.list = listWidget;
                resolve();
            });
        });
    });
}
export function clearMonacoQuickAccessProviders() {
    const registry = monaco.platform.Registry.as('workbench.contributions.quickaccess');
    // Clear Monaco QuickAccessRegistry as it currently includes monaco internal providers and not Wm's providers
    registry.clear();
}
export function loadVsRequire(context) {
    // Monaco uses a custom amd loader that over-rides node's require.
    // Keep a reference to an original require so we can restore it after executing the amd loader file.
    const originalRequire = context.require;
    return new Promise(resolve => {
        if (document.readyState === 'loading') {
            window.addEventListener('load', attachVsLoader, { once: true });
        }
        else {
            attachVsLoader();
        }
        function attachVsLoader() {
            const vsLoader = document.createElement('script');
            vsLoader.type = 'text/javascript';
            vsLoader.src = 'vs/loader.js';
            vsLoader.charset = 'utf-8';
            vsLoader.addEventListener('load', () => {
                // Save Monaco's amd require and restore the original require
                const amdRequire = context.require;
                if (originalRequire) {
                    context.require = originalRequire;
                }
                resolve(amdRequire);
            });
            document.body.appendChild(vsLoader);
        }
    });
}

//# sourceMappingURL=../../lib/browser/monaco-loader.js.map
