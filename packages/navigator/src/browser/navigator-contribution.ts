import {inject, injectable, postConstruct} from 'inversify';
import {
  AbstractViewContribution,
  codicon,
  CommonCommands,
  FrontendApplication,
  FrontendApplicationContribution,
  KeybindingRegistry,
  Navigatable,
  SelectableTreeNode,
  Widget
} from '@tart/core';
import {FILE_NAVIGATOR_ID, FileNavigatorWidget} from './navigator-widget';
import {EXPLORER_VIEW_CONTAINER_ID, EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS} from './navigator-widget-factory';
import {
  Command,
  CommandContribution,
  CommandRegistry,
  DisposableCollection,
  isOSX,
  isWindows,
  MenuContribution,
  MenuModelRegistry,
  MenuPath,
  Mutable
} from '@tart/core/lib/common';
import {
  TabBarToolbarContribution,
  TabBarToolbarItem,
  TabBarToolbarRegistry
} from '@tart/core/lib/browser/shell/tab-bar-toolbar';
import {FileNavigatorPreferences} from './navigator-preferences';
import {NavigatorContextKeyService} from './navigator-context-key-service';
import {
  DidCreateNewResourceEvent,
  WorkspaceCommandContribution,
  WorkspaceCommands,
  WorkspacePreferences,
  WorkspaceService
} from '@tart/workspace';
import {nls} from '@tart/core/lib/common/nls';
import {FileNavigatorModel} from './navigator-model';
import {DirNode, FileSystemCommands} from '@tart/filesystem';
import {NavigatorDiffCommands} from './navigator-diff';
import {OpenEditorsContextMenu, OpenEditorsWidget} from './open-editors-widget';
import {NavigatorKeybindingContexts} from './navigator-keybinding-context';
import {FileDownloadCommands} from '@tart/filesystem/lib/browser/download/file-download-command-contribution';

export namespace FileNavigatorCommands {
  export const REVEAL_IN_NAVIGATOR = Command.toLocalizedCommand({
    id: 'navigator.reveal',
    label: 'Reveal in Explorer'
  }, 'wm/navigator/reveal');
  export const TOGGLE_HIDDEN_FILES = Command.toLocalizedCommand({
    id: 'navigator.toggle.hidden.files',
    label: 'Toggle Hidden Files'
  }, 'wm/navigator/toggleHiddenFiles');
  export const TOGGLE_AUTO_REVEAL = Command.toLocalizedCommand({
    id: 'navigator.toggle.autoReveal',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Auto Reveal'
  }, 'wm/navigator/autoReveal', CommonCommands.FILE_CATEGORY_KEY);
  export const REFRESH_NAVIGATOR = Command.toLocalizedCommand({
    id: 'navigator.refresh',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Refresh in Explorer',
    iconClass: codicon('refresh')
  }, 'wm/navigator/refresh', CommonCommands.FILE_CATEGORY_KEY);
  export const COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
    id: 'navigator.collapse.all',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Collapse Folders in Explorer',
    iconClass: codicon('collapse-all')
  });
  export const ADD_ROOT_FOLDER: Command = {
    id: 'navigator.addRootFolder'
  };
  export const FOCUS = Command.toDefaultLocalizedCommand({
    id: 'workbench.files.action.focusFilesExplorer',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Focus on Files Explorer'
  });
  export const COPY_RELATIVE_FILE_PATH = Command.toDefaultLocalizedCommand({
    id: 'navigator.copyRelativeFilePath',
    label: 'Copy Relative Path'
  });
  export const OPEN = Command.toDefaultLocalizedCommand({
    id: 'navigator.open',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Open'
  });
}

/**
 * Navigator `More Actions...` toolbar item groups.
 * Used in order to group items present in the toolbar.
 */
export namespace NavigatorMoreToolbarGroups {
  export const NEW_OPEN = '1_navigator_new_open';
  export const TOOLS = '2_navigator_tools';
  export const WORKSPACE = '3_navigator_workspace';
}

export const NAVIGATOR_CONTEXT_MENU: MenuPath = ['navigator-context-menu'];

/**
 * Navigator context menu default groups should be aligned
 * with VS Code default groups: https://code.visualstudio.com/api/references/contribution-points#contributes.menus
 */
export namespace NavigatorContextMenu {
  export const NAVIGATION = [...NAVIGATOR_CONTEXT_MENU, 'navigation'];
  /** @deprecated use NAVIGATION */
  export const OPEN = NAVIGATION;
  /** @deprecated use NAVIGATION */
  export const NEW = NAVIGATION;

  export const WORKSPACE = [...NAVIGATOR_CONTEXT_MENU, '2_workspace'];

  export const COMPARE = [...NAVIGATOR_CONTEXT_MENU, '3_compare'];
  /** @deprecated use COMPARE */
  export const DIFF = COMPARE;

  export const SEARCH = [...NAVIGATOR_CONTEXT_MENU, '4_search'];
  export const CLIPBOARD = [...NAVIGATOR_CONTEXT_MENU, '5_cutcopypaste'];

  export const SERIAL = [...NAVIGATOR_CONTEXT_MENU, '6_webserial'];

  export const MODIFICATION = [...NAVIGATOR_CONTEXT_MENU, '7_modification'];
  /** @deprecated use MODIFICATION */
  export const MOVE = MODIFICATION;
  /** @deprecated use MODIFICATION */
  export const ACTIONS = MODIFICATION;

  export const OPEN_WITH = [...NAVIGATION, 'open_with'];
}

export const FILE_NAVIGATOR_TOGGLE_COMMAND_ID = 'fileNavigator:toggle';

@injectable()
export class FileNavigatorContribution extends AbstractViewContribution<FileNavigatorWidget> implements FrontendApplicationContribution, TabBarToolbarContribution, CommandContribution, MenuContribution {

  @inject(NavigatorContextKeyService)
  protected readonly contextKeyService: NavigatorContextKeyService;

  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  @inject(TabBarToolbarRegistry)
  protected readonly tabbarToolbarRegistry: TabBarToolbarRegistry;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(WorkspaceCommandContribution)
  protected readonly workspaceCommandContribution: WorkspaceCommandContribution;
  private readonly toDisposeAddRemoveFolderActions = new DisposableCollection();

  constructor(
      @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
      @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
      @inject(WorkspacePreferences) protected readonly workspacePreferences: WorkspacePreferences,
  ) {
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
  }

  async onStart(app: FrontendApplication): Promise<void> {
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
   * Register commands to the `More Actions...` navigator toolbar item.
   */
  public registerMoreToolbarItem = (item: Mutable<TabBarToolbarItem>) => {
    const commandId = item.command;
    const id = 'navigator.tabbar.toolbar.' + commandId;
    const command = this.commandRegistry.getCommand(commandId);
    this.commandRegistry.registerCommand({id, iconClass: command && command.iconClass}, {
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

  /**
   * Reveals and selects node in the file navigator to which given widget is related.
   * Does nothing if given widget undefined or doesn't have related resource.
   *
   * @param widget widget file resource of which should be revealed and selected
   */
  async selectWidgetFileNode(widget: Widget | undefined): Promise<void> {
    if (Navigatable.is(widget)) {
      const resourceUri = widget.getResourceUri();
      if (resourceUri) {
        const {model} = await this.widget;
        const node = await model.revealFile(resourceUri);
        if (SelectableTreeNode.is(node)) {
          model.selectNode(node);
        }
      }
    }
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    console.log('open view')
    await this.openView();
  }

  registerCommands(registry: CommandRegistry) {
    super.registerCommands(registry);
    registry.registerCommand(FileNavigatorCommands.FOCUS, {
      execute: () => this.openView({activate: true})
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

  async registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void> {
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

  registerKeybindings(registry: KeybindingRegistry): void {
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

  registerMenus(registry: MenuModelRegistry) {
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
  async refreshWorkspace(): Promise<void> {
    const {model} = await this.widget;
    await model.refresh();
  }

  @postConstruct()
  protected async init(): Promise<void> {
    await this.fileNavigatorPreferences.ready;
    this.shell.currentChanged.connect(() => this.onCurrentWidgetChangedHandler());

    const updateFocusContextKeys = () => {
      const hasFocus = this.shell.activeWidget instanceof FileNavigatorWidget;
      this.contextKeyService.explorerViewletFocus.set(hasFocus);
      this.contextKeyService.filesExplorerFocus.set(hasFocus);
    };
    updateFocusContextKeys();
    this.shell.activeChanged.connect(updateFocusContextKeys);
    this.workspaceCommandContribution.onDidCreateNewFile(async event => this.onDidCreateNewResource(event));
    this.workspaceCommandContribution.onDidCreateNewFolder(async event => this.onDidCreateNewResource(event));
  }

  withWidget<T>(widget: Widget | undefined = this.tryGetWidget(), cb: (navigator: FileNavigatorWidget | OpenEditorsWidget) => T): T | false {
    if ((widget instanceof FileNavigatorWidget && widget.id === FILE_NAVIGATOR_ID) || widget instanceof OpenEditorsWidget) {
      return cb(widget);
    }
    return false;
  }

  protected onCurrentWidgetChangedHandler(): void {
    if (this.fileNavigatorPreferences['explorer.autoReveal']) {
      this.selectWidgetFileNode(this.shell.currentWidget);
    }
  }

  private async onDidCreateNewResource(event: DidCreateNewResourceEvent): Promise<void> {
    const navigator = this.tryGetWidget();
    if (!navigator || !navigator.isVisible) {
      return;
    }
    const model: FileNavigatorModel = navigator.model;
    const parent = await model.revealFile(event.parent);
    if (DirNode.is(parent)) {
      await model.refresh(parent);
    }
    const node = await model.revealFile(event.uri);
    if (SelectableTreeNode.is(node)) {
      model.selectNode(node);
      if (DirNode.is(node)) {
        this.openView({activate: true});
      }
    }
  }

  private updateAddRemoveFolderActions(registry: MenuModelRegistry): void {
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
}
