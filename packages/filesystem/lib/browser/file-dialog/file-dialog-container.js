import { createFileTreeContainer, FileTreeModel, FileTreeWidget } from '../file-tree';
import { FileDialogModel } from './file-dialog-model';
import { Tree, TreeModel } from '@tart/core';
import { FileDialogWidget } from './file-dialog-widget';
import { FileDialogTree } from './file-dialog-tree';
import { OpenFileDialog, OpenFileDialogProps, SaveFileDialog, SaveFileDialogProps } from './file-dialog';
import { defaultTreeProps, TreeProps } from '@tart/core/lib/browser';
export function createFileDialogContainer(parent) {
    const child = createFileTreeContainer(parent);
    child.unbind(FileTreeModel);
    child.bind(FileDialogModel).toSelf();
    child.rebind(TreeModel).toService(FileDialogModel);
    child.unbind(FileTreeWidget);
    child.bind(FileDialogWidget).toSelf();
    child.bind(FileDialogTree).toSelf();
    child.rebind(Tree).toService(FileDialogTree);
    return child;
}
export function createOpenFileDialogContainer(parent, props) {
    const container = createFileDialogContainer(parent);
    container.rebind(TreeProps).toConstantValue(Object.assign(Object.assign({}, defaultTreeProps), { multiSelect: props.canSelectMany, search: true }));
    container.bind(OpenFileDialogProps).toConstantValue(props);
    container.bind(OpenFileDialog).toSelf();
    return container;
}
export function createSaveFileDialogContainer(parent, props) {
    const container = createFileDialogContainer(parent);
    container.rebind(TreeProps).toConstantValue(Object.assign(Object.assign({}, defaultTreeProps), { multiSelect: false, search: true }));
    container.bind(SaveFileDialogProps).toConstantValue(props);
    container.bind(SaveFileDialog).toSelf();
    return container;
}

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-container.js.map
