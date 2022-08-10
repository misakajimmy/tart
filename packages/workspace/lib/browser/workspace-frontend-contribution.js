var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WorkspaceFrontendContribution_1;
import { inject, injectable } from 'inversify';
import { OS } from '@tart/core/lib/common';
import { CommonMenus, open, OpenerService } from '@tart/core';
import { FileDialogService } from '@tart/filesystem';
import { WorkspaceCommands } from './workspace-commands';
import URI from '@tart/core/lib/common/uri';
import { WorkspaceService } from './workspace-service';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { WorkspacePreferences } from './workspace-preference';
import { VSCODE_EXT, WM_EXT } from '../common';
let WorkspaceFrontendContribution = WorkspaceFrontendContribution_1 = class WorkspaceFrontendContribution {
    registerCommands(commands) {
        commands.registerCommand(WorkspaceCommands.OPEN_WORKSPACE, {
            isEnabled: () => true,
            execute: () => this.doOpenWorkspace(),
        });
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: WorkspaceCommands.NEW_FILE.id,
            keybinding: 'alt+n',
        });
        keybindings.registerKeybinding({
            command: WorkspaceCommands.OPEN.id,
            keybinding: 'ctrlcmd+alt+o',
        });
        keybindings.registerKeybinding({
            command: WorkspaceCommands.OPEN_WORKSPACE.id,
            keybinding: 'ctrlcmd+alt+w',
        });
    }
    registerMenus(menus) {
        menus.registerMenuAction(CommonMenus.FILE_OPEN, {
            commandId: WorkspaceCommands.OPEN.id,
            order: 'a00'
        });
        menus.registerMenuAction(CommonMenus.FILE_OPEN, {
            commandId: WorkspaceCommands.OPEN_WORKSPACE.id,
            order: 'a10'
        });
    }
    /**
     * This is the generic `Open` method. Opens files and directories too. Resolves to the opened URI.
     * Except when you are on either Windows or Linux `AND` running in electron. If so, it opens a file.
     */
    async doOpen() {
        const [rootStat] = await this.workspaceService.roots;
        const destinationUri = new URI();
        const destination = await this.fileService.resolve(destinationUri);
        console.log(destination);
        if (destination.isDirectory) {
            this.workspaceService.open(destinationUri);
        }
        else {
            await open(this.openerService, destinationUri);
        }
        return destinationUri;
        // return undefined;
    }
    async doOpenWorkspace() {
        const props = await this.openWorkspaceOpenFileDialogProps();
        const [rootStat] = await this.workspaceService.roots;
        const workspaceFolderOrWorkspaceFileUri = await this.fileDialogService.showOpenDialog(props, rootStat);
        return undefined;
    }
    async openWorkspaceOpenFileDialogProps() {
        await this.preferences.ready;
        const supportMultiRootWorkspace = this.preferences['workspace.supportMultiRootWorkspace'];
        const type = OS.type();
        const electron = false;
        return WorkspaceFrontendContribution_1.createOpenWorkspaceOpenFileDialogProps({
            type,
            electron,
            supportMultiRootWorkspace
        });
    }
};
__decorate([
    inject(WorkspaceService)
], WorkspaceFrontendContribution.prototype, "workspaceService", void 0);
__decorate([
    inject(OpenerService)
], WorkspaceFrontendContribution.prototype, "openerService", void 0);
__decorate([
    inject(FileService)
], WorkspaceFrontendContribution.prototype, "fileService", void 0);
__decorate([
    inject(FileDialogService)
], WorkspaceFrontendContribution.prototype, "fileDialogService", void 0);
__decorate([
    inject(WorkspacePreferences)
], WorkspaceFrontendContribution.prototype, "preferences", void 0);
WorkspaceFrontendContribution = WorkspaceFrontendContribution_1 = __decorate([
    injectable()
], WorkspaceFrontendContribution);
export { WorkspaceFrontendContribution };
(function (WorkspaceFrontendContribution) {
    /**
     * File filter for all Wm and VS Code workspace file types.
     */
    WorkspaceFrontendContribution.DEFAULT_FILE_FILTER = {
        'Wm Workspace (*.wm-workspace)': [WM_EXT],
        'VS Code Workspace (*.code-workspace)': [VSCODE_EXT]
    };
    /**
     * Returns with an `OpenFileDialogProps` for opening the `Open Workspace` dialog.
     */
    function createOpenWorkspaceOpenFileDialogProps(options) {
        const { electron, type, supportMultiRootWorkspace } = options;
        const title = WorkspaceCommands.OPEN_WORKSPACE.dialogLabel;
        // If browser
        if (!electron) {
            // and multi-root workspace is supported, it is always folder + workspace files.
            if (supportMultiRootWorkspace) {
                return {
                    title,
                    canSelectFiles: true,
                    canSelectFolders: true,
                    filters: WorkspaceFrontendContribution.DEFAULT_FILE_FILTER
                };
            }
            else {
                // otherwise, it is always folders. No files at all.
                return {
                    title,
                    canSelectFiles: false,
                    canSelectFolders: true
                };
            }
        }
        // If electron
        if (OS.Type.OSX === type) {
            // `Finder` can select folders and files at the same time. We allow folders and workspace files.
            return {
                title,
                canSelectFiles: true,
                canSelectFolders: true,
                filters: WorkspaceFrontendContribution.DEFAULT_FILE_FILTER
            };
        }
        // In electron, only workspace files can be selected when the multi-root workspace feature is enabled.
        if (supportMultiRootWorkspace) {
            return {
                title,
                canSelectFiles: true,
                canSelectFolders: false,
                filters: WorkspaceFrontendContribution.DEFAULT_FILE_FILTER
            };
        }
        // Otherwise, it is always a folder.
        return {
            title,
            canSelectFiles: false,
            canSelectFolders: true
        };
    }
    WorkspaceFrontendContribution.createOpenWorkspaceOpenFileDialogProps = createOpenWorkspaceOpenFileDialogProps;
})(WorkspaceFrontendContribution || (WorkspaceFrontendContribution = {}));

//# sourceMappingURL=../../lib/browser/workspace-frontend-contribution.js.map
