import { Container, interfaces } from 'inversify';
import { ContextMenuRenderer, NodeProps, OpenerService, TreeNode, TreeProps } from '@tart/core/lib/browser';
import { FileTreeModel, FileTreeWidget } from '../file-tree';
export declare function createFileTreeBreadcrumbsContainer(parent: interfaces.Container): Container;
export declare function createFileTreeBreadcrumbsWidget(parent: interfaces.Container): BreadcrumbsFileTreeWidget;
export declare class BreadcrumbsFileTreeWidget extends FileTreeWidget {
    readonly props: TreeProps;
    readonly model: FileTreeModel;
    protected readonly openerService: OpenerService;
    constructor(props: TreeProps, model: FileTreeModel, contextMenuRenderer: ContextMenuRenderer);
    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement>;
    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void;
}
