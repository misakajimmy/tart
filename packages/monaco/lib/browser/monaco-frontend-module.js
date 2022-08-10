import '../assets/style/index.css';
// import '../assets/style/symbol-icons.css';
// import '../assets/style/symbol-icons.svg';
import { ContainerModule, decorate, injectable } from 'inversify';
import { ColorRegistry } from '@tart/core/lib/browser/color-registry';
import { QuickInputService } from '@tart/core/lib/common/quick-pick-service';
import { bindContributionProvider, CommandContribution, MenuContribution } from '@tart/core/lib/common';
import { MonacoColorRegistry } from './monaco-color-registry';
import { MonacoThemingService } from './monaco-theming-service';
import MonacoTextmateModuleBinder from './textmate/monaco-textmate-frontend-bindings';
import { MonacoQuickInputImplementation, MonacoQuickInputService } from './monaco-quick-input-service';
import { MonacoEditorFactory, MonacoEditorProvider } from './monaco-editor-provider';
import { MonacoEditorCommandHandlers } from './monaco-command';
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ContextKeyService, createPreferenceProxy, KeybindingContribution, OVERRIDE_PROPERTY_PATTERN, PreferenceSchemaProvider, PreferenceScope, PreferenceService, QuickAccessContribution, QuickAccessRegistry } from '@tart/core';
import { MonacoKeybindingContribution } from './monaco-keybinding';
import { MonacoCommandRegistry } from './monaco-command-registry';
import { MonacoEditorModelFactory, MonacoTextModelService } from './monaco-text-model-service';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { MonacoContextMenuService } from './monaco-context-menu';
import { MonacoEditorServices } from './monaco-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { MonacoCommandService, MonacoCommandServiceFactory } from './monaco-command-service';
import { MonacoContextKeyService } from './monaco-context-key-service';
import { MonacoBulkEditService } from './monaco-bulk-edit-service';
import { MonacoQuickAccessRegistry } from './monaco-quick-access-registry';
import { MonacoLanguages } from './monaco-languages';
import { LanguageService } from '@tart/core/lib/browser/language-service';
import { WorkspaceSymbolCommand } from './workspace-symbol-command';
import { TextEditorProvider } from '@tart/editor/lib/browser/editor';
import { DiffNavigatorProvider } from '@tart/editor/lib/browser/diff-navigator';
decorate(injectable(), monaco.contextKeyService.ContextKeyService);
MonacoThemingService.init();
export const MonacoFrontendModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(MonacoThemingService).toSelf().inSingletonScope();
    bind(MonacoContextKeyService).toSelf().inSingletonScope();
    rebind(ContextKeyService).toService(MonacoContextKeyService);
    bind(MonacoCommandRegistry).toSelf().inSingletonScope();
    bind(MonacoConfigurationService).toDynamicValue(({ container }) => createMonacoConfigurationService(container)).inSingletonScope();
    bind(monaco.contextKeyService.ContextKeyService).toDynamicValue(({ container }) => new monaco.contextKeyService.ContextKeyService(container.get(MonacoConfigurationService))).inSingletonScope();
    bind(MonacoToProtocolConverter).toSelf().inSingletonScope();
    bind(ProtocolToMonacoConverter).toSelf().inSingletonScope();
    bind(MonacoLanguages).toSelf().inSingletonScope();
    rebind(LanguageService).toService(MonacoLanguages);
    bind(WorkspaceSymbolCommand).toSelf().inSingletonScope();
    for (const identifier of [CommandContribution, KeybindingContribution, MenuContribution, QuickAccessContribution]) {
        bind(identifier).toService(WorkspaceSymbolCommand);
    }
    bind(MonacoBulkEditService).toSelf().inSingletonScope();
    bind(MonacoEditorService).toSelf().inSingletonScope();
    bind(MonacoTextModelService).toSelf().inSingletonScope();
    bind(MonacoContextMenuService).toSelf().inSingletonScope();
    bind(MonacoEditorServices).toSelf().inSingletonScope();
    bind(MonacoEditorProvider).toSelf().inSingletonScope();
    bindContributionProvider(bind, MonacoEditorFactory);
    bindContributionProvider(bind, MonacoEditorModelFactory);
    bind(MonacoCommandService).toSelf().inTransientScope();
    bind(MonacoCommandServiceFactory).toAutoFactory(MonacoCommandService);
    bind(TextEditorProvider).toProvider(context => uri => context.container.get(MonacoEditorProvider).get(uri));
    bind(MonacoQuickAccessRegistry).toSelf().inSingletonScope();
    bind(QuickAccessRegistry).toService(MonacoQuickAccessRegistry);
    bind(MonacoDiffNavigatorFactory).toSelf().inSingletonScope();
    bind(DiffNavigatorProvider).toFactory(context => editor => context.container.get(MonacoEditorProvider).getDiffNavigator(editor));
    bind(CommandContribution).to(MonacoEditorCommandHandlers).inSingletonScope();
    bind(MonacoColorRegistry).toSelf().inSingletonScope();
    rebind(ColorRegistry).toService(MonacoColorRegistry);
    MonacoTextmateModuleBinder(bind, unbind, isBound, rebind);
    bind(MonacoKeybindingContribution).toSelf().inSingletonScope();
    bind(KeybindingContribution).toService(MonacoKeybindingContribution);
    bind(MonacoQuickInputImplementation).toSelf().inSingletonScope();
    bind(MonacoQuickInputService).toSelf().inSingletonScope();
    bind(QuickInputService).toService(MonacoQuickInputService);
});
export const MonacoConfigurationService = Symbol('MonacoConfigurationService');
export function createMonacoConfigurationService(container) {
    const preferences = container.get(PreferenceService);
    const preferenceSchemaProvider = container.get(PreferenceSchemaProvider);
    const service = monaco.services.StaticServices.configurationService.get();
    const _configuration = service._configuration;
    _configuration.getValue = (section, overrides) => {
        const overrideIdentifier = overrides && 'overrideIdentifier' in overrides && overrides['overrideIdentifier'] || undefined;
        const resourceUri = overrides && 'resource' in overrides && !!overrides['resource'] && overrides['resource'].toString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proxy = createPreferenceProxy(preferences, preferenceSchemaProvider.getCombinedSchema(), {
            resourceUri, overrideIdentifier, style: 'both'
        });
        if (section) {
            return proxy[section];
        }
        return proxy;
    };
    const toTarget = (scope) => {
        switch (scope) {
            case PreferenceScope.Default:
                return 6 /* monaco.services.ConfigurationTarget.DEFAULT */;
            // case PreferenceScope.User:
            //     return monaco.services.ConfigurationTarget.USER;
            // case PreferenceScope.Workspace:
            //     return monaco.services.ConfigurationTarget.WORKSPACE;
            // case PreferenceScope.Folder:
            //     return monaco.services.ConfigurationTarget.WORKSPACE_FOLDER;
        }
    };
    const newFireDidChangeConfigurationContext = () => ({
        changes: [],
        affectedKeys: new Set(),
        keys: new Set(),
        overrides: new Map()
    });
    const fireDidChangeConfiguration = (source, context) => {
        if (!context.affectedKeys.size) {
            return;
        }
        const overrides = [];
        for (const [override, values] of context.overrides) {
            overrides.push([override, [...values]]);
        }
        service._onDidChangeConfiguration.fire({
            change: {
                keys: [...context.keys],
                overrides
            },
            affectedKeys: [...context.affectedKeys],
            source,
            affectsConfiguration: (prefix, options) => {
                var _a;
                if (!context.affectedKeys.has(prefix)) {
                    return false;
                }
                for (const change of context.changes) {
                    const overridden = preferences.overriddenPreferenceName(change.preferenceName);
                    const preferenceName = overridden ? overridden.preferenceName : change.preferenceName;
                    if (preferenceName.startsWith(prefix)) {
                        if ((options === null || options === void 0 ? void 0 : options.overrideIdentifier) !== undefined) {
                            if (overridden && overridden.overrideIdentifier !== (options === null || options === void 0 ? void 0 : options.overrideIdentifier)) {
                                continue;
                            }
                        }
                        if (change.affects((_a = options === null || options === void 0 ? void 0 : options.resource) === null || _a === void 0 ? void 0 : _a.toString())) {
                            return true;
                        }
                    }
                }
                return false;
            }
        });
    };
    preferences.onPreferencesChanged(event => {
        var _a;
        let source;
        let context = newFireDidChangeConfigurationContext();
        for (let key of Object.keys(event)) {
            const change = event[key];
            const target = toTarget(change.scope);
            if (source !== undefined && target !== source) {
                fireDidChangeConfiguration(source, context);
                context = newFireDidChangeConfigurationContext();
            }
            context.changes.push(change);
            source = target;
            let overrideKeys;
            if (key.startsWith('[')) {
                const index = key.indexOf('.');
                const override = key.substring(0, index);
                const overrideIdentifier = (_a = override.match(OVERRIDE_PROPERTY_PATTERN)) === null || _a === void 0 ? void 0 : _a[1];
                if (overrideIdentifier) {
                    context.keys.add(override);
                    context.affectedKeys.add(override);
                    overrideKeys = context.overrides.get(overrideIdentifier) || new Set();
                    context.overrides.set(overrideIdentifier, overrideKeys);
                    key = key.substring(index + 1);
                }
            }
            while (key) {
                if (overrideKeys) {
                    overrideKeys.add(key);
                }
                context.keys.add(key);
                context.affectedKeys.add(key);
                const index = key.lastIndexOf('.');
                key = key.substring(0, index);
            }
        }
        if (source) {
            fireDidChangeConfiguration(source, context);
        }
    });
    return service;
}

//# sourceMappingURL=../../lib/browser/monaco-frontend-module.js.map
