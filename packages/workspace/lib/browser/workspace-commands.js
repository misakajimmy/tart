var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CommonCommands, CommonMenus, LabelProvider, open, OpenerService, SingleTextInputDialog } from '@tart/core';
import { Command, Emitter, SelectionService, } from '@tart/core/lib/common';
import { nls } from '@tart/core/lib/common/nls';
import { inject, injectable, postConstruct } from 'inversify';
import { WorkspacePreferences } from './workspace-preference';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { WorkspaceService } from './workspace-service';
import { UriAwareCommandHandler } from '@tart/core/lib/common/uri-command-handler';
import { FileSystemUtils } from '@tart/filesystem/lib/browser/file-tree/filesystem-utils';
import { WorkspaceInputDialog } from './workspace-input-dialog';
import * as validFilename from 'valid-filename';
import { FileSystemCommands } from '@tart/filesystem';
import { WorkspaceDeleteHandler } from './workspace-delete-handler';
import { FileDownloadCommands } from '@tart/filesystem/lib/browser/download/file-download-command-contribution';
export var WorkspaceCommands;
(function (WorkspaceCommands) {
    const WORKSPACE_CATEGORY = 'Workspaces';
    const FILE_CATEGORY = CommonCommands.FILE_CATEGORY;
    // On Linux and Windows, both files and folders cannot be opened at the same time in electron.
    // `OPEN_FILE` and `OPEN_FOLDER` must be available only on Linux and Windows in electron.
    // `OPEN` must *not* be available on Windows and Linux in electron.
    // VS Code does the same. See: https://github.com/eclipse-theia/theia/pull/3202#issuecomment-430585357
    WorkspaceCommands.OPEN = Object.assign(Object.assign({}, Command.toDefaultLocalizedCommand({
        id: 'workspace:open',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Open...'
    })), { dialogLabel: nls.localizeByDefault('Open') });
    // No `label`. Otherwise, it shows up in the `Command Palette`.
    WorkspaceCommands.OPEN_FILE = {
        id: 'workspace:openFile',
        originalCategory: FILE_CATEGORY,
        category: nls.localizeByDefault(CommonCommands.FILE_CATEGORY),
        dialogLabel: 'Open File'
    };
    WorkspaceCommands.OPEN_FOLDER = {
        id: 'workspace:openFolder',
        dialogLabel: nls.localizeByDefault('Open Folder') // No `label`. Otherwise, it shows up in the `Command Palette`.
    };
    WorkspaceCommands.OPEN_WORKSPACE = Object.assign(Object.assign({}, Command.toDefaultLocalizedCommand({
        id: 'workspace:openWorkspace',
        category: CommonCommands.FILE_CATEGORY,
        label: nls.localizeByDefault('Open Workspace'),
    })), { dialogLabel: nls.localizeByDefault('Open Workspace') });
    WorkspaceCommands.OPEN_RECENT_WORKSPACE = Command.toLocalizedCommand({
        id: 'workspace:openRecent',
        category: FILE_CATEGORY,
        label: 'Open Recent Workspace...'
    }, 'theia/workspace/openRecentWorkspace', CommonCommands.FILE_CATEGORY_KEY);
    WorkspaceCommands.CLOSE = Command.toDefaultLocalizedCommand({
        id: 'workspace:close',
        category: WORKSPACE_CATEGORY,
        label: 'Close Workspace'
    });
    WorkspaceCommands.NEW_FILE = Command.toDefaultLocalizedCommand({
        id: 'file.newFile',
        category: FILE_CATEGORY,
        label: 'New File'
    });
    WorkspaceCommands.NEW_PYTHON_FILE = Command.toDefaultLocalizedCommand({
        id: 'file.newPythonFile',
        category: FILE_CATEGORY,
        label: '新建 Python 文件'
    });
    WorkspaceCommands.NEW_BLOCKLY_FILE = Command.toDefaultLocalizedCommand({
        id: 'file.newBlocklyFile',
        category: FILE_CATEGORY,
        label: '新建 Blockly 文件'
    });
    WorkspaceCommands.NEW_FOLDER = Command.toDefaultLocalizedCommand({
        id: 'file.newFolder',
        category: FILE_CATEGORY,
        label: 'New Folder'
    });
    WorkspaceCommands.FILE_OPEN_WITH = (opener) => ({
        id: `file.openWith.${opener.id}`
    });
    WorkspaceCommands.FILE_RENAME = Command.toDefaultLocalizedCommand({
        id: 'file.rename',
        category: FILE_CATEGORY,
        label: 'Rename'
    });
    WorkspaceCommands.FILE_DELETE = Command.toDefaultLocalizedCommand({
        id: 'file.delete',
        category: FILE_CATEGORY,
        label: 'Delete'
    });
    WorkspaceCommands.FILE_DUPLICATE = Command.toLocalizedCommand({
        id: 'file.duplicate',
        category: FILE_CATEGORY,
        label: 'Duplicate'
    }, 'theia/workspace/duplicate', CommonCommands.FILE_CATEGORY_KEY);
    WorkspaceCommands.FILE_COMPARE = Command.toLocalizedCommand({
        id: 'file.compare',
        category: FILE_CATEGORY,
        label: 'Compare with Each Other'
    }, 'theia/workspace/compareWithEachOther', CommonCommands.FILE_CATEGORY_KEY);
    WorkspaceCommands.ADD_FOLDER = Command.toDefaultLocalizedCommand({
        id: 'workspace:addFolder',
        category: WORKSPACE_CATEGORY,
        label: 'Add Folder to Workspace...'
    });
    WorkspaceCommands.REMOVE_FOLDER = Command.toDefaultLocalizedCommand({
        id: 'workspace:removeFolder',
        category: WORKSPACE_CATEGORY,
        label: 'Remove Folder from Workspace'
    });
    WorkspaceCommands.SAVE_WORKSPACE_AS = Command.toDefaultLocalizedCommand({
        id: 'workspace:saveAs',
        category: WORKSPACE_CATEGORY,
        label: 'Save Workspace As...'
    });
    WorkspaceCommands.OPEN_WORKSPACE_FILE = Command.toDefaultLocalizedCommand({
        id: 'workspace:openConfigFile',
        category: WORKSPACE_CATEGORY,
        label: 'Open Workspace Configuration File'
    });
    WorkspaceCommands.SAVE_AS = Command.toDefaultLocalizedCommand({
        id: 'file.saveAs',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Save As...',
    });
})(WorkspaceCommands || (WorkspaceCommands = {}));
let WorkspaceCommandContribution = class WorkspaceCommandContribution {
    constructor() {
        this.onDidCreateNewFileEmitter = new Emitter();
        this.onDidCreateNewFolderEmitter = new Emitter();
    }
    get onDidCreateNewFile() {
        return this.onDidCreateNewFileEmitter.event;
    }
    get onDidCreateNewFolder() {
        return this.onDidCreateNewFolderEmitter.event;
    }
    init() {
    }
    registerCommands(commands) {
        commands.registerCommand(WorkspaceCommands.NEW_FILE, this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.getDirectory(uri).then(parent => {
                if (parent) {
                    const parentUri = parent.resource;
                    const { fileName, fileExtension } = this.getDefaultFileConfig();
                    const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parentUri, parent, fileName, fileExtension);
                    const dialog = new WorkspaceInputDialog({
                        title: nls.localizeByDefault('New File'),
                        parentUri: parentUri,
                        initialValue: vacantChildUri.path.base,
                        validate: name => this.validateFileName(name, parent, true)
                    }, this.labelProvider);
                    dialog.open().then(async (name) => {
                        if (name) {
                            const fileUri = parentUri.resolve(name);
                            await this.fileService.create(fileUri);
                            this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
                            open(this.openerService, fileUri);
                        }
                    });
                }
            })
        }));
        commands.registerCommand(WorkspaceCommands.NEW_PYTHON_FILE, this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.getDirectory(uri).then(parent => {
                if (parent) {
                    const parentUri = parent.resource;
                    const { fileName } = this.getDefaultFileConfig();
                    const fileExtension = '.py';
                    const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parentUri, parent, fileName, fileExtension);
                    const dialog = new WorkspaceInputDialog({
                        title: nls.localizeByDefault('New File'),
                        parentUri: parentUri,
                        initialValue: vacantChildUri.path.base,
                        validate: name => this.validateFileName(name, parent, true)
                    }, this.labelProvider);
                    dialog.open().then(async (name) => {
                        if (name) {
                            name = name.endsWith('.py') ? name : name + '.py';
                            const fileUri = parentUri.resolve(name);
                            await this.fileService.create(fileUri);
                            this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
                            open(this.openerService, fileUri);
                        }
                    });
                }
            })
        }));
        commands.registerCommand(WorkspaceCommands.NEW_BLOCKLY_FILE, this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.getDirectory(uri).then(parent => {
                if (parent) {
                    const parentUri = parent.resource;
                    const { fileName } = this.getDefaultFileConfig();
                    const fileExtension = '.blockly';
                    const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parentUri, parent, fileName, fileExtension);
                    const dialog = new WorkspaceInputDialog({
                        title: nls.localizeByDefault('New File'),
                        parentUri: parentUri,
                        initialValue: vacantChildUri.path.base,
                        validate: name => this.validateFileName(name, parent, true)
                    }, this.labelProvider);
                    dialog.open().then(async (name) => {
                        if (name) {
                            name = name.endsWith('.blockly?') ? name : name + '.blockly';
                            const fileUri = parentUri.resolve(name);
                            await this.fileService.create(fileUri);
                            this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
                            open(this.openerService, fileUri);
                        }
                    });
                }
            })
        }));
        commands.registerCommand(WorkspaceCommands.NEW_FOLDER, this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.getDirectory(uri).then(parent => {
                if (parent) {
                    const parentUri = parent.resource;
                    const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parentUri, parent, 'Untitled');
                    const dialog = new WorkspaceInputDialog({
                        title: nls.localizeByDefault('New Folder'),
                        parentUri: parentUri,
                        initialValue: vacantChildUri.path.base,
                        validate: name => this.validateFileName(name, parent, true)
                    }, this.labelProvider);
                    dialog.open().then(async (name) => {
                        if (name) {
                            const folderUri = parentUri.resolve(name);
                            await this.fileService.createFolder(folderUri);
                            this.fireCreateNewFile({ parent: parentUri, uri: folderUri });
                        }
                    });
                }
            })
        }));
        commands.registerCommand(WorkspaceCommands.FILE_RENAME, this.newMultiUriAwareCommandHandler({
            isEnabled: uris => uris.some(uri => !this.isWorkspaceRoot(uri)) && uris.length === 1,
            isVisible: uris => uris.some(uri => !this.isWorkspaceRoot(uri)) && uris.length === 1,
            execute: (uris) => {
                uris.forEach(async (uri) => {
                    const parent = await this.getParent(uri);
                    if (parent) {
                        const oldName = uri.path.base;
                        const dialog = new SingleTextInputDialog({
                            title: nls.localizeByDefault('Rename'),
                            initialValue: oldName,
                            initialSelectionRange: {
                                start: 0,
                                end: uri.path.name.length
                            },
                            validate: async (newName, mode) => {
                                if (oldName === newName && mode === 'preview') {
                                    return false;
                                }
                                return this.validateFileRename(oldName, newName, parent);
                            }
                        });
                        const fileName = await dialog.open();
                        if (fileName) {
                            const oldUri = uri;
                            const newUri = uri.parent.resolve(fileName);
                            this.fileService.move(oldUri, newUri);
                        }
                    }
                });
            }
        }));
        commands.registerCommand(WorkspaceCommands.FILE_DELETE, this.newMultiUriAwareCommandHandler(this.deleteHandler));
        this.preferences.ready.then(() => {
            // commands.registerCommand(WorkspaceCommands.ADD_FOLDER, {
            //     execute: async () => {
            //         let uri = [new URI()];
            //         await this.addFolderToWorkspace(...uri);
            //     }
            // });
        });
    }
    fireCreateNewFile(uri) {
        this.onDidCreateNewFileEmitter.fire(uri);
    }
    fireCreateNewFolder(uri) {
        this.onDidCreateNewFolderEmitter.fire(uri);
    }
    async getDirectory(candidate) {
        let stat;
        try {
            stat = await this.fileService.resolve(candidate);
        }
        catch (_a) {
        }
        if (stat && stat.isDirectory) {
            return stat;
        }
        return this.getParent(candidate);
    }
    async validateFileRename(oldName, newName, parent) {
        if (await parent.resource.resolve(newName).isEqual(parent.resource.resolve(oldName), false)) {
            return '';
        }
        return this.validateFileName(newName, parent, false);
    }
    isWorkspaceRoot(uri) {
        const rootUris = new Set(this.workspaceService.tryGetRoots().map(root => root.resource.toString()));
        return rootUris.has(uri.toString());
    }
    async getParent(candidate) {
        try {
            return await this.fileService.resolve(candidate.parent);
        }
        catch (_a) {
            return undefined;
        }
    }
    getDefaultFileConfig() {
        return {
            fileName: 'Untitled',
            fileExtension: '.txt'
        };
    }
    async addFolderToWorkspace(...uris) {
        if (uris.length) {
            const foldersToAdd = [];
            try {
                for (const uri of uris) {
                    const stat = await this.fileService.resolve(uri);
                    if (stat.isDirectory) {
                        foldersToAdd.push(uri);
                    }
                }
                await this.workspaceService.addRoot(foldersToAdd);
            }
            catch (_a) {
            }
        }
    }
    newMultiUriAwareCommandHandler(handler) {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }
    /**
     * Returns an error message if the file name is invalid. Otherwise, an empty string.
     *
     * @param name the simple file name of the file to validate.
     * @param parent the parent directory's file stat.
     * @param allowNested allow file or folder creation using recursive path
     */
    async validateFileName(name, parent, allowNested = false) {
        if (!name) {
            return '';
        }
        // do not allow recursive rename
        if (!allowNested && !validFilename(name)) {
            return nls.localizeByDefault('Invalid file or folder name');
        }
        if (name.startsWith('/')) {
            return nls.localizeByDefault('Absolute paths or names that starts with / are not allowed');
        }
        else if (name.startsWith(' ') || name.endsWith(' ')) {
            return nls.localizeByDefault('Names with leading or trailing whitespaces are not allowed');
        }
        // check and validate each sub-paths
        if (name.split(/[\\/]/).some(file => !file || !validFilename(file) || /^\s+$/.test(file))) {
            return nls.localizeByDefault('The name "{0}" is not a valid file or folder name.', this.trimFileName(name));
        }
        const childUri = parent.resource.resolve(name);
        const exists = await this.fileService.exists(childUri);
        if (exists) {
            return nls.localizeByDefault('A file or folder "{0}" already exists at this location.', this.trimFileName(name));
        }
        return '';
    }
    trimFileName(name) {
        if (name && name.length > 30) {
            return `${name.substr(0, 30)}...`;
        }
        return name;
    }
    newWorkspaceRootUriAwareCommandHandler(handler) {
        return new WorkspaceRootUriAwareCommandHandler(this.workspaceService, this.selectionService, handler);
    }
};
__decorate([
    inject(LabelProvider)
], WorkspaceCommandContribution.prototype, "labelProvider", void 0);
__decorate([
    inject(FileService)
], WorkspaceCommandContribution.prototype, "fileService", void 0);
__decorate([
    inject(OpenerService)
], WorkspaceCommandContribution.prototype, "openerService", void 0);
__decorate([
    inject(WorkspaceService)
], WorkspaceCommandContribution.prototype, "workspaceService", void 0);
__decorate([
    inject(SelectionService)
], WorkspaceCommandContribution.prototype, "selectionService", void 0);
__decorate([
    inject(WorkspaceDeleteHandler)
], WorkspaceCommandContribution.prototype, "deleteHandler", void 0);
__decorate([
    inject(WorkspacePreferences)
], WorkspaceCommandContribution.prototype, "preferences", void 0);
__decorate([
    postConstruct()
], WorkspaceCommandContribution.prototype, "init", null);
WorkspaceCommandContribution = __decorate([
    injectable()
], WorkspaceCommandContribution);
export { WorkspaceCommandContribution };
export class WorkspaceRootUriAwareCommandHandler extends UriAwareCommandHandler {
    constructor(workspaceService, selectionService, handler) {
        super(selectionService, handler);
        this.workspaceService = workspaceService;
        this.selectionService = selectionService;
        this.handler = handler;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isEnabled(...args) {
        return super.isEnabled(...args) && !!this.workspaceService.tryGetRoots().length;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isVisible(...args) {
        return super.isVisible(...args) && !!this.workspaceService.tryGetRoots().length;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getUri(...args) {
        const uri = super.getUri(...args);
        // Return the `uri` immediately if the resource exists in any of the workspace roots and is of `file` scheme.
        if (uri && uri.scheme === 'file' && this.workspaceService.getWorkspaceRootUri(uri)) {
            return uri;
        }
        // Return the first root if available.
        if (!!this.workspaceService.tryGetRoots().length) {
            return this.workspaceService.tryGetRoots()[0].resource;
        }
    }
}
let FileMenuContribution = class FileMenuContribution {
    registerMenus(registry) {
        registry.registerMenuAction(CommonMenus.FILE_NEW, {
            commandId: WorkspaceCommands.NEW_FILE.id,
            order: 'a'
        });
        registry.registerMenuAction(CommonMenus.FILE_NEW, {
            commandId: WorkspaceCommands.NEW_FOLDER.id,
            order: 'b'
        });
        const downloadUploadMenu = [...CommonMenus.FILE, '4_downloadupload'];
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileSystemCommands.UPLOAD.id,
            order: 'a'
        });
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileDownloadCommands.DOWNLOAD.id,
            order: 'b'
        });
    }
};
FileMenuContribution = __decorate([
    injectable()
], FileMenuContribution);
export { FileMenuContribution };

//# sourceMappingURL=../../lib/browser/workspace-commands.js.map
