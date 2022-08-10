/// <reference types="@theia/monaco-editor-core/monaco" />
import { DeltaDecorationParams, Dimension, EditorMouseEvent, EncodingMode, Position, Range, ReplaceTextParams, RevealPositionOptions, RevealRangeOptions, TextDocumentChangeEvent, TextEditor } from '@tart/editor/lib/browser/editor';
import { ElementExt } from '@lumino/domutils';
import { Disposable, DisposableCollection, Emitter, Event, TextDocumentContentChangeDelta } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { ContextKeyService } from '@tart/core/lib/browser/context-key-service';
import { TextEdit } from 'vscode-languageserver-types';
import IStandaloneEditorConstructionOptions = monaco.editor.IStandaloneEditorConstructionOptions;
import IModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import IBoxSizing = ElementExt.IBoxSizing;
import { EditorDecoration } from '@tart/editor/lib/browser/decorations/editor-decoration';
import { EditorManager } from '@tart/editor/lib/browser/editor-manager';
import { EditorWidget } from '@tart/editor/lib/browser/editor-widget';
export declare class MonacoEditorServices {
    protected readonly m2p: MonacoToProtocolConverter;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly contextKeyService: ContextKeyService;
    constructor(services: MonacoEditorServices);
}
export declare class MonacoEditor extends MonacoEditorServices implements TextEditor {
    readonly uri: URI;
    readonly document: MonacoEditorModel;
    readonly node: HTMLElement;
    onEncodingChanged: Event<string>;
    readonly documents: Set<MonacoEditorModel>;
    protected readonly toDispose: DisposableCollection;
    protected readonly autoSizing: boolean;
    protected readonly minHeight: number;
    protected readonly maxHeight: number;
    protected editor: IStandaloneCodeEditor;
    protected readonly onCursorPositionChangedEmitter: Emitter<Position>;
    protected readonly onSelectionChangedEmitter: Emitter<Range>;
    protected readonly onFocusChangedEmitter: Emitter<boolean>;
    protected readonly onDocumentContentChangedEmitter: Emitter<TextDocumentChangeEvent>;
    protected readonly onMouseDownEmitter: Emitter<EditorMouseEvent>;
    protected readonly onLanguageChangedEmitter: Emitter<string>;
    readonly onLanguageChanged: Event<string>;
    protected readonly onScrollChangedEmitter: Emitter<void>;
    protected readonly onResizeEmitter: Emitter<Dimension>;
    readonly onDidResize: Event<Dimension>;
    constructor(uri: URI, document: MonacoEditorModel, node: HTMLElement, services: MonacoEditorServices, options?: MonacoEditor.IOptions, override?: IEditorOverrideServices);
    get onDispose(): Event<void>;
    get onDocumentContentChanged(): Event<TextDocumentChangeEvent>;
    get cursor(): Position;
    set cursor(cursor: Position);
    get onCursorPositionChanged(): Event<Position>;
    get selection(): Range;
    set selection(selection: Range);
    get onSelectionChanged(): Event<Range>;
    get onScrollChanged(): Event<void>;
    get onFocusChanged(): Event<boolean>;
    get onMouseDown(): Event<EditorMouseEvent>;
    get commandService(): monaco.commands.ICommandService;
    get instantiationService(): monaco.instantiation.IInstantiationService;
    protected _languageAutoDetected: boolean;
    get languageAutoDetected(): boolean;
    getEncoding(): string;
    setEncoding(encoding: string, mode: EncodingMode): Promise<void>;
    getVisibleRanges(): Range[];
    revealPosition(raw: Position, options?: RevealPositionOptions): void;
    revealRange(raw: Range, options?: RevealRangeOptions): void;
    focus(): void;
    blur(): void;
    isFocused({ strict }?: {
        strict: boolean;
    }): boolean;
    /**
     * `true` if the suggest widget is visible in the editor. Otherwise, `false`.
     */
    isSuggestWidgetVisible(): boolean;
    /**
     * `true` if the find (and replace) widget is visible in the editor. Otherwise, `false`.
     */
    isFindWidgetVisible(): boolean;
    /**
     * `true` if the name rename refactoring input HTML element is visible. Otherwise, `false`.
     */
    isRenameInputVisible(): boolean;
    dispose(): void;
    trigger(source: string, handlerId: string, payload: any): void;
    getControl(): IStandaloneCodeEditor;
    refresh(): void;
    resizeToFit(): void;
    setSize(dimension: Dimension): void;
    isActionSupported(id: string): boolean;
    runAction(id: string): Promise<void>;
    deltaDecorations(params: DeltaDecorationParams): string[];
    getLinesDecorations(startLineNumber: number, endLineNumber: number): (EditorDecoration & Readonly<{
        id: string;
    }>)[];
    getVisibleColumn(position: Position): number;
    replaceText(params: ReplaceTextParams): Promise<boolean>;
    executeEdits(edits: TextEdit[]): boolean;
    storeViewState(): object;
    restoreViewState(state: monaco.editor.ICodeEditorViewState): void;
    detectLanguage(): Promise<void>;
    setLanguage(languageId: string): void;
    getResourceUri(): URI;
    createMoveToUri(resourceUri: URI): URI;
    protected create(options?: IStandaloneEditorConstructionOptions, override?: monaco.editor.IEditorOverrideServices): Disposable;
    protected addHandlers(codeEditor: IStandaloneCodeEditor): void;
    protected mapModelContentChange(change: monaco.editor.IModelContentChange): TextDocumentContentChangeDelta;
    protected autoresize(): void;
    protected resize(dimension: Dimension | null): void;
    protected computeLayoutSize(hostNode: HTMLElement, dimension: monaco.editor.IDimension | null): monaco.editor.IDimension;
    protected getWidth(hostNode: HTMLElement, boxSizing: IBoxSizing): number;
    protected getHeight(hostNode: HTMLElement, boxSizing: IBoxSizing): number;
    protected toDeltaDecorations(params: DeltaDecorationParams): IModelDeltaDecoration[];
    protected toEditorDecoration(decoration: monaco.editor.IModelDecoration): EditorDecoration & Readonly<{
        id: string;
    }>;
    protected fireLanguageChanged(languageId: string): void;
}
export declare namespace MonacoEditor {
    interface ICommonOptions {
        /**
         * Whether an editor should be auto resized on a content change.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        autoSizing?: boolean;
        /**
         * A minimal height of an editor in lines.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        minHeight?: number;
        /**
         * A maximal height of an editor in lines.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        maxHeight?: number;
    }
    interface IOptions extends ICommonOptions, IStandaloneEditorConstructionOptions {
    }
    function getAll(manager: EditorManager): MonacoEditor[];
    function getCurrent(manager: EditorManager): MonacoEditor | undefined;
    function getActive(manager: EditorManager): MonacoEditor | undefined;
    function get(editorWidget: EditorWidget | undefined): MonacoEditor | undefined;
    function findByDocument(manager: EditorManager, document: MonacoEditorModel): MonacoEditor[];
    function getWidgetFor(manager: EditorManager, control: monaco.editor.ICodeEditor | undefined): EditorWidget | undefined;
}
