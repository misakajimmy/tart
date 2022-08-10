import { BaseWidget } from '@tart/core';
import { Disposable } from '@tart/core/lib/common';
export class EditorWidget extends BaseWidget {
    constructor(editor, selectionService) {
        super(editor);
        this.editor = editor;
        this.selectionService = selectionService;
        this.addClass('wm-editor');
        this.toDispose.push(this.editor);
        this.toDispose.push(this.editor.onSelectionChanged(() => this.setSelection()));
        this.toDispose.push(this.editor.onFocusChanged(() => this.setSelection()));
        this.toDispose.push(Disposable.create(() => {
            if (this.selectionService.selection === this.editor) {
                this.selectionService.selection = undefined;
            }
        }));
    }
    get saveable() {
        return this.editor.document;
    }
    get onDispose() {
        return this.toDispose.onDispose;
    }
    setSelection() {
        if (this.editor.isFocused() && this.selectionService.selection !== this.editor) {
            this.selectionService.selection = this.editor;
        }
    }
    getResourceUri() {
        return this.editor.getResourceUri();
    }
    createMoveToUri(resourceUri) {
        return this.editor.createMoveToUri(resourceUri);
    }
    storeState() {
        return this.editor.storeViewState();
    }
    restoreState(oldState) {
        this.editor.restoreViewState(oldState);
    }
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        this.editor.focus();
        this.selectionService.selection = this.editor;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        if (this.isVisible) {
            this.editor.refresh();
        }
    }
    onAfterShow(msg) {
        super.onAfterShow(msg);
        this.editor.refresh();
    }
    onResize(msg) {
        if (msg.width < 0 || msg.height < 0) {
            this.editor.resizeToFit();
        }
        else {
            this.editor.setSize(msg);
        }
    }
}

//# sourceMappingURL=../../lib/browser/editor-widget.js.map
