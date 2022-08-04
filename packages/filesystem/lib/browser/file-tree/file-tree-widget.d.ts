import React from 'react';
import { ContextMenuRenderer, NodeProps, TreeNode, TreeProps, TreeViewWelcomeWidget } from '@tart/core';
import { DisposableCollection } from '@tart/core/lib/common';
import { IconThemeService } from '@tart/core/lib/browser/icon-theme-service';
import { FileTreeModel } from './file-tree-model';
import { DirNode } from './file-tree';
import { FileUploadService } from '../file-upload-service';
export declare const FILE_TREE_CLASS = "tart-FileTree";
export declare const FILE_STAT_NODE_CLASS = "tart-FileStatNode";
export declare const DIR_NODE_CLASS = "tart-DirNode";
export declare const FILE_STAT_ICON_CLASS = "tart-FileStatIcon";
export declare class FileTreeWidget extends TreeViewWelcomeWidget {
    readonly props: TreeProps;
    readonly model: FileTreeModel;
    protected readonly toCancelNodeExpansion: DisposableCollection;
    protected readonly iconThemeService: IconThemeService;
    protected readonly uploadService: FileUploadService;
    constructor(props: TreeProps, model: FileTreeModel, contextMenuRenderer: ContextMenuRenderer);
    protected get hidesExplorerArrows(): boolean;
    protected createNodeClassNames(node: TreeNode, props: NodeProps): string[];
    protected renderIcon(node: TreeNode, props: NodeProps): React.ReactNode;
    protected createContainerAttributes(): React.HTMLAttributes<HTMLElement>;
    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement>;
    protected getNodeTooltip(node: TreeNode): string | undefined;
    protected handleDragStartEvent(node: TreeNode, event: React.DragEvent): void;
    protected handleDragEnterEvent(node: TreeNode | undefined, event: React.DragEvent): void;
    protected handleDragOverEvent(node: TreeNode | undefined, event: React.DragEvent): void;
    protected handleDragLeaveEvent(node: TreeNode | undefined, event: React.DragEvent): void;
    protected handleDropEvent(node: TreeNode | undefined, event: React.DragEvent): Promise<void>;
    protected getDropTargetDirNode(node: TreeNode | undefined): DirNode | undefined;
    protected setTreeNodeAsData(data: DataTransfer, node: TreeNode): void;
    protected setSelectedTreeNodesAsData(data: DataTransfer, sourceNode: TreeNode, relatedNodes: TreeNode[]): void;
    protected getTreeNodeFromData(data: DataTransfer): TreeNode | undefined;
    protected getSelectedTreeNodesFromData(data: DataTransfer): TreeNode[];
    protected renderExpansionToggle(node: TreeNode, props: NodeProps): React.ReactNode;
    protected getPaddingLeft(node: TreeNode, props: NodeProps): number;
    protected needsExpansionTogglePadding(node: TreeNode): boolean;
    protected deflateForStorage(node: TreeNode): object;
    protected inflateFromStorage(node: any, parent?: TreeNode): TreeNode;
}
