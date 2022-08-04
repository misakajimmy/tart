import {OpenFileDialogFactory, OpenFileDialogProps, SaveFileDialogFactory, SaveFileDialogProps} from './file-dialog';
import {FileStat} from '../../common/files';
import URI from '@tart/core/lib/common/uri';
import {MaybeArray} from '@tart/core/lib/common';
import {inject, injectable} from 'inversify';
import {FileService} from '../file-service';
import {LabelProvider} from '@tart/core/lib/browser';
import {DirNode} from '../file-tree';

export const FileDialogService = Symbol('FileDialogService');

export interface FileDialogService {

    showOpenDialog(props: OpenFileDialogProps & { canSelectMany: true }, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;

    showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<URI | undefined>;

    showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;

    showSaveDialog(props: SaveFileDialogProps, folder?: FileStat): Promise<URI | undefined>

}

@injectable()
export class DefaultFileDialogService implements FileDialogService {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(OpenFileDialogFactory) protected readonly openFileDialogFactory: OpenFileDialogFactory;
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    @inject(SaveFileDialogFactory) protected readonly saveFileDialogFactory: SaveFileDialogFactory;

    async showOpenDialog(props: OpenFileDialogProps & { canSelectMany: true }, folder?: FileStat): Promise<MaybeArray<URI> | undefined>;
    async showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<URI | undefined>;
    async showOpenDialog(props: OpenFileDialogProps, folder?: FileStat): Promise<MaybeArray<URI> | undefined> {
        const title = props.title || 'Open';
        const rootNode = await this.getRootNode(folder);
        if (rootNode) {
            const dialog = this.openFileDialogFactory(Object.assign(props, {title}));
            await dialog.model.navigateTo(rootNode);
            const value = await dialog.open();
            if (value) {
                if (!Array.isArray(value)) {
                    return value.uri;
                }
                return value.map(node => node.uri);
            }
        }
        return undefined;
    }

    async showSaveDialog(props: SaveFileDialogProps, folder?: FileStat): Promise<URI | undefined> {
        const title = props.title || 'Save';
        const rootNode = await this.getRootNode(folder);
        if (rootNode) {
            const dialog = this.saveFileDialogFactory(Object.assign(props, {title}));
            await dialog.model.navigateTo(rootNode);
            return dialog.open();
        }
        return undefined;
    }

    protected async getRootNode(folderToOpen?: FileStat): Promise<DirNode | undefined> {
        const folderExists = folderToOpen && await this.fileService.exists(folderToOpen.resource);
        const folder = folderToOpen && folderExists ? folderToOpen : {
            // resource: new URI(await this.environments.getHomeDirUri()),
            resource: new URI(),
            isDirectory: true
        };
        const folderUri = folder.resource;
        const rootUri = folder.isDirectory ? folderUri : folderUri.parent;
        try {
            const rootStat = await this.fileService.resolve(rootUri);
            return DirNode.createRoot(rootStat);
        } catch {
        }
        return undefined;
    }
}
