var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'inversify';
import React from 'react';
import { CompositeTreeNode, ContextMenuRenderer, TreeNode, TreeProps, TreeViewWelcomeWidget } from '@tart/core';
import { Disposable, DisposableCollection, isCancelled, UriSelection } from '@tart/core/lib/common';
import { IconThemeService } from '@tart/core/lib/browser/icon-theme-service';
import { FileTreeModel } from './file-tree-model';
import { DirNode, FileStatNode, FileStatNodeData } from './file-tree';
import { FileStat, FileType } from '../../common/files';
import URI from '@tart/core/lib/common/uri';
import { FileUploadService } from '../file-upload-service';
export const FILE_TREE_CLASS = 'tart-FileTree';
export const FILE_STAT_NODE_CLASS = 'tart-FileStatNode';
export const DIR_NODE_CLASS = 'tart-DirNode';
export const FILE_STAT_ICON_CLASS = 'tart-FileStatIcon';
let FileTreeWidget = class FileTreeWidget extends TreeViewWelcomeWidget {
    constructor(props, model, contextMenuRenderer) {
        super(props, model, contextMenuRenderer);
        this.props = props;
        this.model = model;
        this.toCancelNodeExpansion = new DisposableCollection();
        this.addClass(FILE_TREE_CLASS);
        this.toDispose.push(this.toCancelNodeExpansion);
    }
    get hidesExplorerArrows() {
        const theme = this.iconThemeService.getDefinition(this.iconThemeService.current);
        return !!theme && !!theme.hidesExplorerArrows;
    }
    createNodeClassNames(node, props) {
        const classNames = super.createNodeClassNames(node, props);
        if (FileStatNode.is(node)) {
            classNames.push(FILE_STAT_NODE_CLASS);
        }
        if (DirNode.is(node)) {
            classNames.push(DIR_NODE_CLASS);
        }
        return classNames;
    }
    renderIcon(node, props) {
        const icon = this.toNodeIcon(node);
        if (icon) {
            return React.createElement("div", { className: icon + ' file-icon' });
        }
        // eslint-disable-next-line no-null/no-null
        return null;
    }
    createContainerAttributes() {
        const attrs = super.createContainerAttributes();
        return Object.assign(Object.assign({}, attrs), { onDragEnter: event => this.handleDragEnterEvent(this.model.root, event), onDragOver: event => this.handleDragOverEvent(this.model.root, event), onDragLeave: event => this.handleDragLeaveEvent(this.model.root, event), onDrop: event => this.handleDropEvent(this.model.root, event) });
    }
    createNodeAttributes(node, props) {
        const elementAttrs = super.createNodeAttributes(node, props);
        return Object.assign(Object.assign({}, elementAttrs), { draggable: FileStatNode.is(node), onDragStart: event => this.handleDragStartEvent(node, event), onDragEnter: event => this.handleDragEnterEvent(node, event), onDragOver: event => this.handleDragOverEvent(node, event), onDragLeave: event => this.handleDragLeaveEvent(node, event), onDrop: event => this.handleDropEvent(node, event), title: this.getNodeTooltip(node) });
    }
    getNodeTooltip(node) {
        const uri = UriSelection.getUri(node);
        return uri ? uri.path.toString() : undefined;
    }
    handleDragStartEvent(node, event) {
        event.stopPropagation();
        let selectedNodes;
        if (this.model.selectedNodes.find(selected => TreeNode.equals(selected, node))) {
            selectedNodes = [...this.model.selectedNodes];
        }
        else {
            selectedNodes = [node];
        }
        this.setSelectedTreeNodesAsData(event.dataTransfer, node, selectedNodes);
        if (event.dataTransfer) {
            let label;
            if (selectedNodes.length === 1) {
                label = this.toNodeName(node);
            }
            else {
                label = String(selectedNodes.length);
            }
            const dragImage = document.createElement('div');
            dragImage.className = 'tart-file-tree-drag-image';
            dragImage.textContent = label;
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, -10, -10);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    }
    handleDragEnterEvent(node, event) {
        event.preventDefault();
        event.stopPropagation();
        this.toCancelNodeExpansion.dispose();
        const containing = DirNode.getContainingDir(node);
        if (!!containing && !containing.selected) {
            this.model.selectNode(containing);
        }
    }
    handleDragOverEvent(node, event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.toCancelNodeExpansion.disposed) {
            return;
        }
        const timer = setTimeout(() => {
            const containing = DirNode.getContainingDir(node);
            if (!!containing && !containing.expanded) {
                this.model.expandNode(containing);
            }
        }, 500);
        this.toCancelNodeExpansion.push(Disposable.create(() => clearTimeout(timer)));
    }
    handleDragLeaveEvent(node, event) {
        event.preventDefault();
        event.stopPropagation();
        this.toCancelNodeExpansion.dispose();
    }
    async handleDropEvent(node, event) {
        try {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            const containing = this.getDropTargetDirNode(node);
            if (containing) {
                const resources = this.getSelectedTreeNodesFromData(event.dataTransfer);
                if (resources.length > 0) {
                    for (const treeNode of resources) {
                        await this.model.move(treeNode, containing);
                    }
                }
                else {
                    await this.uploadService.upload(containing.uri, { source: event.dataTransfer });
                }
            }
        }
        catch (e) {
            if (!isCancelled(e)) {
                console.error(e);
            }
        }
    }
    getDropTargetDirNode(node) {
        if (CompositeTreeNode.is(node) && node.id === 'WorkspaceNodeId') {
            if (node.children.length === 1) {
                return DirNode.getContainingDir(node.children[0]);
            }
            else if (node.children.length > 1) {
                // move file to the last root folder in multi-root scenario
                return DirNode.getContainingDir(node.children[node.children.length - 1]);
            }
        }
        return DirNode.getContainingDir(node);
    }
    setTreeNodeAsData(data, node) {
        data.setData('tree-node', node.id);
    }
    setSelectedTreeNodesAsData(data, sourceNode, relatedNodes) {
        this.setTreeNodeAsData(data, sourceNode);
        data.setData('selected-tree-nodes', JSON.stringify(relatedNodes.map(node => node.id)));
    }
    getTreeNodeFromData(data) {
        const id = data.getData('tree-node');
        return this.model.getNode(id);
    }
    getSelectedTreeNodesFromData(data) {
        const resources = data.getData('selected-tree-nodes');
        if (!resources) {
            return [];
        }
        const ids = JSON.parse(resources);
        return ids.map(id => this.model.getNode(id)).filter(node => node !== undefined);
    }
    renderExpansionToggle(node, props) {
        if (this.hidesExplorerArrows) {
            // eslint-disable-next-line no-null/no-null
            return null;
        }
        return super.renderExpansionToggle(node, props);
    }
    getPaddingLeft(node, props) {
        if (this.hidesExplorerArrows) {
            // additional left padding instead of top-level expansion toggle
            return super.getPaddingLeft(node, props) + this.props.leftPadding;
        }
        return super.getPaddingLeft(node, props);
    }
    needsExpansionTogglePadding(node) {
        const theme = this.iconThemeService.getDefinition(this.iconThemeService.current);
        if (theme && (theme.hidesExplorerArrows || (theme.hasFileIcons && !theme.hasFolderIcons))) {
            return false;
        }
        return super.needsExpansionTogglePadding(node);
    }
    deflateForStorage(node) {
        const deflated = super.deflateForStorage(node);
        if (FileStatNode.is(node) && FileStatNodeData.is(deflated)) {
            deflated.uri = node.uri.toString();
            delete deflated['fileStat'];
            deflated.stat = FileStat.toStat(node.fileStat);
        }
        return deflated;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inflateFromStorage(node, parent) {
        if (FileStatNodeData.is(node)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fileStatNode = node;
            const resource = new URI(node.uri);
            fileStatNode.uri = resource;
            let stat;
            // in order to support deprecated FileStat
            if (node.fileStat) {
                stat = {
                    type: node.fileStat.isDirectory ? FileType.Directory : FileType.File,
                    mtime: node.fileStat.lastModification,
                    size: node.fileStat.size
                };
                delete node['fileStat'];
            }
            else if (node.stat) {
                stat = node.stat;
                delete node['stat'];
            }
            if (stat) {
                fileStatNode.fileStat = FileStat.fromStat(resource, stat);
            }
        }
        const inflated = super.inflateFromStorage(node, parent);
        if (DirNode.is(inflated)) {
            inflated.fileStat.children = [];
            for (const child of inflated.children) {
                if (FileStatNode.is(child)) {
                    inflated.fileStat.children.push(child.fileStat);
                }
            }
        }
        return inflated;
    }
};
__decorate([
    inject(IconThemeService)
], FileTreeWidget.prototype, "iconThemeService", void 0);
__decorate([
    inject(FileUploadService)
], FileTreeWidget.prototype, "uploadService", void 0);
FileTreeWidget = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(FileTreeModel)),
    __param(2, inject(ContextMenuRenderer))
], FileTreeWidget);
export { FileTreeWidget };

//# sourceMappingURL=../../../lib/browser/file-tree/file-tree-widget.js.map
