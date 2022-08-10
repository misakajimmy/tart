import { EditorWidget } from './editor-widget';
import { NavigatableWidgetOpenHandler, NavigatableWidgetOptions, WidgetOpenerOptions } from '@tart/core';
import { Emitter, Event, MaybePromise, RecursivePartial } from '@tart/core/lib/common';
import { Position, Range } from './editor';
import URI from '@tart/core/lib/common/uri';
export interface WidgetId {
    id: number;
    uri: string;
}
export interface EditorOpenerOptions extends WidgetOpenerOptions {
    selection?: RecursivePartial<Range>;
    preview?: boolean;
    counter?: number;
}
export declare class EditorManager extends NavigatableWidgetOpenHandler<EditorWidget> {
    readonly id: string;
    readonly label = "Code Editor";
    protected readonly editorCounters: Map<string, number>;
    protected readonly onActiveEditorChangedEmitter: Emitter<EditorWidget>;
    /**
     * Emit when the active editor is changed.
     */
    readonly onActiveEditorChanged: Event<EditorWidget | undefined>;
    protected readonly onCurrentEditorChangedEmitter: Emitter<EditorWidget>;
    /**
     * Emit when the current editor is changed.
     */
    readonly onCurrentEditorChanged: Event<EditorWidget | undefined>;
    protected readonly recentlyVisibleIds: string[];
    protected _activeEditor: EditorWidget | undefined;
    /**
     * The active editor.
     * If there is an active editor (one that has focus), active and current are the same.
     */
    get activeEditor(): EditorWidget | undefined;
    protected _currentEditor: EditorWidget | undefined;
    /**
     * The most recently activated editor (which might not have the focus anymore, hence it is not active).
     * If no editor has focus, e.g. when a context menu is shown, the active editor is `undefined`, but current might be the editor that was active before the menu popped up.
     */
    get currentEditor(): EditorWidget | undefined;
    protected get recentlyVisible(): EditorWidget | undefined;
    getByUri(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget | undefined>;
    getOrCreateByUri(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    canHandle(uri: URI, options?: WidgetOpenerOptions): number;
    open(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    /**
     * Opens an editor to the side of the current editor. Defaults to opening to the right.
     * To modify direction, pass options with `{widgetOptions: {mode: ...}}`
     */
    openToSide(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    protected init(): void;
    protected tryGetPendingWidget(uri: URI, options?: EditorOpenerOptions): MaybePromise<EditorWidget> | undefined;
    protected getWidget(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget | undefined>;
    protected getOrCreateWidget(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget>;
    protected addRecentlyVisible(widget: EditorWidget): void;
    protected removeRecentlyVisible(widget: EditorWidget): void;
    protected setActiveEditor(active: EditorWidget | undefined): void;
    protected updateActiveEditor(): void;
    protected setCurrentEditor(current: EditorWidget | undefined): void;
    protected updateCurrentEditor(): void;
    protected revealSelection(widget: EditorWidget, input?: EditorOpenerOptions, uri?: URI): void;
    protected getSelection(widget: EditorWidget, selection: RecursivePartial<Range>): Range | Position | undefined;
    protected removeFromCounter(widget: EditorWidget): void;
    protected extractIdFromWidget(widget: EditorWidget): WidgetId;
    protected checkCounterForWidget(widget: EditorWidget): void;
    protected createCounterForUri(uri: URI): number;
    protected getCounterForUri(uri: URI): number | undefined;
    protected getOrCreateCounterForUri(uri: URI): number;
    protected createWidgetOptions(uri: URI, options?: EditorOpenerOptions): NavigatableWidgetOptions;
}
