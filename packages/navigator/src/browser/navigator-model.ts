import {inject, injectable, postConstruct} from 'inversify';
import {FileNode, FileTreeModel} from '@tartjs/filesystem';
import URI from '@tartjs/core/lib/common/uri';
import {
  CompositeTreeNode,
  ExpandableTreeNode,
  open,
  OpenerService,
  SelectableTreeNode,
  TreeNode
} from '@tartjs/core/lib/browser';
import {FileNavigatorTree, WorkspaceNode, WorkspaceRootNode} from './navigator-tree';
import {WorkspaceService} from '@tartjs/workspace';
import {FrontendApplicationStateService} from '@tartjs/core/lib/browser/frontend-application-state';

@injectable()
export class FileNavigatorModel extends FileTreeModel {

  @inject(OpenerService) protected readonly openerService: OpenerService;
  @inject(FileNavigatorTree) protected readonly fileNavigatorTree: FileNavigatorTree;
  @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
  @inject(FrontendApplicationStateService) protected readonly applicationState: FrontendApplicationStateService;

  * getNodesByUri(uri: URI): IterableIterator<TreeNode> {
    const workspace = this.root;
    if (WorkspaceNode.is(workspace)) {
      for (const root of workspace.children) {
        // const id = this.tree.createId(root, uri);
        // const node = this.getNode(id);
        // if (node) {
        //     yield node;
        // }
      }
    }
  }

  /**
   * Reveals node in the navigator by given file uri.
   *
   * @param uri uri to file which should be revealed in the navigator
   * @returns file tree node if the file with given uri was revealed, undefined otherwise
   */
  async revealFile(uri: URI): Promise<TreeNode | undefined> {
    if (!uri.path.isAbsolute) {
      return undefined;
    }
    let node = this.getNodeClosestToRootByUri(uri);

    // success stop condition
    // we have to reach workspace root because expanded node could be inside collapsed one
    if (WorkspaceRootNode.is(node)) {
      if (ExpandableTreeNode.is(node)) {
        if (!node.expanded) {
          node = await this.expandNode(node);
        }
        return node;
      }
      // shouldn't happen, root node is always directory, i.e. expandable
      return undefined;
    }

    // fail stop condition
    if (uri.path.isRoot) {
      // file system root is reached but workspace root wasn't found, it means that
      // given uri is not in workspace root folder or points to not existing file.
      return undefined;
    }

    if (await this.revealFile(uri.parent)) {
      if (node === undefined) {
        // get node if it wasn't mounted into navigator tree before expansion
        node = this.getNodeClosestToRootByUri(uri);
      }
      if (ExpandableTreeNode.is(node) && !node.expanded) {
        node = await this.expandNode(node);
      }
      return node;
    }
    return undefined;
  }

  previewNode(node: TreeNode): void {
    if (FileNode.is(node)) {
      open(this.openerService, node.uri, {mode: 'reveal', preview: true});
    }
  }

  @postConstruct()
  protected init() {
    super.init();
    this.initializeRoot();
  }

  protected async initializeRoot(): Promise<void> {
    await Promise.all([
      this.applicationState.reachedState('initialized_layout'),
      this.workspaceService.roots
    ]);
    await this.updateRoot();
    if (this.toDispose.disposed) {
      return;
    }
    this.toDispose.push(this.workspaceService.onWorkspaceChanged(() => this.updateRoot()));
    this.toDispose.push(this.workspaceService.onWorkspaceLocationChanged(() => this.updateRoot()));
    if (this.selectedNodes.length) {
      return;
    }
    const root = this.root;
    if (CompositeTreeNode.is(root) && root.children.length === 1) {
      const child = root.children[0];
      if (SelectableTreeNode.is(child) && !child.selected && ExpandableTreeNode.is(child)) {
        this.selectNode(child);
        this.expandNode(child);
      }
    }
  }

  protected async updateRoot(): Promise<void> {
    this.root = await this.createRoot();
  }

  protected async createRoot(): Promise<TreeNode | undefined> {
    if (this.workspaceService.opened) {
      const stat = this.workspaceService.workspace;
      const isMulti = (stat) ? !stat.isDirectory : false;
      const workspaceNode = isMulti
          ? this.createMultipleRootNode()
          : WorkspaceNode.createRoot();
      const roots = await this.workspaceService.roots;
      for (const root of roots) {
        workspaceNode.children.push(
            await this.fileNavigatorTree.createWorkspaceRoot(root, workspaceNode)
        );
      }
      return workspaceNode;
    }
  }

  /**
   * Create multiple root node used to display
   * the multiple root workspace name.
   *
   * @returns `WorkspaceNode`
   */
  protected createMultipleRootNode(): WorkspaceNode {
    const workspace = this.workspaceService.workspace;
    let name = workspace
        ? workspace.resource.path.name
        : 'untitled';
    name += ' (Workspace)';
    return WorkspaceNode.createRoot(name);
  }

  protected getNodeClosestToRootByUri(uri: URI): TreeNode | undefined {
    const nodes = [...this.getNodesByUri(uri)];
    return nodes.length > 0
        ? nodes.reduce((node1, node2) => // return the node closest to the workspace root
            node1.id.length >= node2.id.length ? node1 : node2
        ) : undefined;
  }

}
