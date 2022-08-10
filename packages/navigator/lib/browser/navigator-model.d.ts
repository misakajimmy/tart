import { FileTreeModel } from '@tart/filesystem';
import URI from '@tart/core/lib/common/uri';
import { OpenerService, TreeNode } from '@tart/core/lib/browser';
import { FileNavigatorTree, WorkspaceNode } from './navigator-tree';
import { WorkspaceService } from '@tart/workspace';
import { FrontendApplicationStateService } from '@tart/core/lib/browser/frontend-application-state';
export declare class FileNavigatorModel extends FileTreeModel {
    protected readonly openerService: OpenerService;
    protected readonly fileNavigatorTree: FileNavigatorTree;
    protected readonly workspaceService: WorkspaceService;
    protected readonly applicationState: FrontendApplicationStateService;
    getNodesByUri(uri: URI): IterableIterator<TreeNode>;
    /**
     * Reveals node in the navigator by given file uri.
     *
     * @param uri uri to file which should be revealed in the navigator
     * @returns file tree node if the file with given uri was revealed, undefined otherwise
     */
    revealFile(uri: URI): Promise<TreeNode | undefined>;
    previewNode(node: TreeNode): void;
    protected init(): void;
    protected initializeRoot(): Promise<void>;
    protected updateRoot(): Promise<void>;
    protected createRoot(): Promise<TreeNode | undefined>;
    /**
     * Create multiple root node used to display
     * the multiple root workspace name.
     *
     * @returns `WorkspaceNode`
     */
    protected createMultipleRootNode(): WorkspaceNode;
    protected getNodeClosestToRootByUri(uri: URI): TreeNode | undefined;
}
