var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * File tree root node for multi-root workspaces.
 */
import { CompositeTreeNode } from '@tart/core';
import { DirNode, FileTree } from '@tart/filesystem';
import { inject, injectable, postConstruct } from 'inversify';
import { FileNavigatorFilter } from './navigator-filter';
let FileNavigatorTree = class FileNavigatorTree extends FileTree {
    async resolveChildren(parent) {
        if (WorkspaceNode.is(parent)) {
            return parent.children;
        }
        return this.filter.filter(super.resolveChildren(parent));
    }
    createId(root, uri) {
        const id = super.toNodeId(uri, root);
        return id === root.id ? id : `${root.id}:${id}`;
    }
    async createWorkspaceRoot(rootFolder, workspaceNode) {
        const node = this.toNode(rootFolder, workspaceNode);
        Object.assign(node, {
            visible: workspaceNode.name !== WorkspaceNode.name,
        });
        return node;
    }
    init() {
        this.toDispose.push(this.filter.onFilterChanged(() => this.refresh()));
    }
    toNodeId(uri, parent) {
        const workspaceRootNode = WorkspaceRootNode.find(parent);
        if (workspaceRootNode) {
            return this.createId(workspaceRootNode, uri);
        }
        return super.toNodeId(uri, parent);
    }
};
__decorate([
    inject(FileNavigatorFilter)
], FileNavigatorTree.prototype, "filter", void 0);
__decorate([
    postConstruct()
], FileNavigatorTree.prototype, "init", null);
FileNavigatorTree = __decorate([
    injectable()
], FileNavigatorTree);
export { FileNavigatorTree };
export var WorkspaceNode;
(function (WorkspaceNode) {
    WorkspaceNode.id = 'WorkspaceNodeId';
    WorkspaceNode.name = 'WorkspaceNode';
    function is(node) {
        return CompositeTreeNode.is(node) && node.id === WorkspaceNode.id;
    }
    WorkspaceNode.is = is;
    /**
     * Create a `WorkspaceNode` that can be used as a `Tree` root.
     */
    function createRoot(multiRootName) {
        return {
            id: WorkspaceNode.id,
            name: multiRootName || WorkspaceNode.name,
            parent: undefined,
            children: [],
            visible: false,
            selected: false
        };
    }
    WorkspaceNode.createRoot = createRoot;
})(WorkspaceNode || (WorkspaceNode = {}));
export var WorkspaceRootNode;
(function (WorkspaceRootNode) {
    function is(node) {
        return DirNode.is(node) && WorkspaceNode.is(node.parent);
    }
    WorkspaceRootNode.is = is;
    function find(node) {
        if (node) {
            if (is(node)) {
                return node;
            }
            return find(node.parent);
        }
    }
    WorkspaceRootNode.find = find;
})(WorkspaceRootNode || (WorkspaceRootNode = {}));

//# sourceMappingURL=../../lib/browser/navigator-tree.js.map
