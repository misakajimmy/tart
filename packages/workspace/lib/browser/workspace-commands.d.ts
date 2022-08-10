import { LabelProvider, OpenerService, OpenHandler } from '@tart/core';
import { Command, CommandContribution, CommandRegistry, Event, MenuContribution, MenuModelRegistry, SelectionService } from '@tart/core/lib/common';
import { WorkspacePreferences } from './workspace-preference';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { WorkspaceService } from './workspace-service';
import { UriAwareCommandHandler, UriCommandHandler } from '@tart/core/lib/common/uri-command-handler';
import { FileStat } from '@tart/filesystem/lib/common/files';
import { WorkspaceDeleteHandler } from './workspace-delete-handler';
export declare namespace WorkspaceCommands {
    const OPEN: Command & {
        dialogLabel: string;
    };
    const OPEN_FILE: Command & {
        dialogLabel: string;
    };
    const OPEN_FOLDER: Command & {
        dialogLabel: string;
    };
    const OPEN_WORKSPACE: Command & {
        dialogLabel: string;
    };
    const OPEN_RECENT_WORKSPACE: Command;
    const CLOSE: Command;
    const NEW_FILE: Command;
    const NEW_PYTHON_FILE: Command;
    const NEW_BLOCKLY_FILE: Command;
    const NEW_FOLDER: Command;
    const FILE_OPEN_WITH: (opener: OpenHandler) => Command;
    const FILE_RENAME: Command;
    const FILE_DELETE: Command;
    const FILE_DUPLICATE: Command;
    const FILE_COMPARE: Command;
    const ADD_FOLDER: Command;
    const REMOVE_FOLDER: Command;
    const SAVE_WORKSPACE_AS: Command;
    const OPEN_WORKSPACE_FILE: Command;
    const SAVE_AS: Command;
}
export interface DidCreateNewResourceEvent {
    uri: URI;
    parent: URI;
}
export declare class WorkspaceCommandContribution implements CommandContribution {
    protected readonly labelProvider: LabelProvider;
    protected readonly fileService: FileService;
    protected readonly openerService: OpenerService;
    protected readonly workspaceService: WorkspaceService;
    protected readonly selectionService: SelectionService;
    protected readonly deleteHandler: WorkspaceDeleteHandler;
    protected readonly preferences: WorkspacePreferences;
    private readonly onDidCreateNewFileEmitter;
    private readonly onDidCreateNewFolderEmitter;
    get onDidCreateNewFile(): Event<DidCreateNewResourceEvent>;
    get onDidCreateNewFolder(): Event<DidCreateNewResourceEvent>;
    init(): void;
    registerCommands(commands: CommandRegistry): void;
    protected fireCreateNewFile(uri: DidCreateNewResourceEvent): void;
    protected fireCreateNewFolder(uri: DidCreateNewResourceEvent): void;
    protected getDirectory(candidate: URI): Promise<FileStat | undefined>;
    protected validateFileRename(oldName: string, newName: string, parent: FileStat): Promise<string>;
    protected isWorkspaceRoot(uri: URI): boolean;
    protected getParent(candidate: URI): Promise<FileStat | undefined>;
    protected getDefaultFileConfig(): {
        fileName: string;
        fileExtension: string;
    };
    protected addFolderToWorkspace(...uris: URI[]): Promise<void>;
    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]>;
    /**
     * Returns an error message if the file name is invalid. Otherwise, an empty string.
     *
     * @param name the simple file name of the file to validate.
     * @param parent the parent directory's file stat.
     * @param allowNested allow file or folder creation using recursive path
     */
    protected validateFileName(name: string, parent: FileStat, allowNested?: boolean): Promise<string>;
    protected trimFileName(name: string): string;
    protected newWorkspaceRootUriAwareCommandHandler(handler: UriCommandHandler<URI>): WorkspaceRootUriAwareCommandHandler;
}
export declare class WorkspaceRootUriAwareCommandHandler extends UriAwareCommandHandler<URI> {
    protected readonly workspaceService: WorkspaceService;
    protected readonly selectionService: SelectionService;
    protected readonly handler: UriCommandHandler<URI>;
    constructor(workspaceService: WorkspaceService, selectionService: SelectionService, handler: UriCommandHandler<URI>);
    isEnabled(...args: any[]): boolean;
    isVisible(...args: any[]): boolean;
    protected getUri(...args: any[]): URI | undefined;
}
export declare class FileMenuContribution implements MenuContribution {
    registerMenus(registry: MenuModelRegistry): void;
}
