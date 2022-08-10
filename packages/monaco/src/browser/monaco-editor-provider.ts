import {inject, injectable, named} from 'inversify';
import {MonacoEditorService} from './monaco-editor-service';
import {MonacoEditor, MonacoEditorServices} from './monaco-editor';
import URI from '@tart/core/lib/common/uri';
import {MonacoCommandServiceFactory} from './monaco-command-service';
import {ContributionProvider, deepClone, Disposable, DisposableCollection} from '@tart/core/lib/common';
import {DiffUris, FormatType, KeybindingRegistry, open, OpenerService, WidgetOpenerOptions} from '@tart/core';
import {MonacoTextModelService} from './monaco-text-model-service';
import {MonacoContextMenuService} from './monaco-context-menu';
import {MonacoBulkEditService} from './monaco-bulk-edit-service';
import {HttpOpenHandlerOptions} from '@tart/core/lib/browser/http-open-handler';
import {DiffNavigator, EditorPreferenceChange, EditorPreferences, TextEditor} from '@tart/editor';
import {MonacoQuickInputImplementation} from './monaco-quick-input-service';
import {MonacoResolvedKeybinding} from './monaco-resolved-keybinding';
import {MonacoEditorModel, WillSaveMonacoModelEvent} from './monaco-editor-model';
import {TextDocumentSaveReason} from 'vscode-languageserver-protocol';
import {MonacoDiffEditor} from './monaco-diff-editor';
import {MonacoDiffNavigatorFactory} from './monaco-diff-navigator-factory';
import {MonacoToProtocolConverter} from './monaco-to-protocol-converter';
import {ProtocolToMonacoConverter} from './protocol-to-monaco-converter';
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;

export const MonacoEditorFactory = Symbol('MonacoEditorFactory');

export interface MonacoEditorFactory {
    readonly scheme: string;

    create(model: MonacoEditorModel, defaultOptions: MonacoEditor.IOptions, defaultOverrides: IEditorOverrideServices): MonacoEditor;
}


@injectable()
export class MonacoEditorProvider {
    @inject(ContributionProvider)
    @named(MonacoEditorFactory)
    protected readonly factories: ContributionProvider<MonacoEditorFactory>;

    @inject(MonacoBulkEditService)
    protected readonly bulkEditService: MonacoBulkEditService;

    @inject(MonacoEditorServices)
    protected readonly services: MonacoEditorServices;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(MonacoQuickInputImplementation)
    protected readonly quickInputService: MonacoQuickInputImplementation;

    @inject(KeybindingRegistry)
    protected readonly keybindingRegistry: KeybindingRegistry;

    constructor(
        @inject(MonacoEditorService) protected readonly codeEditorService: MonacoEditorService,
        @inject(MonacoTextModelService) protected readonly textModelService: MonacoTextModelService,
        @inject(MonacoContextMenuService) protected readonly contextMenuService: MonacoContextMenuService,
        @inject(MonacoToProtocolConverter) protected readonly m2p: MonacoToProtocolConverter,
        @inject(ProtocolToMonacoConverter) protected readonly p2m: ProtocolToMonacoConverter,
        @inject(MonacoDiffNavigatorFactory) protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory,
        @inject(EditorPreferences) protected readonly editorPreferences: EditorPreferences,
        @inject(MonacoCommandServiceFactory) protected readonly commandServiceFactory: MonacoCommandServiceFactory,
        @inject(monaco.contextKeyService.ContextKeyService) protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService
    ) {
        const staticServices = monaco.services.StaticServices;
        const init = staticServices.init.bind(monaco.services.StaticServices);

        monaco.services.StaticServices.init = o => {
            const result = init(o);
            result[0].set(monaco.services.ICodeEditorService, codeEditorService);
            return result;
        };
    }

    protected _current: MonacoEditor | undefined;

    /**
     * Returns the last focused MonacoEditor.
     * It takes into account inline editors as well.
     * If you are interested only in standalone editors then use `MonacoEditor.getCurrent(EditorManager)`
     */
    get current(): MonacoEditor | undefined {
        return this._current;
    }

    protected get preferencePrefixes(): string[] {
        return ['editor.'];
    }

    protected get diffPreferencePrefixes(): string[] {
        return [...this.preferencePrefixes, 'diffEditor.'];
    }

    async get(uri: URI): Promise<MonacoEditor> {
        await this.editorPreferences.ready;
        return this.doCreateEditor(uri, (override, toDispose) => this.createEditor(uri, override, toDispose));
    }

    getDiffNavigator(editor: TextEditor): DiffNavigator {
        if (editor instanceof MonacoDiffEditor) {
            return editor.diffNavigator;
        }
        return MonacoDiffNavigatorFactory.nullNavigator;
    }

    protected async doCreateEditor(uri: URI, factory: (override: IEditorOverrideServices, toDispose: DisposableCollection) => Promise<MonacoEditor>): Promise<MonacoEditor> {
        const commandService = this.commandServiceFactory();
        const domNode = document.createElement('div');
        const contextKeyService = this.contextKeyService.createScoped(domNode);
        const {codeEditorService, textModelService, contextMenuService} = this;
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

    protected injectKeybindingResolver(editor: MonacoEditor): void {
        const keybindingService = editor.getControl()._standaloneKeybindingService;
        keybindingService.resolveKeybinding = keybinding => [new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry)];
        keybindingService.resolveKeyboardEvent = keyboardEvent => {
            const keybinding = new monaco.keybindings.SimpleKeybinding(
                keyboardEvent.ctrlKey,
                keyboardEvent.shiftKey,
                keyboardEvent.altKey,
                keyboardEvent.metaKey,
                keyboardEvent.keyCode
            ).toChord();
            return new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry);
        };
    }

    protected createEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor> {
        if (DiffUris.isDiffUri(uri)) {
            return this.createMonacoDiffEditor(uri, override, toDispose);
        }
        return this.createMonacoEditor(uri, override, toDispose);
    }

    protected async createMonacoEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor> {
        const model = await this.getModel(uri, toDispose);
        const options = this.createMonacoEditorOptions(model);
        const factory = this.factories.getContributions().find(({scheme}) => uri.scheme === scheme);
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

    protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions {
        const options = this.createOptions(this.preferencePrefixes, model.uri, model.languageId);
        options.model = model.textEditorModel;
        options.readOnly = model.readOnly;
        options.lineNumbersMinChars = model.lineNumbersMinChars;
        return options;
    }

    protected updateMonacoEditorOptions(editor: MonacoEditor, event?: EditorPreferenceChange): void {
        if (event) {
            const preferenceName = event.preferenceName;
            const overrideIdentifier = editor.document.languageId;
            const newValue = this.editorPreferences.get({
                preferenceName,
                overrideIdentifier
            }, undefined, editor.uri.toString());
            editor.getControl().updateOptions(this.setOption(preferenceName, newValue, this.preferencePrefixes));
        } else {
            const options = this.createMonacoEditorOptions(editor.document);
            delete options.model;
            editor.getControl().updateOptions(options);
        }
    }

    protected shouldFormat(editor: MonacoEditor, event: WillSaveMonacoModelEvent): boolean {
        if (event.reason !== TextDocumentSaveReason.Manual) {
            return false;
        }
        if (event.options?.formatType) {
            switch (event.options.formatType) {
                case FormatType.ON:
                    return true;
                case FormatType.OFF:
                    return false;
                case FormatType.DIRTY:
                    return editor.document.dirty;
            }
        }
        return true;
    }

    protected async formatOnSave(editor: MonacoEditor, event: WillSaveMonacoModelEvent): Promise<monaco.editor.IIdentifiedSingleEditOperation[]> {
        if (!this.shouldFormat(editor, event)) {
            return [];
        }
        const overrideIdentifier = editor.document.languageId;
        const uri = editor.uri.toString();
        const formatOnSave = this.editorPreferences.get({
            preferenceName: 'editor.formatOnSave',
            overrideIdentifier
        }, undefined, uri)!;
        if (formatOnSave) {
            const formatOnSaveTimeout = this.editorPreferences.get({
                preferenceName: 'editor.formatOnSaveTimeout',
                overrideIdentifier
            }, undefined, uri)!;
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

    protected async getModel(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditorModel> {
        const reference = await this.textModelService.createModelReference(uri);
        // if document is invalid makes sure that all events from underlying resource are processed before throwing invalid model
        if (!reference.object.valid) {
            await reference.object.sync();
        }
        if (!reference.object.valid) {
            reference.dispose();
            throw Object.assign(new Error(`'${uri.toString()}' is invalid`), {code: 'MODEL_IS_INVALID'});
        }
        toDispose.push(reference);
        return reference.object;
    }

    protected async createMonacoDiffEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoDiffEditor> {
        const [original, modified] = DiffUris.decode(uri);

        const [originalModel, modifiedModel] = await Promise.all([this.getModel(original, toDispose), this.getModel(modified, toDispose)]);

        const options = this.createMonacoDiffEditorOptions(originalModel, modifiedModel);
        const editor = new MonacoDiffEditor(
            uri,
            document.createElement('div'),
            originalModel, modifiedModel,
            this.services,
            this.diffNavigatorFactory,
            options,
            override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => {
            const originalFileUri = original.withoutQuery().withScheme('file').toString();
            if (event.affects(originalFileUri, editor.document.languageId)) {
                this.updateMonacoDiffEditorOptions(editor, event, originalFileUri);
            }
        }));
        toDispose.push(editor.onLanguageChanged(() => this.updateMonacoDiffEditorOptions(editor)));
        return editor;
    }

    protected createMonacoDiffEditorOptions(original: MonacoEditorModel, modified: MonacoEditorModel): MonacoDiffEditor.IOptions {
        const options = this.createOptions(this.diffPreferencePrefixes, modified.uri, modified.languageId);
        options.originalEditable = !original.readOnly;
        options.readOnly = modified.readOnly;
        return options;
    }

    protected updateMonacoDiffEditorOptions(editor: MonacoDiffEditor, event?: EditorPreferenceChange, resourceUri?: string): void {
        if (event) {
            const preferenceName = event.preferenceName;
            const overrideIdentifier = editor.document.languageId;
            const newValue = this.editorPreferences.get({preferenceName, overrideIdentifier}, undefined, resourceUri);
            editor.diffEditor.updateOptions(this.setOption(preferenceName, newValue, this.diffPreferencePrefixes));
        } else {
            const options = this.createMonacoDiffEditorOptions(editor.originalModel, editor.modifiedModel);
            editor.diffEditor.updateOptions(options);
        }
    }


    /** @deprecated always pass a language as an overrideIdentifier */
    protected createOptions(prefixes: string[], uri: string): { [name: string]: any };
    protected createOptions(prefixes: string[], uri: string, overrideIdentifier: string): { [name: string]: any };
    protected createOptions(prefixes: string[], uri: string, overrideIdentifier?: string): { [name: string]: any } {
        return Object.keys(this.editorPreferences).reduce((options, preferenceName) => {
            const value = (<any>this.editorPreferences).get({preferenceName, overrideIdentifier}, undefined, uri);
            return this.setOption(preferenceName, deepClone(value), prefixes, options);
        }, {});
    }

    protected setOption(preferenceName: string, value: any, prefixes: string[], options: { [name: string]: any } = {}): {
        [name: string]: any;
    } {
        const optionName = this.toOptionName(preferenceName, prefixes);
        this.doSetOption(options, value, optionName.split('.'));
        return options;
    }

    protected toOptionName(preferenceName: string, prefixes: string[]): string {
        for (const prefix of prefixes) {
            if (preferenceName.startsWith(prefix)) {
                return preferenceName.substr(prefix.length);
            }
        }
        return preferenceName;
    }

    protected doSetOption(obj: { [name: string]: any }, value: any, names: string[], idx: number = 0): void {
        const name = names[idx];
        if (!obj[name]) {
            if (names.length > (idx + 1)) {
                obj[name] = {};
                this.doSetOption(obj[name], value, names, (idx + 1));
            } else {
                obj[name] = value;
            }
        }
    }

    /**
     * Suppresses Monaco keydown listener to avoid triggering default Monaco keybindings
     * if they are overridden by a user. Monaco keybindings should be registered as Wm keybindings
     * to allow a user to customize them.
     */
    protected suppressMonacoKeybindingListener(editor: MonacoEditor): void {
        let keydownListener: monaco.IDisposable | undefined;
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

    protected installReferencesController(editor: MonacoEditor): Disposable {
        const control = editor.getControl();
        const referencesController = control._contributions['editor.contrib.referencesController'];
        const originalGotoReference = referencesController._gotoReference;
        referencesController._gotoReference = async ref => {
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
                options: {selection: range}
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

                    const modelPromise = Promise.resolve(model) as any;
                    modelPromise.cancel = () => {
                    };
                    openedEditor._contributions['editor.contrib.referencesController'].toggleWidget(range, modelPromise, true);
                    return;
                }

                if (referencesController._widget) {
                    referencesController._widget.show(range);
                    referencesController._widget.focusOnReferenceTree();
                }

            }, (e: any) => {
                referencesController._ignoreModelChangeEvent = false;
                monaco.error.onUnexpectedError(e);
            });
        };
        return Disposable.create(() => referencesController._gotoReference = originalGotoReference);
    }

    /**
     * Intercept internal Monaco open calls and delegate to OpenerService.
     */
    protected async interceptOpen(monacoUri: monaco.Uri | string, monacoOptions?: monaco.services.OpenInternalOptions | monaco.services.OpenExternalOptions): Promise<boolean> {
        let options = undefined;
        if (monacoOptions) {
            if ('openToSide' in monacoOptions && monacoOptions.openToSide) {
                options = Object.assign(options || {}, <WidgetOpenerOptions>{
                    widgetOptions: {
                        mode: 'split-right'
                    }
                });
            }
            if ('openExternal' in monacoOptions && monacoOptions.openExternal) {
                options = Object.assign(options || {}, <HttpOpenHandlerOptions>{
                    openExternal: true
                });
            }
        }
        const uri = new URI(monacoUri.toString());
        try {
            await open(this.openerService, uri, options);
            return true;
        } catch (e) {
            console.error(`Fail to open '${uri.toString()}':`, e);
            return false;
        }
    }
}
