import { BaseWidget, Message, Navigatable, Saveable, SaveableSource, Widget } from '@tart/core';
import { TextEditor } from './editor';
import { Event, SelectionService } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { StatefulWidget } from '@tart/core/lib/browser/shell/shell-layout-restorer';
export declare class EditorWidget extends BaseWidget implements SaveableSource, Navigatable, StatefulWidget {
    readonly editor: TextEditor;
    protected readonly selectionService: SelectionService;
    constructor(editor: TextEditor, selectionService: SelectionService);
    get saveable(): Saveable;
    get onDispose(): Event<void>;
    setSelection(): void;
    getResourceUri(): URI | undefined;
    createMoveToUri(resourceUri: URI): URI | undefined;
    storeState(): object;
    restoreState(oldState: object): void;
    protected onActivateRequest(msg: Message): void;
    protected onAfterAttach(msg: Message): void;
    protected onAfterShow(msg: Message): void;
    protected onResize(msg: Widget.ResizeMessage): void;
}
