import {inject, injectable, postConstruct} from 'inversify';
import {DirNode, FileNode, FileStatNode, FileTreeModel} from '../file-tree';
import {Emitter, Event} from '@tartjs/core/lib/common';
import URI from '@tartjs/core/lib/common/uri';
import {TreeNode} from '@tartjs/core/lib/browser';
import {SelectableTreeNode} from '@tartjs/core';
import {FileDialogTree} from './file-dialog-tree';

@injectable()
export class FileDialogModel extends FileTreeModel {

    @inject(FileDialogTree) declare readonly tree: FileDialogTree;
    protected readonly onDidOpenFileEmitter = new Emitter<void>();
    protected _initialLocation: URI | undefined;

    /**
     * Returns the first valid location that was set by calling the `navigateTo` method. Once the initial location has a defined value, it will not change.
     * Can be `undefined`.
     */
    get initialLocation(): URI | undefined {
        return this._initialLocation;
    }

    private _disableFileSelection: boolean = false;

    set disableFileSelection(isSelectable: boolean) {
        this._disableFileSelection = isSelectable;
    }

    get onDidOpenFile(): Event<void> {
        return this.onDidOpenFileEmitter.event;
    }

    async navigateTo(nodeOrId: TreeNode | string | undefined): Promise<TreeNode | undefined> {
        const result = await super.navigateTo(nodeOrId);
        if (!this._initialLocation && FileStatNode.is(result)) {
            this._initialLocation = result.uri;
        }
        return result;
    }

    getNextSelectableNode(node: SelectableTreeNode = this.selectedNodes[0]): SelectableTreeNode | undefined {
        let nextNode: SelectableTreeNode | undefined = node;
        do {
            nextNode = super.getNextSelectableNode(nextNode);
        } while (FileStatNode.is(nextNode) && !this.isFileStatNodeSelectable(nextNode));
        return nextNode;
    }

    getPrevSelectableNode(node: SelectableTreeNode = this.selectedNodes[0]): SelectableTreeNode | undefined {
        let prevNode: SelectableTreeNode | undefined = node;
        do {
            prevNode = super.getPrevSelectableNode(prevNode);
        } while (FileStatNode.is(prevNode) && !this.isFileStatNodeSelectable(prevNode));
        return prevNode;
    }

    canNavigateUpward(): boolean {
        const treeRoot = this.tree.root;
        return FileStatNode.is(treeRoot) && !treeRoot.uri.path.isRoot;
    }

    @postConstruct()
    protected init(): void {
        super.init();
        this.toDispose.push(this.onDidOpenFileEmitter);
    }

    protected doOpenNode(node: TreeNode): void {
        if (FileNode.is(node)) {
            this.onDidOpenFileEmitter.fire(undefined);
        } else if (DirNode.is(node)) {
            this.navigateTo(node);
        } else {
            super.doOpenNode(node);
        }
    }

    private isFileStatNodeSelectable(node: FileStatNode): boolean {
        return !(!node.fileStat.isDirectory && this._disableFileSelection);
    }
}
