import {inject, injectable} from 'inversify';
import {FileService, FileServiceContribution} from './file-service';
import {VirtualFileSystemProvider} from '../common/virtual-file-system-provider';
import {StorageFileSystemProvider} from "../common/storage-file-system-provider";

@injectable()
export class VirtualFileServiceContribution implements FileServiceContribution {

    @inject(StorageFileSystemProvider)
    protected readonly provider: StorageFileSystemProvider;

    registerFileSystemProviders(service: FileService) {
        const registering = this.provider.ready.then(() => {
            service.registerProvider('file', this.provider);
        });
        service.onWillActivateFileSystemProvider(event => {
            if (event.scheme === 'file') {
                event.waitUntil(registering);
            }
        });
    }
}
