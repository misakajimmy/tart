var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, } from 'inversify';
import { Command, } from '@tart/core/lib/common';
import { FileService } from './file-service';
import { CommonCommands } from '@tart/core';
export var FileSystemCommands;
(function (FileSystemCommands) {
    FileSystemCommands.UPLOAD = Command.toLocalizedCommand({
        id: 'file.upload',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Upload Files...'
    }, 'tart/filesystem/uploadFiles', CommonCommands.FILE_CATEGORY_KEY);
})(FileSystemCommands || (FileSystemCommands = {}));
let FileSystemFrontendContribution = class FileSystemFrontendContribution {
    initialize() {
        this.fileService.onDidFilesChange(event => {
        });
        // this.fileService.onWillRunUserOperation(event => {
        //     this.queueUserOperation(event);
        //     event.waitUntil(this.runEach((uri, widget) => this.pushMove(uri, widget, event)));
        // });
        // this.fileService.onDidFailUserOperation(event => event.waitUntil((async () => {
        //     await this.runEach((uri, widget) => this.revertMove(uri, widget, event));
        //     this.resolveUserOperation(event);
        // })()));
        // this.fileService.onDidRunUserOperation(event => event.waitUntil((async () => {
        //     await this.runEach((uri, widget) => this.applyMove(uri, widget, event));
        //     this.resolveUserOperation(event);
        // })()));
    }
    registerCommands(commands) {
        commands.registerCommand(Command.toDefaultLocalizedCommand({
            id: 'local-filesystem',
            label: '使用本地文件系统',
        }), {
            execute: data => {
                // @ts-ignore
                this.fileService.useLocalFileSystem();
            }
        });
    }
};
__decorate([
    inject(FileService)
], FileSystemFrontendContribution.prototype, "fileService", void 0);
FileSystemFrontendContribution = __decorate([
    injectable()
], FileSystemFrontendContribution);
export { FileSystemFrontendContribution };

//# sourceMappingURL=../../lib/browser/filesystem-frontend-contribution.js.map
