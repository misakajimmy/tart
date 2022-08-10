var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, postConstruct } from 'inversify';
import { EditorWidget } from './editor-widget';
import { NavigatableWidgetOpenHandler, Widget } from '@tart/core';
import { Emitter } from '@tart/core/lib/common';
import { EditorWidgetFactory } from './editor-widget-factory';
import { Position, Range } from './editor';
let EditorManager = class EditorManager extends NavigatableWidgetOpenHandler {
    constructor() {
        super(...arguments);
        this.id = EditorWidgetFactory.ID;
        this.label = 'Code Editor';
        this.editorCounters = new Map();
        this.onActiveEditorChangedEmitter = new Emitter();
        /**
         * Emit when the active editor is changed.
         */
        this.onActiveEditorChanged = this.onActiveEditorChangedEmitter.event;
        this.onCurrentEditorChangedEmitter = new Emitter();
        /**
         * Emit when the current editor is changed.
         */
        this.onCurrentEditorChanged = this.onCurrentEditorChangedEmitter.event;
        this.recentlyVisibleIds = [];
    }
    /**
     * The active editor.
     * If there is an active editor (one that has focus), active and current are the same.
     */
    get activeEditor() {
        return this._activeEditor;
    }
    /**
     * The most recently activated editor (which might not have the focus anymore, hence it is not active).
     * If no editor has focus, e.g. when a context menu is shown, the active editor is `undefined`, but current might be the editor that was active before the menu popped up.
     */
    get currentEditor() {
        return this._currentEditor;
    }
    get recentlyVisible() {
        const id = this.recentlyVisibleIds[0];
        return id && this.all.find(w => w.id === id) || undefined;
    }
    getByUri(uri, options) {
        return this.getWidget(uri, options);
    }
    getOrCreateByUri(uri, options) {
        return this.getOrCreateWidget(uri, options);
    }
    canHandle(uri, options) {
        return 100;
    }
    // This override only serves to inform external callers that they can use EditorOpenerOptions.
    open(uri, options) {
        return super.open(uri, options);
    }
    /**
     * Opens an editor to the side of the current editor. Defaults to opening to the right.
     * To modify direction, pass options with `{widgetOptions: {mode: ...}}`
     */
    openToSide(uri, options) {
        const counter = this.createCounterForUri(uri);
        const splitOptions = Object.assign(Object.assign({ widgetOptions: { mode: 'split-right' } }, options), { counter });
        return this.open(uri, splitOptions);
    }
    init() {
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
    tryGetPendingWidget(uri, options) {
        const editorPromise = super.tryGetPendingWidget(uri, options);
        if (editorPromise) {
            // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
            if (!(editorPromise instanceof Widget)) {
                editorPromise.then(editor => this.revealSelection(editor, options, uri));
            }
            else {
                this.revealSelection(editorPromise, options);
            }
        }
        return editorPromise;
    }
    async getWidget(uri, options) {
        const editor = await super.getWidget(uri, options);
        if (editor) {
            // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
            this.revealSelection(editor, options, uri);
        }
        return editor;
    }
    async getOrCreateWidget(uri, options) {
        const editor = await super.getOrCreateWidget(uri, options);
        // Reveal selection before attachment to manage nav stack. (https://github.com/eclipse-wm/wm/issues/8955)
        this.revealSelection(editor, options, uri);
        return editor;
    }
    addRecentlyVisible(widget) {
        this.removeRecentlyVisible(widget);
        this.recentlyVisibleIds.unshift(widget.id);
    }
    removeRecentlyVisible(widget) {
        const index = this.recentlyVisibleIds.indexOf(widget.id);
        if (index !== -1) {
            this.recentlyVisibleIds.splice(index, 1);
        }
    }
    setActiveEditor(active) {
        if (this._activeEditor !== active) {
            this._activeEditor = active;
            this.onActiveEditorChangedEmitter.fire(this._activeEditor);
        }
    }
    updateActiveEditor() {
        const widget = this.shell.activeWidget;
        if (widget instanceof EditorWidget) {
            this.addRecentlyVisible(widget);
            this.setActiveEditor(widget);
        }
        else {
            this.setActiveEditor(undefined);
        }
    }
    setCurrentEditor(current) {
        if (this._currentEditor !== current) {
            this._currentEditor = current;
            this.onCurrentEditorChangedEmitter.fire(this._currentEditor);
        }
    }
    updateCurrentEditor() {
        const widget = this.shell.currentWidget;
        if (widget instanceof EditorWidget) {
            this.setCurrentEditor(widget);
        }
        else if (!this._currentEditor || !this._currentEditor.isVisible || this.currentEditor !== this.recentlyVisible) {
            this.setCurrentEditor(this.recentlyVisible);
        }
    }
    revealSelection(widget, input, uri) {
        let inputSelection = input === null || input === void 0 ? void 0 : input.selection;
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
            }
            else if (Range.is(selection)) {
                editor.cursor = selection.end;
                editor.selection = selection;
                editor.revealRange(selection);
            }
        }
    }
    getSelection(widget, selection) {
        const { start, end } = selection;
        const line = start && start.line !== undefined && start.line >= 0 ? start.line : undefined;
        if (line === undefined) {
            return undefined;
        }
        const character = start && start.character !== undefined && start.character >= 0 ? start.character : widget.editor.document.getLineMaxColumn(line);
        const endLine = end && end.line !== undefined && end.line >= 0 ? end.line : undefined;
        if (endLine === undefined) {
            return { line, character };
        }
        const endCharacter = end && end.character !== undefined && end.character >= 0 ? end.character : widget.editor.document.getLineMaxColumn(endLine);
        return {
            start: { line, character },
            end: { line: endLine, character: endCharacter }
        };
    }
    removeFromCounter(widget) {
        const { id, uri } = this.extractIdFromWidget(widget);
        if (uri && !Number.isNaN(id)) {
            let max = -Infinity;
            this.all.forEach(editor => {
                const candidateID = this.extractIdFromWidget(editor);
                if ((candidateID.uri === uri) && (candidateID.id > max)) {
                    max = candidateID.id;
                }
            });
            if (max > -Infinity) {
                this.editorCounters.set(uri, max);
            }
            else {
                this.editorCounters.delete(uri);
            }
        }
    }
    extractIdFromWidget(widget) {
        const uri = widget.editor.uri.toString();
        const id = Number(widget.id.slice(widget.id.lastIndexOf(':') + 1));
        return { id, uri };
    }
    checkCounterForWidget(widget) {
        var _a;
        const { id, uri } = this.extractIdFromWidget(widget);
        const numericalId = Number(id);
        if (uri && !Number.isNaN(numericalId)) {
            const highestKnownId = (_a = this.editorCounters.get(uri)) !== null && _a !== void 0 ? _a : -Infinity;
            if (numericalId > highestKnownId) {
                this.editorCounters.set(uri, numericalId);
            }
        }
    }
    createCounterForUri(uri) {
        var _a;
        const identifier = uri.toString();
        const next = ((_a = this.editorCounters.get(identifier)) !== null && _a !== void 0 ? _a : 0) + 1;
        return next;
    }
    getCounterForUri(uri) {
        var _a;
        const idWithoutCounter = EditorWidgetFactory.createID(uri);
        const counterOfMostRecentlyVisibleEditor = (_a = this.recentlyVisibleIds.find(id => id.startsWith(idWithoutCounter))) === null || _a === void 0 ? void 0 : _a.slice(idWithoutCounter.length + 1);
        return counterOfMostRecentlyVisibleEditor === undefined ? undefined : parseInt(counterOfMostRecentlyVisibleEditor);
    }
    getOrCreateCounterForUri(uri) {
        var _a;
        return (_a = this.getCounterForUri(uri)) !== null && _a !== void 0 ? _a : this.createCounterForUri(uri);
    }
    createWidgetOptions(uri, options) {
        var _a;
        const navigatableOptions = super.createWidgetOptions(uri, options);
        navigatableOptions.counter = (_a = options === null || options === void 0 ? void 0 : options.counter) !== null && _a !== void 0 ? _a : this.getOrCreateCounterForUri(uri);
        return navigatableOptions;
    }
};
__decorate([
    postConstruct()
], EditorManager.prototype, "init", null);
EditorManager = __decorate([
    injectable()
], EditorManager);
export { EditorManager };

//# sourceMappingURL=../../lib/browser/editor-manager.js.map
