var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, named } from 'inversify';
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoEditor, MonacoEditorServices } from './monaco-editor';
import URI from '@tart/core/lib/common/uri';
import { MonacoCommandServiceFactory } from './monaco-command-service';
import { ContributionProvider, deepClone, Disposable, DisposableCollection } from '@tart/core/lib/common';
import { DiffUris, KeybindingRegistry, open, OpenerService } from '@tart/core';
import { MonacoTextModelService } from './monaco-text-model-service';
import { MonacoContextMenuService } from './monaco-context-menu';
import { MonacoBulkEditService } from './monaco-bulk-edit-service';
import { EditorPreferences } from '@tart/editor';
import { MonacoQuickInputImplementation } from './monaco-quick-input-service';
import { MonacoResolvedKeybinding } from './monaco-resolved-keybinding';
import { TextDocumentSaveReason } from 'vscode-languageserver-protocol';
import { MonacoDiffEditor } from './monaco-diff-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
export const MonacoEditorFactory = Symbol('MonacoEditorFactory');
let MonacoEditorProvider = class MonacoEditorProvider {
    constructor(codeEditorService, textModelService, contextMenuService, m2p, p2m, diffNavigatorFactory, editorPreferences, commandServiceFactory, contextKeyService) {
        this.codeEditorService = codeEditorService;
        this.textModelService = textModelService;
        this.contextMenuService = contextMenuService;
        this.m2p = m2p;
        this.p2m = p2m;
        this.diffNavigatorFactory = diffNavigatorFactory;
        this.editorPreferences = editorPreferences;
        this.commandServiceFactory = commandServiceFactory;
        this.contextKeyService = contextKeyService;
        const staticServices = monaco.services.StaticServices;
        const init = staticServices.init.bind(monaco.services.StaticServices);
        monaco.services.StaticServices.init = o => {
            const result = init(o);
            result[0].set(monaco.services.ICodeEditorService, codeEditorService);
            return result;
        };
    }
    /**
     * Returns the last focused MonacoEditor.
     * It takes into account inline editors as well.
     * If you are interested only in standalone editors then use `MonacoEditor.getCurrent(EditorManager)`
     */
    get current() {
        return this._current;
    }
    get preferencePrefixes() {
        return ['editor.'];
    }
    get diffPreferencePrefixes() {
        return [...this.preferencePrefixes, 'diffEditor.'];
    }
    async get(uri) {
        await this.editorPreferences.ready;
        return this.doCreateEditor(uri, (override, toDispose) => this.createEditor(uri, override, toDispose));
    }
    getDiffNavigator(editor) {
        if (editor instanceof MonacoDiffEditor) {
            return editor.diffNavigator;
        }
        return MonacoDiffNavigatorFactory.nullNavigator;
    }
    async doCreateEditor(uri, factory) {
        const commandService = this.commandServiceFactory();
        const domNode = document.createElement('div');
        const contextKeyService = this.contextKeyService.createScoped(domNode);
        const { codeEditorService, textModelService, contextMenuService } = this;
        const IWorkspaceEditService = this.bulkEditService;
        const toDispose = new DisposableCollection(commandService);
        const openerService = new monaco.services.OpenerService(codeEditorService, commandService);
        openerService.registerOpener({
            open: (u, options) => this.interceptOpen(u, options)
        });
        const editor = await factory({
            codeEditorService,
            textModelService,
            contextMenuService,
            commandService,
            IWorkspaceEditService,
            contextKeyService,
            openerService,
            quickInputService: this.quickInputService
        }, toDispose);
        editor.onDispose(() => toDispose.dispose());
        this.suppressMonacoKeybindingListener(editor);
        this.injectKeybindingResolver(editor);
        const standaloneCommandService = new monaco.services.StandaloneCommandService(editor.instantiationService);
        commandService.setDelegate(standaloneCommandService);
        toDispose.push(this.installReferencesController(editor));
        toDispose.push(editor.onFocusChanged(focused => {
            if (focused) {
                this._current = editor;
            }
        }));
        toDispose.push(Disposable.create(() => {
            if (this._current === editor) {
                this._current = undefined;
            }
        }));
        return editor;
    }
    injectKeybindingResolver(editor) {
        const keybindingService = editor.getControl()._standaloneKeybindingService;
        keybindingService.resolveKeybinding = keybinding => [new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry)];
        keybindingService.resolveKeyboardEvent = keyboardEvent => {
            const keybinding = new monaco.keybindings.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toChord();
            return new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry);
        };
    }
    createEditor(uri, override, toDispose) {
        if (DiffUris.isDiffUri(uri)) {
            return this.createMonacoDiffEditor(uri, override, toDispose);
        }
        return this.createMonacoEditor(uri, override, toDispose);
    }
    async createMonacoEditor(uri, override, toDispose) {
        const model = await this.getModel(uri, toDispose);
        const options = this.createMonacoEditorOptions(model);
        const factory = this.factories.getContributions().find(({ scheme }) => uri.scheme === scheme);
        const editor = factory
            ? factory.create(model, options, override)
            : new MonacoEditor(uri, model, document.createElement('div'), this.services, options, override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => {
            if (event.affects(uri.toString(), model.languageId)) {
                this.updateMonacoEditorOptions(editor, event);
            }
        }));
        toDispose.push(editor.onLanguageChanged(() => this.updateMonacoEditorOptions(editor)));
        editor.document.onWillSaveModel(event => event.waitUntil(this.formatOnSave(editor, event)));
        return editor;
    }
    createMonacoEditorOptions(model) {
        const options = this.createOptions(this.preferencePrefixes, model.uri, model.languageId);
        options.model = model.textEditorModel;
        options.readOnly = model.readOnly;
        options.lineNumbersMinChars = model.lineNumbersMinChars;
        return options;
    }
    updateMonacoEditorOptions(editor, event) {
        if (event) {
            const preferenceName = event.preferenceName;
            const overrideIdentifier = editor.document.languageId;
            const newValue = this.editorPreferences.get({
                preferenceName,
                overrideIdentifier
            }, undefined, editor.uri.toString());
            editor.getControl().updateOptions(this.setOption(preferenceName, newValue, this.preferencePrefixes));
        }
        else {
            const options = this.createMonacoEditorOptions(editor.document);
            delete options.model;
            editor.getControl().updateOptions(options);
        }
    }
    shouldFormat(editor, event) {
        var _a;
        if (event.reason !== TextDocumentSaveReason.Manual) {
            return false;
        }
        if ((_a = event.options) === null || _a === void 0 ? void 0 : _a.formatType) {
            switch (event.options.formatType) {
                case 1 /* FormatType.ON */:
                    return true;
                case 2 /* FormatType.OFF */:
                    return false;
                case 3 /* FormatType.DIRTY */:
                    return editor.document.dirty;
            }
        }
        return true;
    }
    async formatOnSave(editor, event) {
        if (!this.shouldFormat(editor, event)) {
            return [];
        }
        const overrideIdentifier = editor.document.languageId;
        const uri = editor.uri.toString();
        const formatOnSave = this.editorPreferences.get({
            preferenceName: 'editor.formatOnSave',
            overrideIdentifier
        }, undefined, uri);
        if (formatOnSave) {
            const formatOnSaveTimeout = this.editorPreferences.get({
                preferenceName: 'editor.formatOnSaveTimeout',
                overrideIdentifier
            }, undefined, uri);
            await Promise.race([
                new Promise((_, reject) => setTimeout(() => reject(new Error(`Aborted format on save after ${formatOnSaveTimeout}ms`)), formatOnSaveTimeout)),
                editor.runAction('editor.action.formatDocument')
            ]);
        }
        // const shouldRemoveWhiteSpace = this.filePreferences.get({ preferenceName: 'files.trimTrailingWhitespace', overrideIdentifier }, undefined, uri);
        // if (shouldRemoveWhiteSpace) {
        //     await editor.runAction('editor.action.trimTrailingWhitespace');
        // }
        return [];
    }
    async getModel(uri, toDispose) {
        const reference = await this.textModelService.createModelReference(uri);
        // if document is invalid makes sure that all events from underlying resource are processed before throwing invalid model
        if (!reference.object.valid) {
            await reference.object.sync();
        }
        if (!reference.object.valid) {
            reference.dispose();
            throw Object.assign(new Error(`'${uri.toString()}' is invalid`), { code: 'MODEL_IS_INVALID' });
        }
        toDispose.push(reference);
        return reference.object;
    }
    async createMonacoDiffEditor(uri, override, toDispose) {
        const [original, modified] = DiffUris.decode(uri);
        const [originalModel, modifiedModel] = await Promise.all([this.getModel(original, toDispose), this.getModel(modified, toDispose)]);
        const options = this.createMonacoDiffEditorOptions(originalModel, modifiedModel);
        const editor = new MonacoDiffEditor(uri, document.createElement('div'), originalModel, modifiedModel, this.services, this.diffNavigatorFactory, options, override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => {
            const originalFileUri = original.withoutQuery().withScheme('file').toString();
            if (event.affects(originalFileUri, editor.document.languageId)) {
                this.updateMonacoDiffEditorOptions(editor, event, originalFileUri);
            }
        }));
        toDispose.push(editor.onLanguageChanged(() => this.updateMonacoDiffEditorOptions(editor)));
        return editor;
    }
    createMonacoDiffEditorOptions(original, modified) {
        const options = this.createOptions(this.diffPreferencePrefixes, modified.uri, modified.languageId);
        options.originalEditable = !original.readOnly;
        options.readOnly = modified.readOnly;
        return options;
    }
    updateMonacoDiffEditorOptions(editor, event, resourceUri) {
        if (event) {
            const preferenceName = event.preferenceName;
            const overrideIdentifier = editor.document.languageId;
            const newValue = this.editorPreferences.get({ preferenceName, overrideIdentifier }, undefined, resourceUri);
            editor.diffEditor.updateOptions(this.setOption(preferenceName, newValue, this.diffPreferencePrefixes));
        }
        else {
            const options = this.createMonacoDiffEditorOptions(editor.originalModel, editor.modifiedModel);
            editor.diffEditor.updateOptions(options);
        }
    }
    createOptions(prefixes, uri, overrideIdentifier) {
        return Object.keys(this.editorPreferences).reduce((options, preferenceName) => {
            const value = this.editorPreferences.get({ preferenceName, overrideIdentifier }, undefined, uri);
            return this.setOption(preferenceName, deepClone(value), prefixes, options);
        }, {});
    }
    setOption(preferenceName, value, prefixes, options = {}) {
        const optionName = this.toOptionName(preferenceName, prefixes);
        this.doSetOption(options, value, optionName.split('.'));
        return options;
    }
    toOptionName(preferenceName, prefixes) {
        for (const prefix of prefixes) {
            if (preferenceName.startsWith(prefix)) {
                return preferenceName.substr(prefix.length);
            }
        }
        return preferenceName;
    }
    doSetOption(obj, value, names, idx = 0) {
        const name = names[idx];
        if (!obj[name]) {
            if (names.length > (idx + 1)) {
                obj[name] = {};
                this.doSetOption(obj[name], value, names, (idx + 1));
            }
            else {
                obj[name] = value;
            }
        }
    }
    /**
     * Suppresses Monaco keydown listener to avoid triggering default Monaco keybindings
     * if they are overridden by a user. Monaco keybindings should be registered as Wm keybindings
     * to allow a user to customize them.
     */
    suppressMonacoKeybindingListener(editor) {
        let keydownListener;
        const keybindingService = editor.getControl()._standaloneKeybindingService;
        for (const listener of keybindingService._store._toDispose) {
            if ('_type' in listener && listener['_type'] === 'keydown') {
                keydownListener = listener;
                break;
            }
        }
        if (keydownListener) {
            keydownListener.dispose();
        }
    }
    installReferencesController(editor) {
        const control = editor.getControl();
        const referencesController = control._contributions['editor.contrib.referencesController'];
        const originalGotoReference = referencesController._gotoReference;
        referencesController._gotoReference = async (ref) => {
            if (referencesController._widget) {
                referencesController._widget.hide();
            }
            referencesController._ignoreModelChangeEvent = true;
            const range = monaco.Range.lift(ref.range).collapseToStart();
            // preserve the model that it does not get disposed if an editor preview replaces an editor
            const model = referencesController._model;
            referencesController._model = undefined;
            referencesController._editorService.openCodeEditor({
                resource: ref.uri,
                options: { selection: range }
            }, control).then(openedEditor => {
                referencesController._model = model;
                referencesController._ignoreModelChangeEvent = false;
                if (!openedEditor) {
                    referencesController.closeWidget();
                    return;
                }
                if (openedEditor !== control) {
                    // preserve the model that it does not get disposed in `referencesController.closeWidget`
                    referencesController._model = undefined;
                    // to preserve the active editor
                    const focus = control.focus;
                    control.focus = () => {
                    };
                    referencesController.closeWidget();
                    control.focus = focus;
                    const modelPromise = Promise.resolve(model);
                    modelPromise.cancel = () => {
                    };
                    openedEditor._contributions['editor.contrib.referencesController'].toggleWidget(range, modelPromise, true);
                    return;
                }
                if (referencesController._widget) {
                    referencesController._widget.show(range);
                    referencesController._widget.focusOnReferenceTree();
                }
            }, (e) => {
                referencesController._ignoreModelChangeEvent = false;
                monaco.error.onUnexpectedError(e);
            });
        };
        return Disposable.create(() => referencesController._gotoReference = originalGotoReference);
    }
    /**
     * Intercept internal Monaco open calls and delegate to OpenerService.
     */
    async interceptOpen(monacoUri, monacoOptions) {
        let options = undefined;
        if (monacoOptions) {
            if ('openToSide' in monacoOptions && monacoOptions.openToSide) {
                options = Object.assign(options || {}, {
                    widgetOptions: {
                        mode: 'split-right'
                    }
                });
            }
            if ('openExternal' in monacoOptions && monacoOptions.openExternal) {
                options = Object.assign(options || {}, {
                    openExternal: true
                });
            }
        }
        const uri = new URI(monacoUri.toString());
        try {
            await open(this.openerService, uri, options);
            return true;
        }
        catch (e) {
            console.error(`Fail to open '${uri.toString()}':`, e);
            return false;
        }
    }
};
__decorate([
    inject(ContributionProvider),
    named(MonacoEditorFactory)
], MonacoEditorProvider.prototype, "factories", void 0);
__decorate([
    inject(MonacoBulkEditService)
], MonacoEditorProvider.prototype, "bulkEditService", void 0);
__decorate([
    inject(MonacoEditorServices)
], MonacoEditorProvider.prototype, "services", void 0);
__decorate([
    inject(OpenerService)
], MonacoEditorProvider.prototype, "openerService", void 0);
__decorate([
    inject(MonacoQuickInputImplementation)
], MonacoEditorProvider.prototype, "quickInputService", void 0);
__decorate([
    inject(KeybindingRegistry)
], MonacoEditorProvider.prototype, "keybindingRegistry", void 0);
MonacoEditorProvider = __decorate([
    injectable(),
    __param(0, inject(MonacoEditorService)),
    __param(1, inject(MonacoTextModelService)),
    __param(2, inject(MonacoContextMenuService)),
    __param(3, inject(MonacoToProtocolConverter)),
    __param(4, inject(ProtocolToMonacoConverter)),
    __param(5, inject(MonacoDiffNavigatorFactory)),
    __param(6, inject(EditorPreferences)),
    __param(7, inject(MonacoCommandServiceFactory)),
    __param(8, inject(monaco.contextKeyService.ContextKeyService))
], MonacoEditorProvider);
export { MonacoEditorProvider };

//# sourceMappingURL=../../lib/browser/monaco-editor-provider.js.map
