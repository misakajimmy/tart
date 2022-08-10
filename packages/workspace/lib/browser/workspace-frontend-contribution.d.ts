import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, OS } from '@tart/core/lib/common';
import { KeybindingContribution, KeybindingRegistry, OpenerService } from '@tart/core';
import { FileDialogService, FileDialogTreeFilters, OpenFileDialogProps } from '@tart/filesystem';
import URI from '@tart/core/lib/common/uri';
import { WorkspaceService } from './workspace-service';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { WorkspacePreferences } from './workspace-preference';
export declare class WorkspaceFrontendContribution implements CommandContribution, KeybindingContribution, MenuContribution {
    protected readonly workspaceService: WorkspaceService;
    protected readonly openerService: OpenerService;
    protected readonly fileService: FileService;
    protected readonly fileDialogService: FileDialogService;
    protected preferences: WorkspacePreferences;
    registerCommands(commands: CommandRegistry): void;
    registerKeybindings(keybindings: KeybindingRegistry): void;
    registerMenus(menus: MenuModelRegistry): void;
    /**
     * This is the generic `Open` method. Opens files and directories too. Resolves to the opened URI.
     * Except when you are on either Windows or Linux `AND` running in electron. If so, it opens a file.
     */
    protected doOpen(): Promise<URI | undefined>;
    protected doOpenWorkspace(): Promise<URI | undefined>;
    protected openWorkspaceOpenFileDialogProps(): Promise<OpenFileDialogProps>;
}
export declare namespace WorkspaceFrontendContribution {
    /**
     * File filter for all Wm and VS Code workspace file types.
     */
    const DEFAULT_FILE_FILTER: FileDialogTreeFilters;
    /**
     * Returns with an `OpenFileDialogProps` for opening the `Open Workspace` dialog.
     */
    function createOpenWorkspaceOpenFileDialogProps(options: Readonly<{
        type: OS.Type;
        electron: boolean;
        supportMultiRootWorkspace: boolean;
    }>): OpenFileDialogProps;
}
