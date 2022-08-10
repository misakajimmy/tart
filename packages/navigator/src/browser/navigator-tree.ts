/**
 * File tree root node for multi-root workspaces.
 */
import {CompositeTreeNode, SelectableTreeNode, TreeNode} from '@tart/core';
import {DirNode, FileTree} from '@tart/filesystem';
import {inject, injectable, postConstruct} from 'inversify';
import URI from '@tart/core/lib/common/uri';
import {FileStat} from '@tart/filesystem/lib/common/files';
import {FileNavigatorFilter} from './navigator-filter';

@injectable()
export class FileNavigatorTree extends FileTree {

  @inject(FileNavigatorFilter) protected readonly filter: FileNavigatorFilter;

  async resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    if (WorkspaceNode.is(parent)) {
      return parent.children;
    }
    return this.filter.filter(super.resolveChildren(parent));
  }

  createId(root: WorkspaceRootNode, uri: URI): string {
    const id = super.toNodeId(uri, root);
    return id === root.id ? id : `${root.id}:${id}`;
  }

  async createWorkspaceRoot(rootFolder: FileStat, workspaceNode: WorkspaceNode): Promise<WorkspaceRootNode> {
    const node = this.toNode(rootFolder, workspaceNode) as WorkspaceRootNode;
    Object.assign(node, {
      visible: workspaceNode.name !== WorkspaceNode.name,
    });
    return node;
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.push(this.filter.onFilterChanged(() => this.refresh()));
  }

  protected toNodeId(uri: URI, parent: CompositeTreeNode): string {
    const workspaceRootNode = WorkspaceRootNode.find(parent);
    if (workspaceRootNode) {
      return this.createId(workspaceRootNode, uri);
    }
    return super.toNodeId(uri, parent);
  }
}

/**
 * File tree root node for multi-root workspaces.
 */
export interface WorkspaceNode extends CompositeTreeNode, SelectableTreeNode {
  children: WorkspaceRootNode[];
}

export namespace WorkspaceNode {

  export const id = 'WorkspaceNodeId';
  export const name = 'WorkspaceNode';

  export function is(node: TreeNode | undefined): node is WorkspaceNode {
    return CompositeTreeNode.is(node) && node.id === WorkspaceNode.id;
  }

  /**
   * Create a `WorkspaceNode` that can be used as a `Tree` root.
   */
  export function createRoot(multiRootName?: string): WorkspaceNode {
    return {
      id: WorkspaceNode.id,
      name: multiRootName || WorkspaceNode.name,
      parent: undefined,
      children: [],
      visible: false,
      selected: false
    };
  }

}

/**
 * A node representing a folder from a multi-root workspace.
 */
export interface WorkspaceRootNode extends DirNode {
  parent: WorkspaceNode;
}

export namespace WorkspaceRootNode {

  export function is(node: Object | undefined): node is WorkspaceRootNode {
    return DirNode.is(node) && WorkspaceNode.is(node.parent);
  }

  export function find(node: TreeNode | undefined): WorkspaceRootNode | undefined {
    if (node) {
      if (is(node)) {
        return node;
      }
      return find(node.parent);
    }
  }
}
