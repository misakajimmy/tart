import { FileTreeModel } from '../file-tree';
import { Emitter, Event } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { TreeNode } from '@tart/core/lib/browser';
import { SelectableTreeNode } from '@tart/core';
import { FileDialogTree } from './file-dialog-tree';
export declare class FileDialogModel extends FileTreeModel {
    readonly tree: FileDialogTree;
    protected readonly onDidOpenFileEmitter: Emitter<void>;
    protected _initialLocation: URI | undefined;
    /**
     * Returns the first valid location that was set by calling the `navigateTo` method. Once the initial location has a defined value, it will not change.
     * Can be `undefined`.
     */
    get initialLocation(): URI | undefined;
    private _disableFileSelection;
    set disableFileSelection(isSelectable: boolean);
    get onDidOpenFile(): Event<void>;
    navigateTo(nodeOrId: TreeNode | string | undefined): Promise<TreeNode | undefined>;
    getNextSelectableNode(node?: SelectableTreeNode): SelectableTreeNode | undefined;
    getPrevSelectableNode(node?: SelectableTreeNode): SelectableTreeNode | undefined;
    canNavigateUpward(): boolean;
    protected init(): void;
    protected doOpenNode(node: TreeNode): void;
    private isFileStatNodeSelectable;
}
