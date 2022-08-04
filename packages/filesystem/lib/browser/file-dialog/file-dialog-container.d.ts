import { Container, interfaces } from 'inversify';
import { OpenFileDialogProps, SaveFileDialogProps } from './file-dialog';
export declare function createFileDialogContainer(parent: interfaces.Container): Container;
export declare function createOpenFileDialogContainer(parent: interfaces.Container, props: OpenFileDialogProps): Container;
export declare function createSaveFileDialogContainer(parent: interfaces.Container, props: SaveFileDialogProps): Container;
