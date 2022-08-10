/**
 * File tree root node for multi-root workspaces.
 */
import { CompositeTreeNode, SelectableTreeNode, TreeNode } from '@tart/core';
import { DirNode, FileTree } from '@tart/filesystem';
import URI from '@tart/core/lib/common/uri';
import { FileStat } from '@tart/filesystem/lib/common/files';
import { FileNavigatorFilter } from './navigator-filter';
export declare class FileNavigatorTree extends FileTree {
    protected readonly filter: FileNavigatorFilter;
    resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]>;
    createId(root: WorkspaceRootNode, uri: URI): string;
    createWorkspaceRoot(rootFolder: FileStat, workspaceNode: WorkspaceNode): Promise<WorkspaceRootNode>;
    protected init(): void;
    protected toNodeId(uri: URI, parent: CompositeTreeNode): string;
}
/**
 * File tree root node for multi-root workspaces.
 */
export interface WorkspaceNode extends CompositeTreeNode, SelectableTreeNode {
    children: WorkspaceRootNode[];
}
export declare namespace WorkspaceNode {
    const id = "WorkspaceNodeId";
    const name = "WorkspaceNode";
    function is(node: TreeNode | undefined): node is WorkspaceNode;
    /**
     * Create a `WorkspaceNode` that can be used as a `Tree` root.
     */
    function createRoot(multiRootName?: string): WorkspaceNode;
}
/**
 * A node representing a folder from a multi-root workspace.
 */
export interface WorkspaceRootNode extends DirNode {
    parent: WorkspaceNode;
}
export declare namespace WorkspaceRootNode {
    function is(node: Object | undefined): node is WorkspaceRootNode;
    function find(node: TreeNode | undefined): WorkspaceRootNode | undefined;
}
