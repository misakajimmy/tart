import { AbstractViewContribution, FrontendApplication, FrontendApplicationContribution, KeybindingRegistry, Widget } from '@tart/core';
import { FileNavigatorWidget } from './navigator-widget';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MenuPath, Mutable } from '@tart/core/lib/common';
import { TabBarToolbarContribution, TabBarToolbarItem, TabBarToolbarRegistry } from '@tart/core/lib/browser/shell/tab-bar-toolbar';
import { FileNavigatorPreferences } from './navigator-preferences';
import { NavigatorContextKeyService } from './navigator-context-key-service';
import { WorkspaceCommandContribution, WorkspacePreferences, WorkspaceService } from '@tart/workspace';
import { OpenEditorsWidget } from './open-editors-widget';
export declare namespace FileNavigatorCommands {
    const REVEAL_IN_NAVIGATOR: Command;
    const TOGGLE_HIDDEN_FILES: Command;
    const TOGGLE_AUTO_REVEAL: Command;
    const REFRESH_NAVIGATOR: Command;
    const COLLAPSE_ALL: Command;
    const ADD_ROOT_FOLDER: Command;
    const FOCUS: Command;
    const COPY_RELATIVE_FILE_PATH: Command;
    const OPEN: Command;
}
/**
 * Navigator `More Actions...` toolbar item groups.
 * Used in order to group items present in the toolbar.
 */
export declare namespace NavigatorMoreToolbarGroups {
    const NEW_OPEN = "1_navigator_new_open";
    const TOOLS = "2_navigator_tools";
    const WORKSPACE = "3_navigator_workspace";
}
export declare const NAVIGATOR_CONTEXT_MENU: MenuPath;
/**
 * Navigator context menu default groups should be aligned
 * with VS Code default groups: https://code.visualstudio.com/api/references/contribution-points#contributes.menus
 */
export declare namespace NavigatorContextMenu {
    const NAVIGATION: string[];
    /** @deprecated use NAVIGATION */
    const OPEN: string[];
    /** @deprecated use NAVIGATION */
    const NEW: string[];
    const WORKSPACE: string[];
    const COMPARE: string[];
    /** @deprecated use COMPARE */
    const DIFF: string[];
    const SEARCH: string[];
    const CLIPBOARD: string[];
    const SERIAL: string[];
    const MODIFICATION: string[];
    /** @deprecated use MODIFICATION */
    const MOVE: string[];
    /** @deprecated use MODIFICATION */
    const ACTIONS: string[];
    const OPEN_WITH: string[];
}
export declare const FILE_NAVIGATOR_TOGGLE_COMMAND_ID = "fileNavigator:toggle";
export declare class FileNavigatorContribution extends AbstractViewContribution<FileNavigatorWidget> implements FrontendApplicationContribution, TabBarToolbarContribution, CommandContribution, MenuContribution {
    protected readonly fileNavigatorPreferences: FileNavigatorPreferences;
    protected readonly workspaceService: WorkspaceService;
    protected readonly workspacePreferences: WorkspacePreferences;
    protected readonly contextKeyService: NavigatorContextKeyService;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly tabbarToolbarRegistry: TabBarToolbarRegistry;
    protected readonly menuRegistry: MenuModelRegistry;
    protected readonly workspaceCommandContribution: WorkspaceCommandContribution;
    private readonly toDisposeAddRemoveFolderActions;
    constructor(fileNavigatorPreferences: FileNavigatorPreferences, workspaceService: WorkspaceService, workspacePreferences: WorkspacePreferences);
    onStart(app: FrontendApplication): Promise<void>;
    /**
     * Register commands to the `More Actions...` navigator toolbar item.
     */
    registerMoreToolbarItem: (item: Mutable<TabBarToolbarItem>) => void;
    /**
     * Reveals and selects node in the file navigator to which given widget is related.
     * Does nothing if given widget undefined or doesn't have related resource.
     *
     * @param widget widget file resource of which should be revealed and selected
     */
    selectWidgetFileNode(widget: Widget | undefined): Promise<void>;
    initializeLayout(app: FrontendApplication): Promise<void>;
    registerCommands(registry: CommandRegistry): void;
    registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void>;
    registerKeybindings(registry: KeybindingRegistry): void;
    registerMenus(registry: MenuModelRegistry): void;
    /**
     * force refresh workspace in navigator
     */
    refreshWorkspace(): Promise<void>;
    protected init(): Promise<void>;
    withWidget<T>(widget: Widget | undefined, cb: (navigator: FileNavigatorWidget | OpenEditorsWidget) => T): T | false;
    protected onCurrentWidgetChangedHandler(): void;
    private onDidCreateNewResource;
    private updateAddRemoveFolderActions;
}
