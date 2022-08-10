import {Container, inject, injectable, interfaces} from 'inversify';
import {
    ContextMenuRenderer,
    defaultTreeProps,
    NodeProps,
    open,
    OpenerService,
    TreeNode,
    TreeProps
} from '@tartjs/core/lib/browser';
import {createFileTreeContainer, FileStatNode, FileTreeModel, FileTreeWidget} from '../file-tree';

const BREADCRUMBS_FILETREE_CLASS = 'tart-FilepathBreadcrumbFileTree';

export function createFileTreeBreadcrumbsContainer(parent: interfaces.Container): Container {
    const child = createFileTreeContainer(parent);
    child.unbind(FileTreeWidget);
    child.rebind(TreeProps).toConstantValue({...defaultTreeProps, virtualized: false});
    child.bind(BreadcrumbsFileTreeWidget).toSelf();
    return child;
}

export function createFileTreeBreadcrumbsWidget(parent: interfaces.Container): BreadcrumbsFileTreeWidget {
    return createFileTreeBreadcrumbsContainer(parent).get(BreadcrumbsFileTreeWidget);
}

@injectable()
export class BreadcrumbsFileTreeWidget extends FileTreeWidget {

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(FileTreeModel) readonly model: FileTreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ) {
        super(props, model, contextMenuRenderer);
        this.addClass(BREADCRUMBS_FILETREE_CLASS);
    }

    protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement> {
        const elementAttrs = super.createNodeAttributes(node, props);
        return {
            ...elementAttrs,
            draggable: false
        };
    }

    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        if (FileStatNode.is(node) && !node.fileStat.isDirectory) {
            open(this.openerService, node.uri, {preview: true});
        } else {
            super.handleClickEvent(node, event);
        }
    }
}
