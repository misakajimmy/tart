var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, postConstruct } from 'inversify';
import { DirNode, FileNode, FileStatNode, FileTreeModel } from '../file-tree';
import { Emitter } from '@tart/core/lib/common';
import { FileDialogTree } from './file-dialog-tree';
let FileDialogModel = class FileDialogModel extends FileTreeModel {
    constructor() {
        super(...arguments);
        this.onDidOpenFileEmitter = new Emitter();
        this._disableFileSelection = false;
    }
    /**
     * Returns the first valid location that was set by calling the `navigateTo` method. Once the initial location has a defined value, it will not change.
     * Can be `undefined`.
     */
    get initialLocation() {
        return this._initialLocation;
    }
    set disableFileSelection(isSelectable) {
        this._disableFileSelection = isSelectable;
    }
    get onDidOpenFile() {
        return this.onDidOpenFileEmitter.event;
    }
    async navigateTo(nodeOrId) {
        const result = await super.navigateTo(nodeOrId);
        if (!this._initialLocation && FileStatNode.is(result)) {
            this._initialLocation = result.uri;
        }
        return result;
    }
    getNextSelectableNode(node = this.selectedNodes[0]) {
        let nextNode = node;
        do {
            nextNode = super.getNextSelectableNode(nextNode);
        } while (FileStatNode.is(nextNode) && !this.isFileStatNodeSelectable(nextNode));
        return nextNode;
    }
    getPrevSelectableNode(node = this.selectedNodes[0]) {
        let prevNode = node;
        do {
            prevNode = super.getPrevSelectableNode(prevNode);
        } while (FileStatNode.is(prevNode) && !this.isFileStatNodeSelectable(prevNode));
        return prevNode;
    }
    canNavigateUpward() {
        const treeRoot = this.tree.root;
        return FileStatNode.is(treeRoot) && !treeRoot.uri.path.isRoot;
    }
    init() {
        super.init();
        this.toDispose.push(this.onDidOpenFileEmitter);
    }
    doOpenNode(node) {
        if (FileNode.is(node)) {
            this.onDidOpenFileEmitter.fire(undefined);
        }
        else if (DirNode.is(node)) {
            this.navigateTo(node);
        }
        else {
            super.doOpenNode(node);
        }
    }
    isFileStatNodeSelectable(node) {
        return !(!node.fileStat.isDirectory && this._disableFileSelection);
    }
};
__decorate([
    inject(FileDialogTree)
], FileDialogModel.prototype, "tree", void 0);
__decorate([
    postConstruct()
], FileDialogModel.prototype, "init", null);
FileDialogModel = __decorate([
    injectable()
], FileDialogModel);
export { FileDialogModel };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-model.js.map
