import { MenuPath } from '@tart/core/lib/common/menu';
import { ContextMenuRenderer } from '@tart/core/lib/browser';
import IContextMenuService = monaco.editor.IContextMenuService;
import IContextMenuDelegate = monaco.editor.IContextMenuDelegate;
export declare class MonacoContextMenuService implements IContextMenuService {
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    constructor(contextMenuRenderer: ContextMenuRenderer);
    showContextMenu(delegate: IContextMenuDelegate): void;
    protected menuPath(): MenuPath;
}
