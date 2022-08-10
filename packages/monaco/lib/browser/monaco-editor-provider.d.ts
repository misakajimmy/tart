/// <reference types="@theia/monaco-editor-core/monaco" />
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoEditor, MonacoEditorServices } from './monaco-editor';
import URI from '@tart/core/lib/common/uri';
import { MonacoCommandServiceFactory } from './monaco-command-service';
import { ContributionProvider, Disposable, DisposableCollection } from '@tart/core/lib/common';
import { KeybindingRegistry, OpenerService } from '@tart/core';
import { MonacoTextModelService } from './monaco-text-model-service';
import { MonacoContextMenuService } from './monaco-context-menu';
import { MonacoBulkEditService } from './monaco-bulk-edit-service';
import { DiffNavigator, EditorPreferenceChange, EditorPreferences, TextEditor } from '@tart/editor';
import { MonacoQuickInputImplementation } from './monaco-quick-input-service';
import { MonacoEditorModel, WillSaveMonacoModelEvent } from './monaco-editor-model';
import { MonacoDiffEditor } from './monaco-diff-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;
export declare const MonacoEditorFactory: unique symbol;
export interface MonacoEditorFactory {
    readonly scheme: string;
    create(model: MonacoEditorModel, defaultOptions: MonacoEditor.IOptions, defaultOverrides: IEditorOverrideServices): MonacoEditor;
}
export declare class MonacoEditorProvider {
    protected readonly codeEditorService: MonacoEditorService;
    protected readonly textModelService: MonacoTextModelService;
    protected readonly contextMenuService: MonacoContextMenuService;
    protected readonly m2p: MonacoToProtocolConverter;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory;
    protected readonly editorPreferences: EditorPreferences;
    protected readonly commandServiceFactory: MonacoCommandServiceFactory;
    protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService;
    protected readonly factories: ContributionProvider<MonacoEditorFactory>;
    protected readonly bulkEditService: MonacoBulkEditService;
    protected readonly services: MonacoEditorServices;
    protected readonly openerService: OpenerService;
    protected readonly quickInputService: MonacoQuickInputImplementation;
    protected readonly keybindingRegistry: KeybindingRegistry;
    constructor(codeEditorService: MonacoEditorService, textModelService: MonacoTextModelService, contextMenuService: MonacoContextMenuService, m2p: MonacoToProtocolConverter, p2m: ProtocolToMonacoConverter, diffNavigatorFactory: MonacoDiffNavigatorFactory, editorPreferences: EditorPreferences, commandServiceFactory: MonacoCommandServiceFactory, contextKeyService: monaco.contextKeyService.ContextKeyService);
    protected _current: MonacoEditor | undefined;
    /**
     * Returns the last focused MonacoEditor.
     * It takes into account inline editors as well.
     * If you are interested only in standalone editors then use `MonacoEditor.getCurrent(EditorManager)`
     */
    get current(): MonacoEditor | undefined;
    protected get preferencePrefixes(): string[];
    protected get diffPreferencePrefixes(): string[];
    get(uri: URI): Promise<MonacoEditor>;
    getDiffNavigator(editor: TextEditor): DiffNavigator;
    protected doCreateEditor(uri: URI, factory: (override: IEditorOverrideServices, toDispose: DisposableCollection) => Promise<MonacoEditor>): Promise<MonacoEditor>;
    protected injectKeybindingResolver(editor: MonacoEditor): void;
    protected createEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor>;
    protected createMonacoEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor>;
    protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions;
    protected updateMonacoEditorOptions(editor: MonacoEditor, event?: EditorPreferenceChange): void;
    protected shouldFormat(editor: MonacoEditor, event: WillSaveMonacoModelEvent): boolean;
    protected formatOnSave(editor: MonacoEditor, event: WillSaveMonacoModelEvent): Promise<monaco.editor.IIdentifiedSingleEditOperation[]>;
    protected getModel(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditorModel>;
    protected createMonacoDiffEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoDiffEditor>;
    protected createMonacoDiffEditorOptions(original: MonacoEditorModel, modified: MonacoEditorModel): MonacoDiffEditor.IOptions;
    protected updateMonacoDiffEditorOptions(editor: MonacoDiffEditor, event?: EditorPreferenceChange, resourceUri?: string): void;
    /** @deprecated always pass a language as an overrideIdentifier */
    protected createOptions(prefixes: string[], uri: string): {
        [name: string]: any;
    };
    protected createOptions(prefixes: string[], uri: string, overrideIdentifier: string): {
        [name: string]: any;
    };
    protected setOption(preferenceName: string, value: any, prefixes: string[], options?: {
        [name: string]: any;
    }): {
        [name: string]: any;
    };
    protected toOptionName(preferenceName: string, prefixes: string[]): string;
    protected doSetOption(obj: {
        [name: string]: any;
    }, value: any, names: string[], idx?: number): void;
    /**
     * Suppresses Monaco keydown listener to avoid triggering default Monaco keybindings
     * if they are overridden by a user. Monaco keybindings should be registered as Wm keybindings
     * to allow a user to customize them.
     */
    protected suppressMonacoKeybindingListener(editor: MonacoEditor): void;
    protected installReferencesController(editor: MonacoEditor): Disposable;
    /**
     * Intercept internal Monaco open calls and delegate to OpenerService.
     */
    protected interceptOpen(monacoUri: monaco.Uri | string, monacoOptions?: monaco.services.OpenInternalOptions | monaco.services.OpenExternalOptions): Promise<boolean>;
}
