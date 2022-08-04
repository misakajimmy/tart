import { OpenFileDialogFactory, OpenFileDialogProps, SaveFileDialogFactory, SaveFileDialogProps } from './file-dialog';
import { FileStat } from '../../common/files';
import URI from '@tart/core/lib/common/uri';
import { MaybeArray } from '@tart/core/lib/common';
import { FileService } from '../file-service';
import { LabelProvider } from '@tart/core/lib/browser';
import { DirNode } from '../file-tree';
export declare const FileDialogService: unique symbol;
export interface FileDialogService {
    showOpenDialog(props: OpenFileDialogProps & {
        canSelectMany: true;
    }, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;
    showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<URI | undefined>;
    showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;
    showSaveDialog(props: SaveFileDialogProps, folder?: FileStat): Promise<URI | undefined>;
}
export declare class DefaultFileDialogService implements FileDialogService {
    protected readonly fileService: FileService;
    protected readonly openFileDialogFactory: OpenFileDialogFactory;
    protected readonly labelProvider: LabelProvider;
    protected readonly saveFileDialogFactory: SaveFileDialogFactory;
    showOpenDialog(props: OpenFileDialogProps & {
        canSelectMany: true;
    }, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;
    showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<URI | undefined>;
    showSaveDialog(props: SaveFileDialogProps, folder?: FileStat): Promise<URI | undefined>;
    protected getRootNode(folderToOpen?: FileStat): Promise<DirNode | undefined>;
}
