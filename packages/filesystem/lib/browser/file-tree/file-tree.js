var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TreeImpl } from '@tart/core';
import { MessageService } from '@tart/core/lib/common';
import { FileOperationError } from '../../common/files';
import { inject, injectable } from 'inversify';
import { FileService } from '../file-service';
let FileTree = class FileTree extends TreeImpl {
    async resolveChildren(parent) {
        if (FileStatNode.is(parent)) {
            const fileStat = await this.resolveFileStat(parent);
            if (fileStat) {
                return this.toNodes(fileStat, parent);
            }
            return [];
        }
        return super.resolveChildren(parent);
    }
    async resolveFileStat(node) {
        try {
            const fileStat = await this.fileService.resolve(node.uri);
            node.fileStat = fileStat;
            return fileStat;
        }
        catch (e) {
            if (!(e instanceof FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                this.messagingService.error(e.message);
            }
            return undefined;
        }
    }
    async toNodes(fileStat, parent) {
        if (!fileStat.children) {
            return [];
        }
        const result = await Promise.all(fileStat.children.map(async (child) => this.toNode(child, parent)));
        return result.sort(DirNode.compare);
    }
    toNode(fileStat, parent) {
        const uri = fileStat.resource;
        const id = this.toNodeId(uri, parent);
        const node = this.getNode(id);
        if (fileStat.isDirectory) {
            if (DirNode.is(node)) {
                node.fileStat = fileStat;
                return node;
            }
            return {
                id, uri, fileStat, parent,
                expanded: false,
                selected: false,
                children: []
            };
        }
        if (FileNode.is(node)) {
            node.fileStat = fileStat;
            return node;
        }
        return {
            id, uri, fileStat, parent,
            selected: false
        };
    }
    toNodeId(uri, parent) {
        return uri.path.toString();
    }
};
__decorate([
    inject(FileService)
], FileTree.prototype, "fileService", void 0);
__decorate([
    inject(MessageService)
], FileTree.prototype, "messagingService", void 0);
FileTree = __decorate([
    injectable()
], FileTree);
export { FileTree };
export var FileStatNode;
(function (FileStatNode) {
    function is(node) {
        return !!node && 'fileStat' in node;
    }
    FileStatNode.is = is;
    function getUri(node) {
        if (is(node)) {
            return node.fileStat.resource.toString();
        }
        return undefined;
    }
    FileStatNode.getUri = getUri;
})(FileStatNode || (FileStatNode = {}));
export var FileStatNodeData;
(function (FileStatNodeData) {
    function is(node) {
        return !!node && 'uri' in node && ('fileStat' in node || 'stat' in node);
    }
    FileStatNodeData.is = is;
})(FileStatNodeData || (FileStatNodeData = {}));
export var FileNode;
(function (FileNode) {
    function is(node) {
        return FileStatNode.is(node) && !node.fileStat.isDirectory;
    }
    FileNode.is = is;
})(FileNode || (FileNode = {}));
export var DirNode;
(function (DirNode) {
    function is(node) {
        return FileStatNode.is(node) && node.fileStat.isDirectory;
    }
    DirNode.is = is;
    function compare(node, node2) {
        return DirNode.dirCompare(node, node2) || uriCompare(node, node2);
    }
    DirNode.compare = compare;
    function uriCompare(node, node2) {
        if (FileStatNode.is(node)) {
            if (FileStatNode.is(node2)) {
                return node.uri.displayName.localeCompare(node2.uri.displayName);
            }
            return 1;
        }
        if (FileStatNode.is(node2)) {
            return -1;
        }
        return 0;
    }
    DirNode.uriCompare = uriCompare;
    function dirCompare(node, node2) {
        const a = DirNode.is(node) ? 1 : 0;
        const b = DirNode.is(node2) ? 1 : 0;
        return b - a;
    }
    DirNode.dirCompare = dirCompare;
    function createRoot(fileStat) {
        const uri = fileStat.resource;
        const id = uri.toString();
        return {
            id, uri, fileStat,
            visible: true,
            parent: undefined,
            children: [],
            expanded: true,
            selected: false
        };
    }
    DirNode.createRoot = createRoot;
    function getContainingDir(node) {
        let containing = node;
        while (!!containing && !is(containing)) {
            containing = containing.parent;
        }
        return containing;
    }
    DirNode.getContainingDir = getContainingDir;
})(DirNode || (DirNode = {}));

//# sourceMappingURL=../../../lib/browser/file-tree/file-tree.js.map
