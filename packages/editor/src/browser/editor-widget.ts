import {BaseWidget, Message, Navigatable, Saveable, SaveableSource, Widget} from '@tart/core';
import {TextEditor} from './editor';
import {Disposable, Event, SelectionService} from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import {StatefulWidget} from '@tart/core/lib/browser/shell/shell-layout-restorer';

export class EditorWidget extends BaseWidget implements SaveableSource, Navigatable, StatefulWidget {

  constructor(
      readonly editor: TextEditor,
      protected readonly selectionService: SelectionService,
  ) {
    super(editor);
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

  get saveable(): Saveable {
    return this.editor.document;
  }

  get onDispose(): Event<void> {
    return this.toDispose.onDispose;
  }

  setSelection(): void {
    if (this.editor.isFocused() && this.selectionService.selection !== this.editor) {
      this.selectionService.selection = this.editor;
    }
  }

  getResourceUri(): URI | undefined {
    return this.editor.getResourceUri();
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    return this.editor.createMoveToUri(resourceUri);
  }

  storeState(): object {
    return this.editor.storeViewState();
  }

  restoreState(oldState: object): void {
    this.editor.restoreViewState(oldState);
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.editor.focus();
    this.selectionService.selection = this.editor;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    if (this.isVisible) {
      this.editor.refresh();
    }
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.editor.refresh();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    if (msg.width < 0 || msg.height < 0) {
      this.editor.resizeToFit();
    } else {
      this.editor.setSize(msg);
    }
  }

}
