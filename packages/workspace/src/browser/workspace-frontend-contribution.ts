import {inject, injectable} from 'inversify';
import {CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, OS} from '@tartjs/core/lib/common';
import {CommonMenus, KeybindingContribution, KeybindingRegistry, open, OpenerService} from '@tartjs/core';
import {FileDialogService, FileDialogTreeFilters, OpenFileDialogProps} from '@tartjs/filesystem';
import {WorkspaceCommands} from './workspace-commands';
import URI from '@tartjs/core/lib/common/uri';
import {WorkspaceService} from './workspace-service';
import {FileService} from '@tartjs/filesystem/lib/browser/file-service';
import {WorkspacePreferences} from './workspace-preference';
import {VSCODE_EXT, WM_EXT} from '../common';

@injectable()
export class WorkspaceFrontendContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
  @inject(OpenerService) protected readonly openerService: OpenerService;
  @inject(FileService) protected readonly fileService: FileService;
  @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
  @inject(WorkspacePreferences) protected preferences: WorkspacePreferences;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(WorkspaceCommands.OPEN_WORKSPACE, {
      isEnabled: () => true,
      execute: () => this.doOpenWorkspace(),
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
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

  registerMenus(menus: MenuModelRegistry): void {
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
  protected async doOpen(): Promise<URI | undefined> {
    const [rootStat] = await this.workspaceService.roots;
    const destinationUri = new URI();
    const destination = await this.fileService.resolve(destinationUri);
    console.log(destination);
    if (destination.isDirectory) {
      this.workspaceService.open(destinationUri);
    } else {
      await open(this.openerService, destinationUri);
    }
    return destinationUri;
    // return undefined;
  }

  protected async doOpenWorkspace(): Promise<URI | undefined> {
    const props = await this.openWorkspaceOpenFileDialogProps();
    const [rootStat] = await this.workspaceService.roots;
    const workspaceFolderOrWorkspaceFileUri = await this.fileDialogService.showOpenDialog(props, rootStat);
    return undefined;
  }

  protected async openWorkspaceOpenFileDialogProps(): Promise<OpenFileDialogProps> {
    await this.preferences.ready;
    const supportMultiRootWorkspace = this.preferences['workspace.supportMultiRootWorkspace'];
    const type = OS.type();
    const electron = false;
    return WorkspaceFrontendContribution.createOpenWorkspaceOpenFileDialogProps({
      type,
      electron,
      supportMultiRootWorkspace
    });
  }
}

export namespace WorkspaceFrontendContribution {
  /**
   * File filter for all Wm and VS Code workspace file types.
   */
  export const DEFAULT_FILE_FILTER: FileDialogTreeFilters = {
    'Wm Workspace (*.wm-workspace)': [WM_EXT],
    'VS Code Workspace (*.code-workspace)': [VSCODE_EXT]
  };

  /**
   * Returns with an `OpenFileDialogProps` for opening the `Open Workspace` dialog.
   */
  export function createOpenWorkspaceOpenFileDialogProps(options: Readonly<{ type: OS.Type, electron: boolean, supportMultiRootWorkspace: boolean }>): OpenFileDialogProps {
    const {electron, type, supportMultiRootWorkspace} = options;
    const title = WorkspaceCommands.OPEN_WORKSPACE.dialogLabel;
    // If browser
    if (!electron) {
      // and multi-root workspace is supported, it is always folder + workspace files.
      if (supportMultiRootWorkspace) {
        return {
          title,
          canSelectFiles: true,
          canSelectFolders: true,
          filters: DEFAULT_FILE_FILTER
        };
      } else {
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
        filters: DEFAULT_FILE_FILTER
      };
    }

    // In electron, only workspace files can be selected when the multi-root workspace feature is enabled.
    if (supportMultiRootWorkspace) {
      return {
        title,
        canSelectFiles: true,
        canSelectFolders: false,
        filters: DEFAULT_FILE_FILTER
      };
    }

    // Otherwise, it is always a folder.
    return {
      title,
      canSelectFiles: false,
      canSelectFolders: true
    };
  }
}
