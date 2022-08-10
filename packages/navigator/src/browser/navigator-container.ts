import {Container, interfaces} from 'inversify';
import {FileNavigatorWidget} from './navigator-widget';
import {FileNavigatorModel} from './navigator-model';
import {createFileTreeContainer, FileTree, FileTreeModel, FileTreeWidget} from '@tart/filesystem';
import {FileNavigatorTree} from './navigator-tree';
import {defaultTreeProps, Tree, TreeDecoratorService, TreeModel, TreeProps} from '@tart/core';
import {NAVIGATOR_CONTEXT_MENU} from './navigator-contribution';
import {NavigatorDecoratorService} from './navigator-decorator-service';

export const FILE_NAVIGATOR_PROPS = <TreeProps>{
  ...defaultTreeProps,
  contextMenuPath: NAVIGATOR_CONTEXT_MENU,
  multiSelect: true,
  search: true,
  globalSelection: true
};

export function createFileNavigatorContainer(parent: interfaces.Container): Container {
  const child = createFileTreeContainer(parent);

  child.unbind(FileTree);
  child.bind(FileNavigatorTree).toSelf();
  child.rebind(Tree).toService(FileNavigatorTree);

  child.unbind(FileTreeModel);
  child.bind(FileNavigatorModel).toSelf();
  child.rebind(TreeModel).toService(FileNavigatorModel);

  child.unbind(FileTreeWidget);
  child.bind(FileNavigatorWidget).toSelf();

  child.rebind(TreeProps).toConstantValue(FILE_NAVIGATOR_PROPS);

  child.bind(NavigatorDecoratorService).toSelf().inSingletonScope();
  child.rebind(TreeDecoratorService).toService(NavigatorDecoratorService);

  return child;
}

export function createFileNavigatorWidget(parent: interfaces.Container): FileNavigatorWidget {
  return createFileNavigatorContainer(parent).get(FileNavigatorWidget);
}
