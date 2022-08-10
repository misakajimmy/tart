/// <reference types="@theia/monaco-editor-core/monaco" />
import { TextDocumentContentChangeEvent, TextDocumentSaveReason } from 'vscode-languageserver-protocol';
import { CancellationToken, CancellationTokenSource, DisposableCollection, Emitter, Event, Resource, ResourceVersion } from '@tart/core/lib/common';
import { Position, Range } from 'vscode-languageserver-types';
import { Saveable, SaveOptions } from '@tart/core/lib/browser/saveable';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { EditorPreferences } from '@tart/editor/lib/browser/editor-preference';
import { EncodingMode, FindMatch, FindMatchesOptions, TextEditorDocument } from '@tart/editor/lib/browser/editor';
export { TextDocumentSaveReason };
declare type ITextEditorModel = monaco.editor.ITextEditorModel;
export interface WillSaveMonacoModelEvent {
    readonly model: MonacoEditorModel;
    readonly reason: TextDocumentSaveReason;
    readonly options?: SaveOptions;
    waitUntil(thenable: Thenable<monaco.editor.IIdentifiedSingleEditOperation[]>): void;
}
export interface MonacoModelContentChangedEvent {
    readonly model: MonacoEditorModel;
    readonly contentChanges: TextDocumentContentChangeEvent[];
}
export declare class MonacoEditorModel implements ITextEditorModel, TextEditorDocument {
    protected readonly resource: Resource;
    protected readonly m2p: MonacoToProtocolConverter;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly editorPreferences?: EditorPreferences;
    autoSave: 'on' | 'off';
    autoSaveDelay: number;
    suppressOpenEditorWhenDirty: boolean;
    lineNumbersMinChars: number;
    readonly onWillSaveLoopTimeOut = 1500;
    protected bufferSavedVersionId: number;
    protected model: monaco.editor.IModel;
    protected readonly resolveModel: Promise<void>;
    protected readonly toDispose: DisposableCollection;
    protected readonly toDisposeOnAutoSave: DisposableCollection;
    protected readonly onDidChangeContentEmitter: Emitter<MonacoModelContentChangedEvent>;
    readonly onDidChangeContent: Event<MonacoModelContentChangedEvent>;
    protected readonly onDidSaveModelEmitter: Emitter<monaco.editor.ITextModel>;
    readonly onDidSaveModel: Event<monaco.editor.ITextModel>;
    protected readonly onWillSaveModelEmitter: Emitter<WillSaveMonacoModelEvent>;
    readonly onWillSaveModel: Event<WillSaveMonacoModelEvent>;
    protected readonly onDidChangeValidEmitter: Emitter<void>;
    readonly onDidChangeValid: Event<void>;
    protected readonly onDidChangeEncodingEmitter: Emitter<string>;
    readonly onDidChangeEncoding: Event<string>;
    protected resourceVersion: ResourceVersion | undefined;
    protected readonly onDirtyChangedEmitter: Emitter<void>;
    protected pendingOperation: Promise<void>;
    protected syncCancellationTokenSource: CancellationTokenSource;
    protected ignoreDirtyEdits: boolean;
    protected saveCancellationTokenSource: CancellationTokenSource;
    protected ignoreContentChanges: boolean;
    protected readonly contentChanges: TextDocumentContentChangeEvent[];
    private preferredEncoding;
    private contentEncoding;
    constructor(resource: Resource, m2p: MonacoToProtocolConverter, p2m: ProtocolToMonacoConverter, editorPreferences?: EditorPreferences);
    /**
     * Use `valid` to access it.
     * Use `setValid` to mutate it.
     */
    protected _valid: boolean;
    /**
     * Whether it is possible to load content from the underlying resource.
     */
    get valid(): boolean;
    protected _dirty: boolean;
    get dirty(): boolean;
    get onDirtyChanged(): Event<void>;
    get uri(): string;
    protected _languageId: string | undefined;
    get languageId(): string;
    get version(): number;
    get lineCount(): number;
    get readOnly(): boolean;
    get onDispose(): monaco.IEvent<void>;
    get textEditorModel(): monaco.editor.IModel;
    dispose(): void;
    setEncoding(encoding: string, mode: EncodingMode): Promise<void>;
    getEncoding(): string | undefined;
    /**
     * It's a hack to dispatch close notification with an old language id, don't use it.
     */
    setLanguageId(languageId: string | undefined): void;
    /**
     * Return selected text by Range or all text by default
     */
    getText(range?: Range): string;
    positionAt(offset: number): Position;
    offsetAt(position: Position): number;
    /**
     * Retrieves a line in a text document expressed as a one-based position.
     */
    getLineContent(lineNumber: number): string;
    getLineMaxColumn(lineNumber: number): number;
    /**
     * Find all matches in an editor for the given options.
     * @param options the options for finding matches.
     *
     * @returns the list of matches.
     */
    findMatches(options: FindMatchesOptions): FindMatch[];
    load(): Promise<MonacoEditorModel>;
    save(options?: SaveOptions): Promise<void>;
    sync(): Promise<void>;
    revert(options?: Saveable.RevertOptions): Promise<void>;
    createSnapshot(): object;
    applySnapshot(snapshot: {
        value: string;
    }): void;
    protected setPreferredEncoding(encoding: string): boolean;
    protected updateContentEncoding(): void;
    /**
     * #### Important
     * Only this method can create an instance of `monaco.editor.IModel`,
     * there should not be other calls to `monaco.editor.createModel`.
     */
    protected initialize(value: string | monaco.editor.ITextBufferFactory): void;
    protected setValid(valid: boolean): void;
    protected setDirty(dirty: boolean): void;
    protected run(operation: () => Promise<void>): Promise<void>;
    protected cancelSync(): CancellationToken;
    protected doSync(token: CancellationToken): Promise<void>;
    protected readContents(): Promise<string | monaco.editor.ITextBufferFactory | undefined>;
    protected markAsDirty(): void;
    protected doAutoSave(): void;
    protected cancelSave(): CancellationToken;
    protected scheduleSave(reason: TextDocumentSaveReason, token?: CancellationToken, overwriteEncoding?: boolean, options?: SaveOptions): Promise<void>;
    protected pushContentChanges(contentChanges: TextDocumentContentChangeEvent[]): void;
    protected fireDidChangeContent(event: monaco.editor.IModelContentChangedEvent): void;
    protected asContentChangedEvent(event: monaco.editor.IModelContentChangedEvent): MonacoModelContentChangedEvent;
    protected asTextDocumentContentChangeEvent(change: monaco.editor.IModelContentChange): TextDocumentContentChangeEvent;
    protected applyEdits(operations: monaco.editor.IIdentifiedSingleEditOperation[], options?: Partial<MonacoEditorModel.ApplyEditsOptions>): void;
    protected updateModel<T>(doUpdate: () => T, options?: Partial<MonacoEditorModel.ApplyEditsOptions>): T;
    protected doSave(reason: TextDocumentSaveReason, token: CancellationToken, overwriteEncoding?: boolean, options?: SaveOptions): Promise<void>;
    protected fireWillSaveModel(reason: TextDocumentSaveReason, token: CancellationToken, options?: SaveOptions): Promise<void>;
    protected fireDidSaveModel(): void;
    protected trace(): void;
    private updateSavedVersionId;
}
export declare namespace MonacoEditorModel {
    interface ApplyEditsOptions {
        ignoreDirty: boolean;
        ignoreContentChanges: boolean;
    }
}
