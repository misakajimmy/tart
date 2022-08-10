import {Container, interfaces} from 'inversify';
import {createTreeContainer, Tree, TreeImpl, TreeModel, TreeModelImpl, TreeWidget} from '@tartjs/core';
import {FileTreeModel} from './file-tree-model';
import {FileTreeWidget} from './file-tree-widget';
import {FileTree} from './file-tree';

export function createFileTreeContainer(parent: interfaces.Container): Container {
    const child = createTreeContainer(parent);

    child.unbind(TreeImpl);
    child.bind(FileTree).toSelf();
    child.rebind(Tree).toService(FileTree);

    child.unbind(TreeModelImpl);
    child.bind(FileTreeModel).toSelf();
    child.rebind(TreeModel).toService(FileTreeModel);

    child.unbind(TreeWidget);
    child.bind(FileTreeWidget).toSelf();

    return child;
}
