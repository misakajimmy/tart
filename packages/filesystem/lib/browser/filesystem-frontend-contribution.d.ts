import { Command, CommandContribution, CommandRegistry } from '@tart/core/lib/common';
import { FileService } from './file-service';
import { FrontendApplicationContribution } from '@tart/core';
export declare namespace FileSystemCommands {
    const UPLOAD: Command;
}
export declare class FileSystemFrontendContribution implements FrontendApplicationContribution, CommandContribution {
    protected readonly fileService: FileService;
    initialize(): void;
    registerCommands(commands: CommandRegistry): void;
}
