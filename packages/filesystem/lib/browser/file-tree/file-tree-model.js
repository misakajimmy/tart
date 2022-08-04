var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ConfirmDialog, LabelProvider, TreeModelImpl } from '@tart/core';
import { inject, injectable, postConstruct } from 'inversify';
import { FileService } from '../file-service';
import { DirNode, FileNode, FileStatNode } from './file-tree';
import { MessageService } from '@tart/core/lib/common';
import { FileSystemUtils } from './filesystem-utils';
import { FileOperationError } from '../../common/files';
let FileTreeModel = class FileTreeModel extends TreeModelImpl {
    get location() {
        const root = this.root;
        if (FileStatNode.is(root)) {
            return root.uri;
        }
        return undefined;
    }
    set location(uri) {
        if (uri) {
            this.fileService.resolve(uri).then(fileStat => {
                if (fileStat) {
                    const node = DirNode.createRoot(fileStat);
                    this.navigateTo(node);
                }
            }).catch(() => {
                // no-op, allow failures for file dialog text input
            });
        }
        else {
            this.navigateTo(undefined);
        }
    }
    get selectedFileStatNodes() {
        return this.selectedNodes.filter(FileStatNode.is);
    }
    async drives() {
        try {
            // const drives = await this.environments.getDrives();
            // return drives.map(uri => new URI(uri));
            return [];
        }
        catch (e) {
            return [];
        }
    }
    *getNodesByUri(uri) {
        const node = this.getNode(uri.toString());
        if (node) {
            yield node;
        }
    }
    async copy(source, target) {
        let targetUri = target.uri.resolve(source.path.base);
        try {
            if (source.path.toString() === target.uri.path.toString()) {
                const parent = await this.fileService.resolve(source.parent);
                const name = source.path.name + '_copy';
                targetUri = FileSystemUtils.generateUniqueResourceURI(source.parent, parent, name, source.path.ext);
            }
            await this.fileService.copy(source, targetUri);
        }
        catch (e) {
            this.messageService.error(e.message);
        }
        return targetUri;
    }
    /**
     * Move the given source file or directory to the given target directory.
     */
    async move(source, target) {
        if (DirNode.is(target) && FileStatNode.is(source)) {
            const name = source.fileStat.name;
            const targetUri = target.uri.resolve(name);
            try {
                await this.fileService.move(source.uri, targetUri);
                return targetUri;
            }
            catch (e) {
                console.log(e);
                if (e instanceof FileOperationError && e.fileOperationResult === 4 /* FileOperationResult.FILE_MOVE_CONFLICT */) {
                    const fileName = this.labelProvider.getName(source);
                    if (await this.shouldReplace(fileName)) {
                        try {
                            await this.fileService.move(source.uri, targetUri, { overwrite: true });
                            return targetUri;
                        }
                        catch (e2) {
                            this.messageService.error(e2.message);
                        }
                    }
                }
                else {
                    this.messageService.error(e.message);
                }
            }
        }
        return undefined;
    }
    init() {
        super.init();
        this.toDispose.push(this.fileService.onDidFilesChange(changes => this.onFilesChanged(changes)));
        this.toDispose.push(this.fileService.onDidRunOperation(event => this.onDidMove(event)));
    }
    /**
     * to workaround https://github.com/Axosoft/nsfw/issues/42
     */
    onDidMove(event) {
        if (!event.isOperation(2 /* FileOperation.MOVE */)) {
            return;
        }
        if (event.resource.parent.toString() === event.target.resource.parent.toString()) {
            // file rename
            return;
        }
        this.refreshAffectedNodes([
            event.resource,
            event.target.resource
        ]);
    }
    onFilesChanged(changes) {
        if (!this.refreshAffectedNodes(this.getAffectedUris(changes))) {
            this.refresh();
        }
    }
    isRootAffected(changes) {
        const root = this.root;
        if (FileStatNode.is(root)) {
            return changes.contains(root.uri, 1 /* FileChangeType.ADDED */) || changes.contains(root.uri, 0 /* FileChangeType.UPDATED */);
        }
        return false;
    }
    getAffectedUris(changes) {
        return changes.changes.filter(change => !this.isFileContentChanged(change)).map(change => change.resource);
    }
    isFileContentChanged(change) {
        return change.type === 0 /* FileChangeType.UPDATED */ && FileNode.is(this.getNodesByUri(change.resource).next().value);
    }
    refreshAffectedNodes(uris) {
        const nodes = this.getAffectedNodes(uris);
        for (const node of nodes.values()) {
            this.refresh(node);
        }
        return nodes.size !== 0;
    }
    getAffectedNodes(uris) {
        const nodes = new Map();
        for (const uri of uris) {
            for (const node of this.getNodesByUri(uri.parent)) {
                if (DirNode.is(node) && node.expanded) {
                    nodes.set(node.id, node);
                }
            }
        }
        return nodes;
    }
    async shouldReplace(fileName) {
        const dialog = new ConfirmDialog({
            title: 'Replace file',
            msg: `File '${fileName}' already exists in the destination folder. Do you want to replace it?`,
            ok: 'Yes',
            cancel: 'No'
        });
        return !!await dialog.open();
    }
};
__decorate([
    inject(LabelProvider)
], FileTreeModel.prototype, "labelProvider", void 0);
__decorate([
    inject(FileService)
], FileTreeModel.prototype, "fileService", void 0);
__decorate([
    inject(MessageService)
], FileTreeModel.prototype, "messageService", void 0);
__decorate([
    postConstruct()
], FileTreeModel.prototype, "init", null);
FileTreeModel = __decorate([
    injectable()
], FileTreeModel);
export { FileTreeModel };

//# sourceMappingURL=../../../lib/browser/file-tree/file-tree-model.js.map
