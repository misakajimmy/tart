import { FileTreeWidget } from '../file-tree';
import { TreeProps } from '@tart/core/lib/browser';
import { FileDialogModel } from './file-dialog-model';
import { ContextMenuRenderer, NodeProps, TreeNode } from '@tart/core';
export declare const FILE_DIALOG_CLASS = "tart-FileDialog";
export declare const NOT_SELECTABLE_CLASS = "tart-mod-not-selectable";
export declare class FileDialogWidget extends FileTreeWidget {
    readonly props: TreeProps;
    readonly model: FileDialogModel;
    constructor(props: TreeProps, model: FileDialogModel, contextMenuRenderer: ContextMenuRenderer);
    private _disableFileSelection;
    set disableFileSelection(isSelectable: boolean);
    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement>;
    protected createNodeClassNames(node: TreeNode, props: NodeProps): string[];
    protected shouldDisableSelection(node: TreeNode): boolean;
}
