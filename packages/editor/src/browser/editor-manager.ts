import {injectable, postConstruct} from 'inversify';
import {EditorWidget} from './editor-widget';
import {NavigatableWidgetOpenHandler, NavigatableWidgetOptions, Widget, WidgetOpenerOptions} from '@tartjs/core';
import {Emitter, Event, MaybePromise, RecursivePartial} from '@tartjs/core/lib/common';
import {EditorWidgetFactory} from './editor-widget-factory';
import {Position, Range} from './editor';
import URI from '@tartjs/core/lib/common/uri';

export interface WidgetId {
  id: number;
  uri: string;
}

export interface EditorOpenerOptions extends WidgetOpenerOptions {
  selection?: RecursivePartial<Range>;
  preview?: boolean;
  counter?: number
}

@injectable()
export class EditorManager extends NavigatableWidgetOpenHandler<EditorWidget> {

  readonly id = EditorWidgetFactory.ID;

  readonly label = 'Code Editor';

  protected readonly editorCounters = new Map<string, number>();

  protected readonly onActiveEditorChangedEmitter = new Emitter<EditorWidget | undefined>();
  /**
   * Emit when the active editor is changed.
   */
  readonly onActiveEditorChanged: Event<EditorWidget | undefined> = this.onActiveEditorChangedEmitter.event;

  protected readonly onCurrentEditorChangedEmitter = new Emitter<EditorWidget | undefined>();
  /**
   * Emit when the current editor is changed.
   */
  readonly onCurrentEditorChanged: Event<EditorWidget | undefined> = this.onCurrentEditorChangedEmitter.event;
  protected readonly recentlyVisibleIds: string[] = [];

  protected _activeEditor: EditorWidget | undefined;

  /**
   * The active editor.
   * If there is an active editor (one that has focus), active and current are the same.
   */
  get activeEditor(): EditorWidget | undefined {
    return this._activeEditor;
  }

  protected _currentEditor: EditorWidget | undefined;

  /**
   * The most recently activated editor (which might not have the focus anymore, hence it is not active).
   * If no editor has focus, e.g. when a context menu is shown, the active editor is `undefined`, but current might be the editor that was active before the menu popped up.
   */
  get currentEditor(): EditorWidget | undefined {
    return this._currentEditor;
  }

  protected get recentlyVisible(): EditorWidget | undefined {
    const id = this.recentlyVisibleIds[0];
    return id && this.all.find(w => w.id === id) || undefined;
  }

  getByUri(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget | undefined> {
    return this.getWidget(uri, options);
  }

  getOrCreateByUri(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget> {
    return this.getOrCreateWidget(uri, options);
  }

  canHandle(uri: URI, options?: WidgetOpenerOptions): number {
    return 100;
  }

  // This override only serves to inform external callers that they can use EditorOpenerOptions.
  open(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget> {
    return super.open(uri, options);
  }

  /**
   * Opens an editor to the side of the current editor. Defaults to opening to the right.
   * To modify direction, pass options with `{widgetOptions: {mode: ...}}`
   */
  openToSide(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget> {
    const counter = this.createCounterForUri(uri);
    const splitOptions: EditorOpenerOptions = {widgetOptions: {mode: 'split-right'}, ...options, counter};
    return this.open(uri, splitOptions);
  }

  @postConstruct()
  protected init(): void {
    super.init();
    this.shell.onDidChangeActiveWidget(() => this.updateActiveEditor());
    this.shell.onDidChangeCurrentWidget(() => this.updateCurrentEditor());
    this.onCreated(widget => {
      widget.onDidChangeVisibility(() => {
        if (widget.isVisible) {
          this.addRecentlyVisible(widget);
        }
        this.updateCurrentEditor();
      });
      this.checkCounterForWidget(widget);
      widget.disposed.connect(() => {
        this.removeFromCounter(widget);
        this.removeRecentlyVisible(widget);
        this.updateCurrentEditor();
      });
    });
    for (const widget of this.all) {
      if (widget.isVisible) {
        this.addRecentlyVisible(widget);
      }
    }
    this.updateCurrentEditor();
  }

  protected tryGetPendingWidget(uri: URI, options?: EditorOpenerOptions): MaybePromise<EditorWidget> | undefined {
    const editorPromise = super.tryGetPendingWidget(uri, options);
    if (editorPromise) {
      // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
      if (!(editorPromise instanceof Widget)) {
        editorPromise.then(editor => this.revealSelection(editor, options, uri));
      } else {
        this.revealSelection(editorPromise, options);
      }
    }
    return editorPromise;
  }

  protected async getWidget(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget | undefined> {
    const editor = await super.getWidget(uri, options);
    if (editor) {
      // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
      this.revealSelection(editor, options, uri);
    }
    return editor;
  }

  protected async getOrCreateWidget(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget> {
    const editor = await super.getOrCreateWidget(uri, options);
    // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
    this.revealSelection(editor, options, uri);
    return editor;
  }

  protected addRecentlyVisible(widget: EditorWidget): void {
    this.removeRecentlyVisible(widget);
    this.recentlyVisibleIds.unshift(widget.id);
  }

  protected removeRecentlyVisible(widget: EditorWidget): void {
    const index = this.recentlyVisibleIds.indexOf(widget.id);
    if (index !== -1) {
      this.recentlyVisibleIds.splice(index, 1);
    }
  }

  protected setActiveEditor(active: EditorWidget | undefined): void {
    if (this._activeEditor !== active) {
      this._activeEditor = active;
      this.onActiveEditorChangedEmitter.fire(this._activeEditor);
    }
  }

  protected updateActiveEditor(): void {
    const widget = this.shell.activeWidget;
    if (widget instanceof EditorWidget) {
      this.addRecentlyVisible(widget);
      this.setActiveEditor(widget);
    } else {
      this.setActiveEditor(undefined);
    }
  }

  protected setCurrentEditor(current: EditorWidget | undefined): void {
    if (this._currentEditor !== current) {
      this._currentEditor = current;
      this.onCurrentEditorChangedEmitter.fire(this._currentEditor);
    }
  }

  protected updateCurrentEditor(): void {
    const widget = this.shell.currentWidget;
    if (widget instanceof EditorWidget) {
      this.setCurrentEditor(widget);
    } else if (!this._currentEditor || !this._currentEditor.isVisible || this.currentEditor !== this.recentlyVisible) {
      this.setCurrentEditor(this.recentlyVisible);
    }
  }

  protected revealSelection(widget: EditorWidget, input?: EditorOpenerOptions, uri?: URI): void {
    let inputSelection = input?.selection;
    if (!inputSelection && uri) {
      const match = /^L?(\d+)(?:,(\d+))?/.exec(uri.fragment);
      if (match) {
        // support file:///some/file.js#73,84
        // support file:///some/file.js#L73
        inputSelection = {
          start: {
            line: parseInt(match[1]) - 1,
            character: match[2] ? parseInt(match[2]) - 1 : 0
          }
        };
      }
    }
    if (inputSelection) {
      const editor = widget.editor;
      const selection = this.getSelection(widget, inputSelection);
      if (Position.is(selection)) {
        editor.cursor = selection;
        editor.revealPosition(selection);
      } else if (Range.is(selection)) {
        editor.cursor = selection.end;
        editor.selection = selection;
        editor.revealRange(selection);
      }
    }
  }

  protected getSelection(widget: EditorWidget, selection: RecursivePartial<Range>): Range | Position | undefined {
    const {start, end} = selection;
    const line = start && start.line !== undefined && start.line >= 0 ? start.line : undefined;
    if (line === undefined) {
      return undefined;
    }
    const character = start && start.character !== undefined && start.character >= 0 ? start.character : widget.editor.document.getLineMaxColumn(line);
    const endLine = end && end.line !== undefined && end.line >= 0 ? end.line : undefined;
    if (endLine === undefined) {
      return {line, character};
    }
    const endCharacter = end && end.character !== undefined && end.character >= 0 ? end.character : widget.editor.document.getLineMaxColumn(endLine);
    return {
      start: {line, character},
      end: {line: endLine, character: endCharacter}
    };
  }

  protected removeFromCounter(widget: EditorWidget): void {
    const {id, uri} = this.extractIdFromWidget(widget);
    if (uri && !Number.isNaN(id)) {
      let max = -Infinity;
      this.all.forEach(editor => {
        const candidateID = this.extractIdFromWidget(editor);
        if ((candidateID.uri === uri) && (candidateID.id > max)) {
          max = candidateID.id!;
        }
      });

      if (max > -Infinity) {
        this.editorCounters.set(uri, max);
      } else {
        this.editorCounters.delete(uri);
      }
    }
  }

  protected extractIdFromWidget(widget: EditorWidget): WidgetId {
    const uri = widget.editor.uri.toString();
    const id = Number(widget.id.slice(widget.id.lastIndexOf(':') + 1));
    return {id, uri};
  }

  protected checkCounterForWidget(widget: EditorWidget): void {
    const {id, uri} = this.extractIdFromWidget(widget);
    const numericalId = Number(id);
    if (uri && !Number.isNaN(numericalId)) {
      const highestKnownId = this.editorCounters.get(uri) ?? -Infinity;
      if (numericalId > highestKnownId) {
        this.editorCounters.set(uri, numericalId);
      }
    }
  }

  protected createCounterForUri(uri: URI): number {
    const identifier = uri.toString();
    const next = (this.editorCounters.get(identifier) ?? 0) + 1;
    return next;
  }

  protected getCounterForUri(uri: URI): number | undefined {
    const idWithoutCounter = EditorWidgetFactory.createID(uri);
    const counterOfMostRecentlyVisibleEditor = this.recentlyVisibleIds.find(id => id.startsWith(idWithoutCounter))?.slice(idWithoutCounter.length + 1);
    return counterOfMostRecentlyVisibleEditor === undefined ? undefined : parseInt(counterOfMostRecentlyVisibleEditor);
  }

  protected getOrCreateCounterForUri(uri: URI): number {
    return this.getCounterForUri(uri) ?? this.createCounterForUri(uri);
  }

  protected createWidgetOptions(uri: URI, options?: EditorOpenerOptions): NavigatableWidgetOptions {
    const navigatableOptions = super.createWidgetOptions(uri, options);
    navigatableOptions.counter = options?.counter ?? this.getOrCreateCounterForUri(uri);
    return navigatableOptions;
  }
}
