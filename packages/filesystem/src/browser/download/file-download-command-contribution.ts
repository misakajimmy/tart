import {inject, injectable} from 'inversify';
import {
    Command,
    CommandContribution,
    CommandRegistry,
    SelectionService,
    UriAwareCommandHandler
} from '@tart/core/lib/common';
import {CommonCommands} from '@tart/core';
import URI from '@tart/core/lib/common/uri';
import {FileService} from '../file-service';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import {nls} from "@tart/core/lib/common/nls";

@injectable()
export class FileDownloadCommandContribution implements CommandContribution {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(
            FileDownloadCommands.DOWNLOAD,
            UriAwareCommandHandler.MultiSelect(this.selectionService, {
                execute: uris => this.executeDownload(uris),
                isEnabled: uris => this.isDownloadEnabled(uris),
                isVisible: uris => this.isDownloadVisible(uris),
            })
        );
    }

    protected async executeDownload(uris: URI[], options?: { copyLink?: boolean }): Promise<void> {
        const downloadFile = async (uri: URI) => {
            this.fileService.readFile(uri).then((data) => {
                const blob = new Blob([data.value.buffer.buffer]);
                FileSaver.saveAs(blob, data.name);
            });
        }
        const downloadFolder = async (uri: URI, zip: JSZip) => {
            const res = await this.fileService.resolve(uri);
            if (res.isFile === true) {
                console.log(res);
                const data = await this.fileService.read(uri);
                zip.file(res.name, data.value);
            } else {
                const folder = zip.folder(res.name);
                for (const child of res.children) {
                    await downloadFolder(child.resource, folder);
                }
            }
        }
        const download = async (uri: URI) => {
            const res = await this.fileService.resolve(uri);
            if (res.isFile === true) {
                await downloadFile(uri);
            } else {
                const zip = new JSZip();
                await downloadFolder(uri, zip);
                console.log('download finish');
                zip.generateAsync({type: "blob"}).then((content) => {
                    // see FileSaver.js
                    FileSaver.saveAs(content, "data.zip");
                });
            }
        }

        uris.map(uri => {
            download(uri);
        });
    }

    protected isDownloadEnabled(uris: URI[]): boolean {
        return uris.length > 0 && uris.every(u => u.scheme === 'file');
    }

    protected isDownloadVisible(uris: URI[]): boolean {
        return this.isDownloadEnabled(uris);
    }
}

export namespace FileDownloadCommands {
    export const DOWNLOAD = Command.toDefaultLocalizedCommand({
        id: 'file.download',
        category: CommonCommands.FILE_CATEGORY,
        label: nls.localize('Download','下载')
    });

    export const COPY_DOWNLOAD_LINK = Command.toLocalizedCommand({
        id: 'file.copyDownloadLink',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Copy Download Link'
    }, 'tart/filesystem/copyDownloadLink', CommonCommands.FILE_CATEGORY_KEY);

}
