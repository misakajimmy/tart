var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, postConstruct } from 'inversify';
import { AbstractViewContribution, codicon, CommonCommands, Navigatable, SelectableTreeNode } from '@tart/core';
import { FILE_NAVIGATOR_ID, FileNavigatorWidget } from './navigator-widget';
import { EXPLORER_VIEW_CONTAINER_ID, EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS } from './navigator-widget-factory';
import { Command, CommandRegistry, DisposableCollection, isOSX, isWindows, MenuModelRegistry } from '@tart/core/lib/common';
import { TabBarToolbarRegistry } from '@tart/core/lib/browser/shell/tab-bar-toolbar';
import { FileNavigatorPreferences } from './navigator-preferences';
import { NavigatorContextKeyService } from './navigator-context-key-service';
import { WorkspaceCommandContribution, WorkspaceCommands, WorkspacePreferences, WorkspaceService } from '@tart/workspace';
import { nls } from '@tart/core/lib/common/nls';
import { DirNode, FileSystemCommands } from '@tart/filesystem';
import { NavigatorDiffCommands } from './navigator-diff';
import { OpenEditorsContextMenu, OpenEditorsWidget } from './open-editors-widget';
import { NavigatorKeybindingContexts } from './navigator-keybinding-context';
import { FileDownloadCommands } from '@tart/filesystem/lib/browser/download/file-download-command-contribution';
export var FileNavigatorCommands;
(function (FileNavigatorCommands) {
    FileNavigatorCommands.REVEAL_IN_NAVIGATOR = Command.toLocalizedCommand({
        id: 'navigator.reveal',
        label: 'Reveal in Explorer'
    }, 'wm/navigator/reveal');
    FileNavigatorCommands.TOGGLE_HIDDEN_FILES = Command.toLocalizedCommand({
        id: 'navigator.toggle.hidden.files',
        label: 'Toggle Hidden Files'
    }, 'wm/navigator/toggleHiddenFiles');
    FileNavigatorCommands.TOGGLE_AUTO_REVEAL = Command.toLocalizedCommand({
        id: 'navigator.toggle.autoReveal',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Auto Reveal'
    }, 'wm/navigator/autoReveal', CommonCommands.FILE_CATEGORY_KEY);
    FileNavigatorCommands.REFRESH_NAVIGATOR = Command.toLocalizedCommand({
        id: 'navigator.refresh',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Refresh in Explorer',
        iconClass: codicon('refresh')
    }, 'wm/navigator/refresh', CommonCommands.FILE_CATEGORY_KEY);
    FileNavigatorCommands.COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
        id: 'navigator.collapse.all',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Collapse Folders in Explorer',
        iconClass: codicon('collapse-all')
    });
    FileNavigatorCommands.ADD_ROOT_FOLDER = {
        id: 'navigator.addRootFolder'
    };
    FileNavigatorCommands.FOCUS = Command.toDefaultLocalizedCommand({
        id: 'workbench.files.action.focusFilesExplorer',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Focus on Files Explorer'
    });
    FileNavigatorCommands.COPY_RELATIVE_FILE_PATH = Command.toDefaultLocalizedCommand({
        id: 'navigator.copyRelativeFilePath',
        label: 'Copy Relative Path'
    });
    FileNavigatorCommands.OPEN = Command.toDefaultLocalizedCommand({
        id: 'navigator.open',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Open'
    });
})(FileNavigatorCommands || (FileNavigatorCommands = {}));
/**
 * Navigator `More Actions...` toolbar item groups.
 * Used in order to group items present in the toolbar.
 */
export var NavigatorMoreToolbarGroups;
(function (NavigatorMoreToolbarGroups) {
    NavigatorMoreToolbarGroups.NEW_OPEN = '1_navigator_new_open';
    NavigatorMoreToolbarGroups.TOOLS = '2_navigator_tools';
    NavigatorMoreToolbarGroups.WORKSPACE = '3_navigator_workspace';
})(NavigatorMoreToolbarGroups || (NavigatorMoreToolbarGroups = {}));
export const NAVIGATOR_CONTEXT_MENU = ['navigator-context-menu'];
/**
 * Navigator context menu default groups should be aligned
 * with VS Code default groups: https://code.visualstudio.com/api/references/contribution-points#contributes.menus
 */
export var NavigatorContextMenu;
(function (NavigatorContextMenu) {
    NavigatorContextMenu.NAVIGATION = [...NAVIGATOR_CONTEXT_MENU, 'navigation'];
    /** @deprecated use NAVIGATION */
    NavigatorContextMenu.OPEN = NavigatorContextMenu.NAVIGATION;
    /** @deprecated use NAVIGATION */
    NavigatorContextMenu.NEW = NavigatorContextMenu.NAVIGATION;
    NavigatorContextMenu.WORKSPACE = [...NAVIGATOR_CONTEXT_MENU, '2_workspace'];
    NavigatorContextMenu.COMPARE = [...NAVIGATOR_CONTEXT_MENU, '3_compare'];
    /** @deprecated use COMPARE */
    NavigatorContextMenu.DIFF = NavigatorContextMenu.COMPARE;
    NavigatorContextMenu.SEARCH = [...NAVIGATOR_CONTEXT_MENU, '4_search'];
    NavigatorContextMenu.CLIPBOARD = [...NAVIGATOR_CONTEXT_MENU, '5_cutcopypaste'];
    NavigatorContextMenu.SERIAL = [...NAVIGATOR_CONTEXT_MENU, '6_webserial'];
    NavigatorContextMenu.MODIFICATION = [...NAVIGATOR_CONTEXT_MENU, '7_modification'];
    /** @deprecated use MODIFICATION */
    NavigatorContextMenu.MOVE = NavigatorContextMenu.MODIFICATION;
    /** @deprecated use MODIFICATION */
    NavigatorContextMenu.ACTIONS = NavigatorContextMenu.MODIFICATION;
    NavigatorContextMenu.OPEN_WITH = [...NavigatorContextMenu.NAVIGATION, 'open_with'];
})(NavigatorContextMenu || (NavigatorContextMenu = {}));
export const FILE_NAVIGATOR_TOGGLE_COMMAND_ID = 'fileNavigator:toggle';
let FileNavigatorContribution = class FileNavigatorContribution extends AbstractViewContribution {
    constructor(fileNavigatorPreferences, workspaceService, workspacePreferences) {
        super({
            viewContainerId: EXPLORER_VIEW_CONTAINER_ID,
            widgetId: FILE_NAVIGATOR_ID,
            widgetName: EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS.label,
            defaultWidgetOptions: {
                area: 'left',
                rank: 100
            },
            toggleCommandId: FILE_NAVIGATOR_TOGGLE_COMMAND_ID,
            toggleKeybinding: 'ctrlcmd+shift+e'
        });
        this.fileNavigatorPreferences = fileNavigatorPreferences;
        this.workspaceService = workspaceService;
        this.workspacePreferences = workspacePreferences;
        this.toDisposeAddRemoveFolderActions = new DisposableCollection();
        /**
         * Register commands to the `More Actions...` navigator toolbar item.
         */
        this.registerMoreToolbarItem = (item) => {
            const commandId = item.command;
            const id = 'navigator.tabbar.toolbar.' + commandId;
            const command = this.commandRegistry.getCommand(commandId);
            this.commandRegistry.registerCommand({ id, iconClass: command && command.iconClass }, {
                execute: (w, ...args) => w instanceof FileNavigatorWidget
                    && this.commandRegistry.executeCommand(commandId, ...args),
                isEnabled: (w, ...args) => w instanceof FileNavigatorWidget
                    && this.commandRegistry.isEnabled(commandId, ...args),
                isVisible: (w, ...args) => w instanceof FileNavigatorWidget
                    && this.commandRegistry.isVisible(commandId, ...args),
                isToggled: (w, ...args) => w instanceof FileNavigatorWidget
                    && this.commandRegistry.isToggled(commandId, ...args),
            });
            item.command = id;
            this.tabbarToolbarRegistry.registerItem(item);
        };
    }
    async onStart(app) {
        this.workspacePreferences.ready.then(() => {
            this.updateAddRemoveFolderActions(this.menuRegistry);
            this.workspacePreferences.onPreferenceChanged(change => {
                if (change.preferenceName === 'workspace.supportMultiRootWorkspace') {
                    this.updateAddRemoveFolderActions(this.menuRegistry);
                }
            });
        });
    }
    /**
     * Reveals and selects node in the file navigator to which given widget is related.
     * Does nothing if given widget undefined or doesn't have related resource.
     *
     * @param widget widget file resource of which should be revealed and selected
     */
    async selectWidgetFileNode(widget) {
        if (Navigatable.is(widget)) {
            const resourceUri = widget.getResourceUri();
            if (resourceUri) {
                const { model } = await this.widget;
                const node = await model.revealFile(resourceUri);
                if (SelectableTreeNode.is(node)) {
                    model.selectNode(node);
                }
            }
        }
    }
    async initializeLayout(app) {
        console.log('open view');
        await this.openView();
    }
    registerCommands(registry) {
        super.registerCommands(registry);
        registry.registerCommand(FileNavigatorCommands.FOCUS, {
            execute: () => this.openView({ activate: true })
        });
        // registry.registerCommand(FileNavigatorCommands.ADD_ROOT_FOLDER, {
        //     execute: (...args) => registry.executeCommand(WorkspaceCommands.ADD_FOLDER.id, args),
        // });
        registry.registerCommand(FileNavigatorCommands.REFRESH_NAVIGATOR, {
            execute: widget => this.withWidget(widget, () => this.refreshWorkspace()),
            isEnabled: widget => this.withWidget(widget, () => this.workspaceService.opened),
            isVisible: widget => this.withWidget(widget, () => this.workspaceService.opened),
        });
    }
    async registerToolbarItems(toolbarRegistry) {
        toolbarRegistry.registerItem({
            id: FileNavigatorCommands.REFRESH_NAVIGATOR.id,
            command: FileNavigatorCommands.REFRESH_NAVIGATOR.id,
            tooltip: nls.localizeByDefault('Refresh Explorer'),
            priority: 0,
        });
        // this.registerMoreToolbarItem({
        //     id: WorkspaceCommands.ADD_FOLDER.id,
        //     command: WorkspaceCommands.ADD_FOLDER.id,
        //     tooltip: WorkspaceCommands.ADD_FOLDER.label,
        //     group: NavigatorMoreToolbarGroups.WORKSPACE,
        // });
    }
    registerKeybindings(registry) {
        super.registerKeybindings(registry);
        registry.registerKeybinding({
            command: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id,
            keybinding: 'alt+r'
        });
        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_DELETE.id,
            keybinding: isOSX ? 'cmd+backspace' : 'del',
            context: NavigatorKeybindingContexts.navigatorActive
        });
        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_RENAME.id,
            keybinding: 'f2',
            context: NavigatorKeybindingContexts.navigatorActive
        });
        registry.registerKeybinding({
            command: FileNavigatorCommands.TOGGLE_HIDDEN_FILES.id,
            keybinding: 'ctrlcmd+i',
            context: NavigatorKeybindingContexts.navigatorActive
        });
        registry.registerKeybinding({
            command: FileNavigatorCommands.COPY_RELATIVE_FILE_PATH.id,
            keybinding: isWindows ? 'ctrl+k ctrl+shift+c' : 'ctrlcmd+shift+alt+c',
            when: '!editorFocus'
        });
    }
    registerMenus(registry) {
        super.registerMenus(registry);
        // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_MENU, {
        //     commandId: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id,
        //     label: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.label,
        //     order: '5'
        // });
        registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: FileNavigatorCommands.OPEN.id,
            label: FileNavigatorCommands.OPEN.label
        });
        registry.registerSubmenu(NavigatorContextMenu.OPEN_WITH, nls.localizeByDefault('Open With...'));
        // this.openerService.getOpeners().then(openers => {
        //     for (const opener of openers) {
        //         const openWithCommand = WorkspaceCommands.FILE_OPEN_WITH(opener);
        //         registry.registerMenuAction(NavigatorContextMenu.OPEN_WITH, {
        //             commandId: openWithCommand.id,
        //             label: opener.label,
        //             icon: opener.iconClass
        //         });
        //     }
        // });
        // registry.registerMenuAction([CONTEXT_MENU_PATH, CUT_MENU_GROUP], {
        //     commandId: Commands.FILE_CUT
        // });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY.id,
            order: 'a'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.PASTE.id,
            order: 'b'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: 'c'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: FileNavigatorCommands.COPY_RELATIVE_FILE_PATH.id,
            label: FileNavigatorCommands.COPY_RELATIVE_FILE_PATH.label,
            order: 'd'
        });
        // registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
        //     commandId: FileDownloadCommands.COPY_DOWNLOAD_LINK.id,
        //     order: 'z'
        // });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_RENAME.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DELETE.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DUPLICATE.id
        });
        const downloadUploadMenu = [...NAVIGATOR_CONTEXT_MENU, '6_downloadupload'];
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileSystemCommands.UPLOAD.id,
            order: 'a'
        });
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileDownloadCommands.DOWNLOAD.id,
            order: 'b'
        });
        const fileSubMenuPath = [...NavigatorContextMenu.NAVIGATION, 'new-file'];
        registry.registerSubmenu(fileSubMenuPath, nls.localize('New File', '新建文件'), {
            order: '0'
        });
        registry.registerMenuAction(fileSubMenuPath, {
            commandId: WorkspaceCommands.NEW_FILE.id,
            order: 'a',
        });
        registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: WorkspaceCommands.NEW_FOLDER.id
        });
        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: WorkspaceCommands.FILE_COMPARE.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: FileNavigatorCommands.COLLAPSE_ALL.id,
            label: nls.localizeByDefault('Collapse All'),
            order: 'z2'
        });
        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_FIRST.id,
            order: 'za'
        });
        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_SECOND.id,
            order: 'zb'
        });
        // Open Editors Widget Menu Items
        registry.registerMenuAction(OpenEditorsContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.CLIPBOARD, {
            commandId: FileNavigatorCommands.COPY_RELATIVE_FILE_PATH.id,
            order: 'b'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.SAVE, {
            commandId: CommonCommands.SAVE.id,
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_FIRST.id,
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_SECOND.id,
            order: 'b'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_TAB.id,
            label: 'Close',
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_OTHER_TABS.id,
            label: 'Close Others',
            order: 'b'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_ALL_MAIN_TABS.id,
            label: 'Close All',
            order: 'c'
        });
    }
    /**
     * force refresh workspace in navigator
     */
    async refreshWorkspace() {
        const { model } = await this.widget;
        await model.refresh();
    }
    async init() {
        await this.fileNavigatorPreferences.ready;
        this.shell.currentChanged.connect(() => this.onCurrentWidgetChangedHandler());
        const updateFocusContextKeys = () => {
            const hasFocus = this.shell.activeWidget instanceof FileNavigatorWidget;
            this.contextKeyService.explorerViewletFocus.set(hasFocus);
            this.contextKeyService.filesExplorerFocus.set(hasFocus);
        };
        updateFocusContextKeys();
        this.shell.activeChanged.connect(updateFocusContextKeys);
        this.workspaceCommandContribution.onDidCreateNewFile(async (event) => this.onDidCreateNewResource(event));
        this.workspaceCommandContribution.onDidCreateNewFolder(async (event) => this.onDidCreateNewResource(event));
    }
    withWidget(widget = this.tryGetWidget(), cb) {
        if ((widget instanceof FileNavigatorWidget && widget.id === FILE_NAVIGATOR_ID) || widget instanceof OpenEditorsWidget) {
            return cb(widget);
        }
        return false;
    }
    onCurrentWidgetChangedHandler() {
        if (this.fileNavigatorPreferences['explorer.autoReveal']) {
            this.selectWidgetFileNode(this.shell.currentWidget);
        }
    }
    async onDidCreateNewResource(event) {
        const navigator = this.tryGetWidget();
        if (!navigator || !navigator.isVisible) {
            return;
        }
        const model = navigator.model;
        const parent = await model.revealFile(event.parent);
        if (DirNode.is(parent)) {
            await model.refresh(parent);
        }
        const node = await model.revealFile(event.uri);
        if (SelectableTreeNode.is(node)) {
            model.selectNode(node);
            if (DirNode.is(node)) {
                this.openView({ activate: true });
            }
        }
    }
    updateAddRemoveFolderActions(registry) {
        this.toDisposeAddRemoveFolderActions.dispose();
        if (this.workspacePreferences['workspace.supportMultiRootWorkspace']) {
            // this.toDisposeAddRemoveFolderActions.push(registry.registerMenuAction(NavigatorContextMenu.WORKSPACE, {
            //     commandId: FileNavigatorCommands.ADD_ROOT_FOLDER.id,
            //     label: WorkspaceCommands.ADD_FOLDER.label!
            // }));
            this.toDisposeAddRemoveFolderActions.push(registry.registerMenuAction(NavigatorContextMenu.WORKSPACE, {
                commandId: WorkspaceCommands.REMOVE_FOLDER.id
            }));
        }
    }
};
__decorate([
    inject(NavigatorContextKeyService)
], FileNavigatorContribution.prototype, "contextKeyService", void 0);
__decorate([
    inject(CommandRegistry)
], FileNavigatorContribution.prototype, "commandRegistry", void 0);
__decorate([
    inject(TabBarToolbarRegistry)
], FileNavigatorContribution.prototype, "tabbarToolbarRegistry", void 0);
__decorate([
    inject(MenuModelRegistry)
], FileNavigatorContribution.prototype, "menuRegistry", void 0);
__decorate([
    inject(WorkspaceCommandContribution)
], FileNavigatorContribution.prototype, "workspaceCommandContribution", void 0);
__decorate([
    postConstruct()
], FileNavigatorContribution.prototype, "init", null);
FileNavigatorContribution = __decorate([
    injectable(),
    __param(0, inject(FileNavigatorPreferences)),
    __param(1, inject(WorkspaceService)),
    __param(2, inject(WorkspacePreferences))
], FileNavigatorContribution);
export { FileNavigatorContribution };

//# sourceMappingURL=../../lib/browser/navigator-contribution.js.map
