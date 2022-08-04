import { FileService, FileServiceContribution } from './file-service';
import { StorageFileSystemProvider } from "../common/storage-file-system-provider";
export declare class VirtualFileServiceContribution implements FileServiceContribution {
    protected readonly provider: StorageFileSystemProvider;
    registerFileSystemProviders(service: FileService): void;
}
