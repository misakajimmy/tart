import { Command, CommandContribution, CommandRegistry, SelectionService } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '../file-service';
export declare class FileDownloadCommandContribution implements CommandContribution {
    protected readonly fileService: FileService;
    protected readonly selectionService: SelectionService;
    registerCommands(registry: CommandRegistry): void;
    protected executeDownload(uris: URI[], options?: {
        copyLink?: boolean;
    }): Promise<void>;
    protected isDownloadEnabled(uris: URI[]): boolean;
    protected isDownloadVisible(uris: URI[]): boolean;
}
export declare namespace FileDownloadCommands {
    const DOWNLOAD: Command;
    const COPY_DOWNLOAD_LINK: Command;
}
