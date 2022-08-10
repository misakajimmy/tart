import {inject, injectable,} from 'inversify';
import {Command, CommandContribution, CommandRegistry,} from '@tartjs/core/lib/common';
import {FileService} from './file-service';
import {CommonCommands, FrontendApplicationContribution} from '@tartjs/core';

export namespace FileSystemCommands {

    export const UPLOAD = Command.toLocalizedCommand({
        id: 'file.upload',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Upload Files...'
    }, 'tart/filesystem/uploadFiles', CommonCommands.FILE_CATEGORY_KEY);

}

@injectable()
export class FileSystemFrontendContribution implements FrontendApplicationContribution, CommandContribution {

    @inject(FileService)
    protected readonly fileService: FileService;

    initialize(): void {
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

    registerCommands(commands: CommandRegistry) {
        commands.registerCommand(Command.toDefaultLocalizedCommand({
            id: 'local-filesystem',
            label: '使用本地文件系统',
        }), {
            execute: data => {
                // @ts-ignore
                this.fileService.useLocalFileSystem();
            }
        })
    }
}
