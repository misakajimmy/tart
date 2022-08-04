var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { Command, SelectionService, UriAwareCommandHandler } from '@tart/core/lib/common';
import { CommonCommands } from '@tart/core';
import { FileService } from '../file-service';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { nls } from "@tart/core/lib/common/nls";
let FileDownloadCommandContribution = class FileDownloadCommandContribution {
    registerCommands(registry) {
        registry.registerCommand(FileDownloadCommands.DOWNLOAD, UriAwareCommandHandler.MultiSelect(this.selectionService, {
            execute: uris => this.executeDownload(uris),
            isEnabled: uris => this.isDownloadEnabled(uris),
            isVisible: uris => this.isDownloadVisible(uris),
        }));
    }
    async executeDownload(uris, options) {
        const downloadFile = async (uri) => {
            this.fileService.readFile(uri).then((data) => {
                const blob = new Blob([data.value.buffer.buffer]);
                FileSaver.saveAs(blob, data.name);
            });
        };
        const downloadFolder = async (uri, zip) => {
            const res = await this.fileService.resolve(uri);
            if (res.isFile === true) {
                console.log(res);
                const data = await this.fileService.read(uri);
                zip.file(res.name, data.value);
            }
            else {
                const folder = zip.folder(res.name);
                for (const child of res.children) {
                    await downloadFolder(child.resource, folder);
                }
            }
        };
        const download = async (uri) => {
            const res = await this.fileService.resolve(uri);
            if (res.isFile === true) {
                await downloadFile(uri);
            }
            else {
                const zip = new JSZip();
                await downloadFolder(uri, zip);
                console.log('download finish');
                zip.generateAsync({ type: "blob" }).then((content) => {
                    // see FileSaver.js
                    FileSaver.saveAs(content, "data.zip");
                });
            }
        };
        uris.map(uri => {
            download(uri);
        });
    }
    isDownloadEnabled(uris) {
        return uris.length > 0 && uris.every(u => u.scheme === 'file');
    }
    isDownloadVisible(uris) {
        return this.isDownloadEnabled(uris);
    }
};
__decorate([
    inject(FileService)
], FileDownloadCommandContribution.prototype, "fileService", void 0);
__decorate([
    inject(SelectionService)
], FileDownloadCommandContribution.prototype, "selectionService", void 0);
FileDownloadCommandContribution = __decorate([
    injectable()
], FileDownloadCommandContribution);
export { FileDownloadCommandContribution };
export var FileDownloadCommands;
(function (FileDownloadCommands) {
    FileDownloadCommands.DOWNLOAD = Command.toDefaultLocalizedCommand({
        id: 'file.download',
        category: CommonCommands.FILE_CATEGORY,
        label: nls.localize('Download', '下载')
    });
    FileDownloadCommands.COPY_DOWNLOAD_LINK = Command.toLocalizedCommand({
        id: 'file.copyDownloadLink',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Copy Download Link'
    }, 'tart/filesystem/copyDownloadLink', CommonCommands.FILE_CATEGORY_KEY);
})(FileDownloadCommands || (FileDownloadCommands = {}));

//# sourceMappingURL=../../../lib/browser/download/file-download-command-contribution.js.map
