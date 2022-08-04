import {inject, injectable} from 'inversify';
import {FileStatNode, FileTreeWidget} from '../file-tree';
import {FOCUS_CLASS, SELECTED_CLASS, TreeProps} from '@tart/core/lib/browser';
import {FileDialogModel} from './file-dialog-model';
import {ContextMenuRenderer, NodeProps, TreeNode} from '@tart/core';

export const FILE_DIALOG_CLASS = 'tart-FileDialog';
export const NOT_SELECTABLE_CLASS = 'tart-mod-not-selectable';

@injectable()
export class FileDialogWidget extends FileTreeWidget {

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(FileDialogModel) readonly model: FileDialogModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ) {
        super(props, model, contextMenuRenderer);
        this.addClass(FILE_DIALOG_CLASS);
    }

    private _disableFileSelection: boolean = false;

    set disableFileSelection(isSelectable: boolean) {
        this._disableFileSelection = isSelectable;
        this.model.disableFileSelection = isSelectable;
    }

    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attr = super.createNodeAttributes(node, props) as any;
        if (this.shouldDisableSelection(node)) {
            const keys = Object.keys(attr);
            keys.forEach(k => {
                if (['className', 'style', 'title'].indexOf(k) < 0) {
                    delete attr[k];
                }
            });
        }
        return attr;
    }

    protected createNodeClassNames(node: TreeNode, props: NodeProps): string[] {
        const classNames = super.createNodeClassNames(node, props);
        if (this.shouldDisableSelection(node)) {
            [SELECTED_CLASS, FOCUS_CLASS].forEach(name => {
                const ind = classNames.indexOf(name);
                if (ind >= 0) {
                    classNames.splice(ind, 1);
                }
            });
            classNames.push(NOT_SELECTABLE_CLASS);
        }
        return classNames;
    }

    protected shouldDisableSelection(node: TreeNode): boolean {
        return FileStatNode.is(node) && !node.fileStat.isDirectory && this._disableFileSelection;
    }
}
