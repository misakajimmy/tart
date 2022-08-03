// /********************************************************************************
//  * Copyright (C) 2017 TypeFox and others.
//  *
//  * This program and the accompanying materials are made available under the
//  * terms of the Eclipse Public License v. 2.0 which is available at
//  * http://www.eclipse.org/legal/epl-2.0.
//  *
//  * This Source Code may also be made available under the following Secondary
//  * Licenses when the conditions for such availability set forth in the Eclipse
//  * Public License v. 2.0 are satisfied: GNU General Public License, version 2
//  * with the GNU Classpath Exception which is available at
//  * https://www.gnu.org/software/classpath/license.html.
//  *
//  * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
//  ********************************************************************************/

/* eslint-disable max-len, @typescript-eslint/indent */

import zhcn from '../assets/i18n/vscode-language-pack-zh-hans/translations/main.i18n.json';
import {debounce} from 'lodash';
import {inject, injectable, optional} from 'inversify';
import {FrontendApplicationContribution} from './frontend-application';
import {
  Command,
  CommandContribution,
  CommandRegistry,
  isWindows,
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
  MessageService,
  SelectionService,
  SETTINGS_MENU,
  UriAwareCommandHandler
} from '../common';
import * as browser from './browser';
import {StorageService} from './storage-service';
import {open, OpenerService} from '../browser/opener-service';
import {KeybindingContribution, KeybindingRegistry} from './keybinding';
import {ColorContribution} from './color-application-contribution';
import {Color, ColorRegistry} from './color-registry';
import {ThemeService} from './theming';
import {QuickInputService, QuickPick, QuickPickItem} from '../common/quick-pick-service';
import {nls} from '../common/nls';
import {QuickViewService} from './quick-input';
import {ApplicationShell} from './shell';
import {FormatType} from './saveable';
import {ClipboardService} from './clipboard-service';
import {TabBar, Widget} from '@lumino/widgets';
import {PreferenceService} from './preferences';
import {CorePreferences} from './core-preferences';
import {IconThemeService} from './icon-theme-service';
import {LocalizationContribution, LocalizationRegistry} from '../common/i18n/localization-contribution';
import {LocalizationProvider} from '../common/i18n/localization-provider';

export namespace CommonMenus {

  export const FILE = [...MAIN_MENU_BAR, '1_file'];
  export const FILE_NEW = [...FILE, '1_new'];
  export const FILE_OPEN = [...FILE, '2_open'];
  export const FILE_SAVE = [...FILE, '3_save'];
  export const FILE_AUTOSAVE = [...FILE, '4_autosave'];
  export const FILE_SETTINGS = [...FILE, '5_settings'];
  export const FILE_SETTINGS_SUBMENU = [...FILE_SETTINGS, '1_settings_submenu'];
  export const FILE_SETTINGS_SUBMENU_OPEN = [...FILE_SETTINGS_SUBMENU, '1_settings_submenu_open'];
  export const FILE_SETTINGS_SUBMENU_THEME = [...FILE_SETTINGS_SUBMENU, '2_settings_submenu_theme'];
  export const FILE_CLOSE = [...FILE, '6_close'];

  export const EDIT = [...MAIN_MENU_BAR, '2_edit'];
  export const EDIT_UNDO = [...EDIT, '1_undo'];
  export const EDIT_CLIPBOARD = [...EDIT, '2_clipboard'];
  export const EDIT_FIND = [...EDIT, '3_find'];

  export const VIEW = [...MAIN_MENU_BAR, '4_view'];
  export const VIEW_PRIMARY = [...VIEW, '0_primary'];
  export const VIEW_VIEWS = [...VIEW, '1_views'];
  export const VIEW_LAYOUT = [...VIEW, '2_layout'];
  export const VIEW_TOGGLE = [...VIEW, '3_toggle'];

  export const SETTINGS_OPEN = [...SETTINGS_MENU, '1_settings_open'];
  export const SETTINGS__THEME = [...SETTINGS_MENU, '2_settings_theme'];

  // last menu item
  export const HELP = [...MAIN_MENU_BAR, '9_help'];

}

export namespace CommonCommands {

  export const FILE_CATEGORY = 'File';
  export const VIEW_CATEGORY = 'View';
  export const PREFERENCES_CATEGORY = 'Preferences';
  export const FILE_CATEGORY_KEY = nls.getDefaultKey(FILE_CATEGORY);
  export const VIEW_CATEGORY_KEY = nls.getDefaultKey(VIEW_CATEGORY);
  export const PREFERENCES_CATEGORY_KEY = nls.getDefaultKey(PREFERENCES_CATEGORY);

  export const OPEN: Command = {
    id: 'core.open',
  };

  export const CUT = Command.toDefaultLocalizedCommand({
    id: 'core.cut',
    label: 'Cut'
  });
  export const COPY = Command.toDefaultLocalizedCommand({
    id: 'core.copy',
    label: 'Copy'
  });
  export const PASTE = Command.toDefaultLocalizedCommand({
    id: 'core.paste',
    label: 'Paste'
  });

  export const COPY_PATH = Command.toDefaultLocalizedCommand({
    id: 'core.copy.path',
    label: 'Copy Path'
  });

  export const UNDO = Command.toDefaultLocalizedCommand({
    id: 'core.undo',
    label: 'Undo'
  });
  export const REDO = Command.toDefaultLocalizedCommand({
    id: 'core.redo',
    label: 'Redo'
  });
  export const SELECT_ALL = Command.toDefaultLocalizedCommand({
    id: 'core.selectAll',
    label: 'Select All'
  });

  export const FIND = Command.toDefaultLocalizedCommand({
    id: 'core.find',
    label: 'Find'
  });
  export const REPLACE = Command.toDefaultLocalizedCommand({
    id: 'core.replace',
    label: 'Replace'
  });

  export const NEXT_TAB = Command.toDefaultLocalizedCommand({
    id: 'core.nextTab',
    category: VIEW_CATEGORY,
    label: 'Show Next Tab'
  });
  export const PREVIOUS_TAB = Command.toDefaultLocalizedCommand({
    id: 'core.previousTab',
    category: VIEW_CATEGORY,
    label: 'Show Previous Tab'
  });
  export const NEXT_TAB_IN_GROUP = Command.toLocalizedCommand({
    id: 'core.nextTabInGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Next Tab in Group'
  }, 'wm/core/common/showNextTabInGroup', VIEW_CATEGORY_KEY);
  export const PREVIOUS_TAB_IN_GROUP = Command.toLocalizedCommand({
    id: 'core.previousTabInGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Previous Tab in Group'
  }, 'wm/core/common/showPreviousTabInGroup', VIEW_CATEGORY_KEY);
  export const NEXT_TAB_GROUP = Command.toLocalizedCommand({
    id: 'core.nextTabGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Next Tab Group'
  }, 'wm/core/common/showNextTabGroup', VIEW_CATEGORY_KEY);
  export const PREVIOUS_TAB_GROUP = Command.toLocalizedCommand({
    id: 'core.previousTabBar',
    category: VIEW_CATEGORY,
    label: 'Switch to Previous Tab Group'
  }, 'wm/core/common/showPreviousTabGroup', VIEW_CATEGORY_KEY);
  export const CLOSE_TAB = Command.toLocalizedCommand({
    id: 'core.close.tab',
    category: VIEW_CATEGORY,
    label: 'Close Tab'
  }, 'wm/core/common/closeTab', VIEW_CATEGORY_KEY);
  export const CLOSE_OTHER_TABS = Command.toLocalizedCommand({
    id: 'core.close.other.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Other Tabs'
  }, 'wm/core/common/closeOthers', VIEW_CATEGORY_KEY);
  export const CLOSE_RIGHT_TABS = Command.toLocalizedCommand({
    id: 'core.close.right.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Tabs to the Right'
  }, 'wm/core/common/closeRight', VIEW_CATEGORY_KEY);
  export const CLOSE_ALL_TABS = Command.toLocalizedCommand({
    id: 'core.close.all.tabs',
    category: VIEW_CATEGORY,
    label: 'Close All Tabs'
  }, 'wm/core/common/closeAll', VIEW_CATEGORY_KEY);
  export const CLOSE_MAIN_TAB = Command.toLocalizedCommand({
    id: 'core.close.main.tab',
    category: VIEW_CATEGORY,
    label: 'Close Tab in Main Area'
  }, 'wm/core/common/closeTabMain', VIEW_CATEGORY_KEY);
  export const CLOSE_OTHER_MAIN_TABS = Command.toLocalizedCommand({
    id: 'core.close.other.main.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Other Tabs in Main Area'
  }, 'wm/core/common/closeOtherTabMain', VIEW_CATEGORY_KEY);
  export const CLOSE_ALL_MAIN_TABS = Command.toLocalizedCommand({
    id: 'core.close.all.main.tabs',
    category: VIEW_CATEGORY,
    label: 'Close All Tabs in Main Area'
  }, 'wm/core/common/closeAllTabMain', VIEW_CATEGORY_KEY);
  export const COLLAPSE_PANEL = Command.toLocalizedCommand({
    id: 'core.collapse.tab',
    category: VIEW_CATEGORY,
    label: 'Collapse Side Panel'
  }, 'wm/core/common/collapseTab', VIEW_CATEGORY_KEY);
  export const COLLAPSE_ALL_PANELS = Command.toLocalizedCommand({
    id: 'core.collapse.all.tabs',
    category: VIEW_CATEGORY,
    label: 'Collapse All Side Panels'
  }, 'wm/core/common/collapseAllTabs', VIEW_CATEGORY_KEY);
  export const TOGGLE_BOTTOM_PANEL = Command.toLocalizedCommand({
    id: 'core.toggle.bottom.panel',
    category: VIEW_CATEGORY,
    label: 'Toggle Bottom Panel'
  }, 'wm/core/common/collapseBottomPanel', VIEW_CATEGORY_KEY);
  export const TOGGLE_STATUS_BAR = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.toggleStatusbarVisibility',
    category: VIEW_CATEGORY,
    label: 'Toggle Status Bar Visibility'
  });
  export const TOGGLE_MAXIMIZED = Command.toLocalizedCommand({
    id: 'core.toggleMaximized',
    category: VIEW_CATEGORY,
    label: 'Toggle Maximized'
  }, 'wm/core/common/toggleMaximized', VIEW_CATEGORY_KEY);
  export const OPEN_VIEW = Command.toDefaultLocalizedCommand({
    id: 'core.openView',
    category: VIEW_CATEGORY,
    label: 'Open View...'
  });

  export const SAVE = Command.toDefaultLocalizedCommand({
    id: 'core.save',
    category: FILE_CATEGORY,
    label: 'Save',
  });
  export const SAVE_WITHOUT_FORMATTING = Command.toDefaultLocalizedCommand({
    id: 'core.saveWithoutFormatting',
    category: FILE_CATEGORY,
    label: 'Save without Formatting',
  });
  export const SAVE_ALL = Command.toDefaultLocalizedCommand({
    id: 'core.saveAll',
    category: FILE_CATEGORY,
    label: 'Save All',
  });

  export const AUTO_SAVE = Command.toDefaultLocalizedCommand({
    id: 'textEditor.commands.autosave',
    category: FILE_CATEGORY,
    label: 'Auto Save',
  });

  export const ABOUT_COMMAND = Command.toDefaultLocalizedCommand({
    id: 'core.about',
    label: 'About'
  });

  export const OPEN_PREFERENCES = Command.toDefaultLocalizedCommand({
    id: 'preferences:open',
    category: PREFERENCES_CATEGORY,
    label: 'Open Settings (UI)',
  });

  export const SELECT_COLOR_THEME = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.selectTheme',
    label: 'Color Theme',
    category: PREFERENCES_CATEGORY
  });
  export const SELECT_ICON_THEME = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.selectIconTheme',
    label: 'File Icon Theme',
    category: PREFERENCES_CATEGORY
  });

  export const CONFIGURE_DISPLAY_LANGUAGE = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.configureLanguage',
    label: 'Configure Display Language'
  });

}

export const supportCut = browser.isNative || document.queryCommandSupported('cut');
export const supportCopy = browser.isNative || document.queryCommandSupported('copy');
// Chrome incorrectly returns true for document.queryCommandSupported('paste')
// when the paste feature is available but the calling script has insufficient
// privileges to actually perform the action
export const supportPaste = browser.isNative || (!browser.isChrome && document.queryCommandSupported('paste'));

export const RECENT_COMMANDS_STORAGE_KEY = 'commands';

@injectable()
export class CommonFrontendContribution implements FrontendApplicationContribution, MenuContribution, CommandContribution, KeybindingContribution, ColorContribution, LocalizationContribution {

  @inject(QuickInputService) @optional()
  protected readonly quickInputService: QuickInputService;

  @inject(CorePreferences)
  protected readonly preferences: CorePreferences;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(ThemeService)
  protected readonly themeService: ThemeService;
  @inject(StorageService)
  protected readonly storageService: StorageService;
  @inject(ClipboardService)
  protected readonly clipboardService: ClipboardService;
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;
  @inject(IconThemeService)
  protected readonly iconThemes: IconThemeService;

  @inject(LocalizationProvider)
  protected readonly localizationProvider: LocalizationProvider;

  constructor(
      @inject(ApplicationShell) protected readonly shell: ApplicationShell,
      @inject(SelectionService) protected readonly selectionService: SelectionService,
      @inject(MessageService) protected readonly messageService: MessageService,
      @inject(OpenerService) protected readonly openerService: OpenerService,
      // @inject(AsyncLocalizationProvider) protected readonly localizationProvider: AsyncLocalizationProvider
  ) {
  }

  onStart(): void {
    this.storageService.getData<{ recent: Command[] }>(RECENT_COMMANDS_STORAGE_KEY, {recent: []})
        .then(tasks => this.commandRegistry.recent = tasks.recent);
  }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(CommonCommands.OPEN, UriAwareCommandHandler.MultiSelect(this.selectionService, {
      execute: uris => uris.map(uri => open(this.openerService, uri)),
    }));
    commandRegistry.registerCommand(CommonCommands.CUT, {
      execute: () => {
        if (supportCut) {
          document.execCommand('cut');
        } else {
          this.messageService.warn("Please use the browser's cut command or shortcut.");
        }
      }
    });
    commandRegistry.registerCommand(CommonCommands.COPY, {
      execute: () => {
        if (supportCopy) {
          document.execCommand('copy');
        } else {
          this.messageService.warn("Please use the browser's copy command or shortcut.");
        }
      }
    });
    commandRegistry.registerCommand(CommonCommands.PASTE, {
      execute: () => {
        if (supportPaste) {
          document.execCommand('paste');
        } else {
          this.messageService.warn("Please use the browser's paste command or shortcut.");
        }
      }
    });
    commandRegistry.registerCommand(CommonCommands.COPY_PATH, UriAwareCommandHandler.MultiSelect(this.selectionService, {
      execute: async uris => {
        if (uris.length) {
          const lineDelimiter = isWindows ? '\r\n' : '\n';
          const text = uris.map(resource => resource.path).join(lineDelimiter);
          await this.clipboardService.writeText(text);
        } else {
          await this.messageService.info('Open a file first to copy its path');
        }
      }
    }));

    commandRegistry.registerCommand(CommonCommands.UNDO, {
      execute: () => document.execCommand('undo')
    });
    commandRegistry.registerCommand(CommonCommands.REDO, {
      execute: () => document.execCommand('redo')
    });
    commandRegistry.registerCommand(CommonCommands.SELECT_ALL, {
      execute: () => document.execCommand('selectAll')
    });

    // commandRegistry.registerCommand(CommonCommands.FIND, {
    //     execute: () => { /* no-op */
    //     }
    // });
    // commandRegistry.registerCommand(CommonCommands.REPLACE, {
    //     execute: () => { /* no-op */
    //     }
    // });

    commandRegistry.registerCommand(CommonCommands.NEXT_TAB, {
      isEnabled: () => this.shell.currentTabBar !== undefined,
      execute: () => this.shell.activateNextTab()
    });
    commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB, {
      isEnabled: () => this.shell.currentTabBar !== undefined,
      execute: () => this.shell.activatePreviousTab()
    });
    commandRegistry.registerCommand(CommonCommands.NEXT_TAB_IN_GROUP, {
      isEnabled: () => this.shell.nextTabIndexInTabBar() !== -1,
      execute: () => this.shell.activateNextTabInTabBar()
    });
    commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB_IN_GROUP, {
      isEnabled: () => this.shell.previousTabIndexInTabBar() !== -1,
      execute: () => this.shell.activatePreviousTabInTabBar()
    });
    commandRegistry.registerCommand(CommonCommands.NEXT_TAB_GROUP, {
      isEnabled: () => this.shell.nextTabBar() !== undefined,
      execute: () => this.shell.activateNextTabBar()
    });
    commandRegistry.registerCommand(CommonCommands.PREVIOUS_TAB_GROUP, {
      isEnabled: () => this.shell.previousTabBar() !== undefined,
      execute: () => this.shell.activatePreviousTabBar()
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_TAB, {
      isEnabled: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event);
        if (!tabBar) {
          return false;
        }
        const currentTitle = this.shell.findTitle(tabBar, event);
        return currentTitle !== undefined && currentTitle.closable;
      },
      execute: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event)!;
        const currentTitle = this.shell.findTitle(tabBar, event);
        this.shell.closeTabs(tabBar, title => title === currentTitle);
      }
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_OTHER_TABS, {
      isEnabled: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event);
        if (!tabBar) {
          return false;
        }
        const currentTitle = this.shell.findTitle(tabBar, event);
        return tabBar.titles.some(title => title !== currentTitle && title.closable);
      },
      execute: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event)!;
        const currentTitle = this.shell.findTitle(tabBar, event);
        this.shell.closeTabs(tabBar, title => title !== currentTitle && title.closable);
      }
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_RIGHT_TABS, {
      isEnabled: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event);
        if (!tabBar) {
          return false;
        }
        const currentIndex = this.findTitleIndex(tabBar, event);
        return tabBar.titles.some((title, index) => index > currentIndex && title.closable);
      },
      isVisible: (event?: Event) => {
        const area = this.findTabArea(event);
        return area !== undefined && area !== 'left' && area !== 'right';
      },
      execute: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event)!;
        const currentIndex = this.findTitleIndex(tabBar, event);
        this.shell.closeTabs(tabBar, (title, index) => index > currentIndex && title.closable);
      }
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_ALL_TABS, {
      isEnabled: (event?: Event) => {
        const tabBar = this.shell.findTabBar(event);
        return tabBar !== undefined && tabBar.titles.some(title => title.closable);
      },
      execute: (event?: Event) => this.shell.closeTabs(this.shell.findTabBar(event)!, title => title.closable)
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_MAIN_TAB, {
      isEnabled: () => {
        const currentWidget = this.shell.getCurrentWidget('main');
        return currentWidget !== undefined && currentWidget.title.closable;
      },
      execute: () => this.shell.getCurrentWidget('main')!.close()
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_OTHER_MAIN_TABS, {
      isEnabled: () => {
        const currentWidget = this.shell.getCurrentWidget('main');
        return currentWidget !== undefined &&
            this.shell.mainAreaTabBars.some(tb => tb.titles.some(title => title.owner !== currentWidget && title.closable));
      },
      execute: () => {
        const currentWidget = this.shell.getCurrentWidget('main');
        this.shell.closeTabs('main', title => title.owner !== currentWidget && title.closable);
      }
    });
    commandRegistry.registerCommand(CommonCommands.CLOSE_ALL_MAIN_TABS, {
      isEnabled: () => this.shell.mainAreaTabBars.some(tb => tb.titles.some(title => title.closable)),
      execute: () => this.shell.closeTabs('main', title => title.closable)
    });
    commandRegistry.registerCommand(CommonCommands.COLLAPSE_PANEL, {
      isEnabled: (event?: Event) => ApplicationShell.isSideArea(this.findTabArea(event)),
      isVisible: (event?: Event) => ApplicationShell.isSideArea(this.findTabArea(event)),
      execute: (event?: Event) => this.shell.collapsePanel(this.findTabArea(event)!)
    });
    commandRegistry.registerCommand(CommonCommands.COLLAPSE_ALL_PANELS, {
      execute: () => {
        this.shell.collapsePanel('left');
        this.shell.collapsePanel('right');
        this.shell.collapsePanel('bottom');
      }
    });
    commandRegistry.registerCommand(CommonCommands.TOGGLE_BOTTOM_PANEL, {
      isEnabled: () => this.shell.getWidgets('bottom').length > 0,
      execute: () => {
        if (this.shell.isExpanded('bottom')) {
          this.shell.collapsePanel('bottom');
        } else {
          this.shell.expandPanel('bottom');
        }
      }
    });
    commandRegistry.registerCommand(CommonCommands.TOGGLE_STATUS_BAR, {
      execute: () => this.preferenceService.updateValue('workbench.statusBar.visible', !this.preferences['workbench.statusBar.visible'])
    });
    commandRegistry.registerCommand(CommonCommands.TOGGLE_MAXIMIZED, {
      isEnabled: (event?: Event) => this.canToggleMaximized(event),
      isVisible: (event?: Event) => this.canToggleMaximized(event),
      execute: (event?: Event) => this.toggleMaximized(event)
    });

    commandRegistry.registerCommand(CommonCommands.SAVE, {
      execute: () => this.shell.save({formatType: FormatType.ON})
    });
    commandRegistry.registerCommand(CommonCommands.SAVE_WITHOUT_FORMATTING, {
      execute: () => this.shell.save({formatType: FormatType.OFF})
    });
    commandRegistry.registerCommand(CommonCommands.SAVE_ALL, {
      execute: () => this.shell.saveAll({formatType: FormatType.DIRTY})
    });

    commandRegistry.registerCommand(CommonCommands.OPEN_VIEW, {
      execute: () => this.quickInputService?.open(QuickViewService.PREFIX)
    });

    commandRegistry.registerCommand(CommonCommands.SELECT_COLOR_THEME, {
      execute: () => this.selectColorTheme()
    });
    commandRegistry.registerCommand(CommonCommands.SELECT_ICON_THEME, {
      execute: () => this.selectIconTheme()
    });

    commandRegistry.registerCommand(CommonCommands.CONFIGURE_DISPLAY_LANGUAGE, {
      execute: () => this.configureDisplayLanguage()
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    if (supportCut) {
      registry.registerKeybinding({
        command: CommonCommands.CUT.id,
        keybinding: 'ctrlcmd+x'
      });
    }
    if (supportCopy) {
      registry.registerKeybinding({
        command: CommonCommands.COPY.id,
        keybinding: 'ctrlcmd+c'
      });
    }
    if (supportPaste) {
      registry.registerKeybinding({
        command: CommonCommands.PASTE.id,
        keybinding: 'ctrlcmd+v'
      });
    }
    registry.registerKeybinding({
      command: CommonCommands.COPY_PATH.id,
      keybinding: isWindows ? 'shift+alt+c' : 'ctrlcmd+alt+c',
      when: '!editorFocus'
    });
    registry.registerKeybindings(
        // Edition
        {
          command: CommonCommands.UNDO.id,
          keybinding: 'ctrlcmd+z'
        },
        {
          command: CommonCommands.REDO.id,
          keybinding: 'ctrlcmd+shift+z'
        },
        {
          command: CommonCommands.SELECT_ALL.id,
          keybinding: 'ctrlcmd+a'
        },
        {
          command: CommonCommands.FIND.id,
          keybinding: 'ctrlcmd+f'
        },
        {
          command: CommonCommands.REPLACE.id,
          keybinding: 'ctrlcmd+alt+f'
        },
        // Tabs
        {
          command: CommonCommands.NEXT_TAB.id,
          keybinding: 'ctrlcmd+tab'
        },
        {
          command: CommonCommands.NEXT_TAB.id,
          keybinding: 'ctrlcmd+alt+d'
        },
        {
          command: CommonCommands.PREVIOUS_TAB.id,
          keybinding: 'ctrlcmd+shift+tab'
        },
        {
          command: CommonCommands.PREVIOUS_TAB.id,
          keybinding: 'ctrlcmd+alt+a'
        },
        {
          command: CommonCommands.CLOSE_OTHER_MAIN_TABS.id,
          keybinding: 'ctrlcmd+alt+t'
        },
        // Panels
        {
          command: CommonCommands.COLLAPSE_PANEL.id,
          keybinding: 'alt+c'
        },
        {
          command: CommonCommands.TOGGLE_BOTTOM_PANEL.id,
          keybinding: 'ctrlcmd+j',
        },
        {
          command: CommonCommands.COLLAPSE_ALL_PANELS.id,
          keybinding: 'alt+shift+c',
        },
        {
          command: CommonCommands.TOGGLE_MAXIMIZED.id,
          keybinding: 'alt+m',
        },
        // Saving
        {
          command: CommonCommands.SAVE.id,
          keybinding: 'ctrlcmd+s'
        },
        {
          command: CommonCommands.SAVE_WITHOUT_FORMATTING.id,
          keybinding: 'ctrlcmd+k s'
        },
        {
          command: CommonCommands.SAVE_ALL.id,
          keybinding: 'ctrlcmd+alt+s'
        },
        // Theming
        {
          command: CommonCommands.SELECT_COLOR_THEME.id,
          keybinding: 'ctrlcmd+k ctrlcmd+t'
        }
    );
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(CommonMenus.FILE, nls.localizeByDefault('File'));
    registry.registerSubmenu(CommonMenus.EDIT, nls.localizeByDefault('Edit'));
    registry.registerSubmenu(CommonMenus.VIEW, nls.localizeByDefault('View'));
    // registry.registerSubmenu(CommonMenus.HELP, nls.localizeByDefault('Help'));

    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE.id
    });
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE_ALL.id
    });

    registry.registerMenuAction(CommonMenus.FILE_AUTOSAVE, {
      commandId: CommonCommands.AUTO_SAVE.id
    });

    registry.registerSubmenu(CommonMenus.FILE_SETTINGS_SUBMENU, nls.localizeByDefault(CommonCommands.PREFERENCES_CATEGORY));

    registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
      commandId: CommonCommands.UNDO.id,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
      commandId: CommonCommands.REDO.id,
      order: '1'
    });

    registry.registerMenuAction(CommonMenus.EDIT_FIND, {
      commandId: CommonCommands.FIND.id,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.EDIT_FIND, {
      commandId: CommonCommands.REPLACE.id,
      order: '1'
    });

    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.CUT.id,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.COPY.id,
      order: '1'
    });
    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.PASTE.id,
      order: '2'
    });
    registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
      commandId: CommonCommands.COPY_PATH.id,
      order: '3'
    });

    registry.registerMenuAction(CommonMenus.VIEW_LAYOUT, {
      commandId: CommonCommands.TOGGLE_BOTTOM_PANEL.id,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.VIEW_LAYOUT, {
      commandId: CommonCommands.TOGGLE_STATUS_BAR.id,
      order: '1',
      label: 'Toggle Status Bar'
    });
    registry.registerMenuAction(CommonMenus.VIEW_LAYOUT, {
      commandId: CommonCommands.COLLAPSE_ALL_PANELS.id,
      order: '2'
    });

    registry.registerMenuAction(CommonMenus.HELP, {
      commandId: CommonCommands.ABOUT_COMMAND.id,
      label: CommonCommands.ABOUT_COMMAND.label,
      order: '9'
    });

    registry.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
      commandId: CommonCommands.OPEN_VIEW.id
    });

    registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
      commandId: CommonCommands.SELECT_COLOR_THEME.id
    });
    registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
      commandId: CommonCommands.SELECT_ICON_THEME.id
    });

    registry.registerMenuAction(CommonMenus.SETTINGS__THEME, {
      commandId: CommonCommands.SELECT_COLOR_THEME.id
    });
    registry.registerMenuAction(CommonMenus.SETTINGS__THEME, {
      commandId: CommonCommands.SELECT_ICON_THEME.id
    });

  }

  registerColors(colors: ColorRegistry): void {
    colors.register(
        // Base Colors should be aligned with https://code.visualstudio.com/api/references/theme-color#base-colors
        // if not yet contributed by Monaco, check runtime css variables to learn
        {
          id: 'selection.background',
          defaults: {dark: '#217daf', light: '#c0dbf1'},
          description: 'Overall border color for focused elements. This color is only used if not overridden by a component.'
        },
        {
          id: 'icon.foreground',
          defaults: {dark: '#C5C5C5', light: '#424242', hc: '#FFFFFF'},
          description: 'The default color for icons in the workbench.'
        },

        // Window border colors should be aligned with https://code.visualstudio.com/api/references/theme-color#window-border
        {
          id: 'window.activeBorder', defaults: {
            hc: 'contrastBorder'
          }, description: 'The color used for the border of the window when it is active.'
        },
        {
          id: 'window.inactiveBorder', defaults: {
            hc: 'contrastBorder'
          },
          description: 'The color used for the border of the window when it is inactive.'
        },

        // Buttons should be aligned with https://code.visualstudio.com/api/references/theme-color#button-control
        // if not yet contributed by Monaco, check runtime css variables to learn
        {
          id: 'button.foreground',
          defaults: {dark: Color.white, light: Color.white, hc: Color.white},
          description: 'Button foreground color.'
        },
        {
          id: 'button.background',
          defaults: {dark: '#0E639C', light: '#007ACC'},
          description: 'Button background color.'
        },
        {
          id: 'button.hoverBackground',
          defaults: {
            dark: Color.lighten('button.background', 0.2),
            light: Color.darken('button.background', 0.2)
          },
          description: 'Button background color when hovering.'
        },

        // Activity Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#activity-bar
        {
          id: 'activityBar.background',
          defaults: {
            dark: '#333333',
            light: '#2C2C2C',
            hc: '#000000'
          },
          description: 'Activity bar background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.foreground',
          defaults: {
            dark: Color.white,
            light: Color.white,
            hc: Color.white
          },
          description: 'Activity bar item foreground color when it is active. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
        },
        {
          id: 'activityBar.inactiveForeground',
          defaults: {
            dark: Color.transparent('activityBar.foreground', 0.4),
            light: Color.transparent('activityBar.foreground', 0.4),
            hc: Color.white
          },
          description: 'Activity bar item foreground color when it is inactive. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.border',
          defaults: {
            hc: 'contrastBorder'
          },
          description: 'Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.activeBorder',
          defaults: {
            dark: 'activityBar.foreground',
            light: 'activityBar.foreground',
          },
          description: 'Activity bar border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.activeFocusBorder',
          description: 'Activity bar focus border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.activeBackground',
          description: 'Activity bar background color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBar.dropBackground',
          defaults: {
            dark: Color.transparent('#ffffff', 0.12),
            light: Color.transparent('#ffffff', 0.12),
            hc: Color.transparent('#ffffff', 0.12),
          },
          description: 'Drag and drop feedback color for the activity bar items. The color should have transparency so that the activity bar entries can still shine through. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBarBadge.background',
          defaults: {
            dark: '#007ACC',
            light: '#007ACC',
            hc: '#000000'
          },
          description: 'Activity notification badge background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },
        {
          id: 'activityBarBadge.foreground',
          defaults: {
            dark: Color.white,
            light: Color.white,
            hc: Color.white
          },
          description: 'Activity notification badge foreground color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.'
        },

        // Side Bar should be aligned with https://code.visualstudio.com/api/references/theme-color#side-bar
        // if not yet contributed by Monaco, check runtime css variables to learn
        {
          id: 'sideBar.background',
          defaults: {dark: '#252526', light: '#F3F3F3', hc: '#000000'},
          description: 'Side bar background color. The side bar is the container for views like explorer and search.'
        },
        {
          id: 'sideBar.foreground',
          description: 'Side bar foreground color. The side bar is the container for views like explorer and search.'
        },
        {
          id: 'sideBarSectionHeader.background',
          defaults: {dark: '#80808033', light: '#80808033'},
          description: 'Side bar section header background color. The side bar is the container for views like explorer and search.'
        },
        {
          id: 'sideBarSectionHeader.foreground',
          description: 'Side bar foreground color. The side bar is the container for views like explorer and search.'
        },
        {
          id: 'sideBarSectionHeader.border',
          defaults: {hc: '#6FC3DF'},
          description: 'Side bar section header border color. The side bar is the container for views like explorer and search.'
        },

        // Lists and Trees colors should be aligned with https://code.visualstudio.com/api/references/theme-color#lists-and-trees
        // if not yet contributed by Monaco, check runtime css variables to learn.
        // TODO: Following are not yet supported/no respective elements in wm:
        // list.focusBackground, list.focusForeground, list.inactiveFocusBackground, list.filterMatchBorder,
        // list.dropBackground, listFilterWidget.outline, listFilterWidget.noMatchesOutline
        // list.invalidItemForeground,
        // list.warningForeground, list.errorForeground => tree node needs an respective class
        {
          id: 'list.activeSelectionBackground',
          defaults: {dark: '#094771', light: '#0074E8'},
          description: 'List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.'
        },
        {
          id: 'list.activeSelectionForeground',
          defaults: {dark: '#FFF', light: '#FFF'},
          description: 'List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.'
        },
        {
          id: 'list.inactiveSelectionBackground',
          defaults: {dark: '#37373D', light: '#E4E6F1'},
          description: 'List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.'
        },
        {
          id: 'list.inactiveSelectionForeground',
          description: 'List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.'
        },
        {
          id: 'list.hoverBackground',
          defaults: {dark: '#2A2D2E', light: '#F0F0F0'},
          description: 'List/Tree background when hovering over items using the mouse.'
        },
        {id: 'list.hoverForeground', description: 'List/Tree foreground when hovering over items using the mouse.'},
        {
          id: 'list.filterMatchBackground',
          defaults: {dark: 'editor.findMatchHighlightBackground', light: 'editor.findMatchHighlightBackground'},
          description: 'Background color of the filtered match.'
        },
        {
          id: 'list.highlightForeground',
          defaults: {dark: '#18A3FF', light: '#0066BF', hc: 'focusBorder'},
          description: 'List/Tree foreground color of the match highlights when searching inside the list/tree.'
        },
        {
          id: 'list.focusHighlightForeground',
          defaults: {
            dark: 'list.highlightForeground',
            light: 'list.activeSelectionForeground',
            hc: 'list.highlightForeground'
          },
          description: 'List/Tree foreground color of the match highlights on actively focused items when searching inside the list/tree.'
        },
        {
          id: 'tree.inactiveIndentGuidesStroke',
          defaults: {
            dark: Color.transparent('tree.indentGuidesStroke', 0.4),
            light: Color.transparent('tree.indentGuidesStroke', 0.4),
            hc: Color.transparent('tree.indentGuidesStroke', 0.4)
          },
          description: 'Tree stroke color for the inactive indentation guides.'
        },

        // Editor Group & Tabs colors should be aligned with https://code.visualstudio.com/api/references/theme-color#editor-groups-tabs
        {
          id: 'editorGroup.border',
          defaults: {
            dark: '#444444',
            light: '#E7E7E7',
            hc: 'contrastBorder'
          },
          description: 'Color to separate multiple editor groups from each other. Editor groups are the containers of editors.'
        },
        {
          id: 'editorGroup.dropBackground',
          defaults: {
            dark: Color.transparent('#53595D', 0.5),
            light: Color.transparent('#2677CB', 0.18)
          },
          description: 'Background color when dragging editors around. The color should have transparency so that the editor contents can still shine through.'
        },
        {
          id: 'editorGroupHeader.tabsBackground',
          defaults: {
            dark: '#252526',
            light: '#F3F3F3'
          },
          description: 'Background color of the editor group title header when tabs are enabled. Editor groups are the containers of editors.'
        },
        {
          id: 'editorGroupHeader.tabsBorder',
          defaults: {
            hc: 'contrastBorder'
          },
          description: 'Border color of the editor group title header when tabs are enabled. Editor groups are the containers of editors.'
        },
        {
          id: 'tab.activeBackground',
          defaults: {
            dark: 'editor.background',
            light: 'editor.background',
            hc: 'editor.background'
          },
          description: 'Active tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedActiveBackground',
          defaults: {
            dark: 'tab.activeBackground',
            light: 'tab.activeBackground',
            hc: 'tab.activeBackground'
          },
          description: 'Active tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.inactiveBackground',
          defaults: {
            dark: '#2D2D2D',
            light: '#ECECEC'
          },
          description: 'Inactive tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.activeForeground',
          defaults: {
            dark: Color.white,
            light: '#333333',
            hc: Color.white
          },
          description: 'Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.inactiveForeground',
          defaults: {
            dark: Color.transparent('tab.activeForeground', 0.5),
            light: Color.transparent('tab.activeForeground', 0.7),
            hc: Color.white
          },
          description: 'Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedActiveForeground',
          defaults: {
            dark: Color.transparent('tab.activeForeground', 0.5),
            light: Color.transparent('tab.activeForeground', 0.7),
            hc: Color.white
          },
          description: 'Active tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedInactiveForeground',
          defaults: {
            dark: Color.transparent('tab.inactiveForeground', 0.5),
            light: Color.transparent('tab.inactiveForeground', 0.5),
            hc: Color.white
          },
          description: 'Inactive tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.border',
          defaults: {
            dark: '#252526',
            light: '#F3F3F3',
            hc: 'contrastBorder'
          },
          description: 'Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.activeBorder',
          description: 'Border on the bottom of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedActiveBorder',
          defaults: {
            dark: Color.transparent('tab.activeBorder', 0.5),
            light: Color.transparent('tab.activeBorder', 0.7)
          },
          description: 'Border on the bottom of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.activeBorderTop',
          defaults: {
            dark: 'focusBorder',
            light: 'focusBorder'
          },
          description: 'Border to the top of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedActiveBorderTop',
          defaults: {
            dark: Color.transparent('tab.activeBorderTop', 0.5),
            light: Color.transparent('tab.activeBorderTop', 0.7)
          },
          description: 'Border to the top of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.hoverBackground',
          description: 'Tab background color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedHoverBackground',
          defaults: {
            dark: Color.transparent('tab.hoverBackground', 0.5),
            light: Color.transparent('tab.hoverBackground', 0.7)
          },
          description: 'Tab background color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.hoverBorder',
          description: 'Border to highlight tabs when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedHoverBorder',
          defaults: {
            dark: Color.transparent('tab.hoverBorder', 0.5),
            light: Color.transparent('tab.hoverBorder', 0.7)
          },
          description: 'Border to highlight tabs in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.activeModifiedBorder',
          defaults: {
            dark: '#3399CC',
            light: '#33AAEE'
          },
          description: 'Border on the top of modified (dirty) active tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.inactiveModifiedBorder',
          defaults: {
            dark: Color.transparent('tab.activeModifiedBorder', 0.5),
            light: Color.transparent('tab.activeModifiedBorder', 0.5),
            hc: Color.white
          },
          description: 'Border on the top of modified (dirty) inactive tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedActiveModifiedBorder',
          defaults: {
            dark: Color.transparent('tab.activeModifiedBorder', 0.5),
            light: Color.transparent('tab.activeModifiedBorder', 0.7),
            hc: Color.white
          },
          description: 'Border on the top of modified (dirty) active tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },
        {
          id: 'tab.unfocusedInactiveModifiedBorder',
          defaults: {
            dark: Color.transparent('tab.inactiveModifiedBorder', 0.5),
            light: Color.transparent('tab.inactiveModifiedBorder', 0.5),
            hc: Color.white
          },
          description: 'Border on the top of modified (dirty) inactive tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.'
        },

        // Status bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#status-bar-colors
        // Not yet supported:
        // statusBarItem.prominentForeground, statusBarItem.prominentBackground, statusBarItem.prominentHoverBackground
        {
          id: 'statusBar.foreground',
          defaults: {
            dark: '#FFFFFF',
            light: '#FFFFFF',
            hc: '#FFFFFF'
          },
          description: 'Status bar foreground color when a workspace is opened. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBar.background',
          defaults: {
            dark: '#007ACC',
            light: '#007ACC'
          },
          description: 'Status bar background color when a workspace is opened. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBar.noFolderForeground',
          defaults: {
            dark: 'statusBar.foreground',
            light: 'statusBar.foreground',
            hc: 'statusBar.foreground'
          },
          description: 'Status bar foreground color when no folder is opened. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBar.noFolderBackground',
          defaults: {
            dark: '#68217A',
            light: '#68217A'
          },
          description: 'Status bar background color when no folder is opened. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBar.border',
          defaults: {
            hc: 'contrastBorder'
          },
          description: 'Status bar border color separating to the sidebar and editor. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBar.noFolderBorder',
          defaults: {
            dark: 'statusBar.border',
            light: 'statusBar.border',
            hc: 'statusBar.border'
          },
          description: 'Status bar border color separating to the sidebar and editor when no folder is opened. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBarItem.activeBackground',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.18),
            light: Color.rgba(255, 255, 255, 0.18),
            hc: Color.rgba(255, 255, 255, 0.18)
          },
          description: 'Status bar item background color when clicking. The status bar is shown in the bottom of the window.'
        },
        {
          id: 'statusBarItem.hoverBackground',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.12),
            light: Color.rgba(255, 255, 255, 0.12),
            hc: Color.rgba(255, 255, 255, 0.12)
          },
          description: 'Status bar item background color when hovering. The status bar is shown in the bottom of the window.'
        },

        // Quickinput colors should be aligned with https://code.visualstudio.com/api/references/theme-color#quick-picker
        // if not yet contributed by Monaco, check runtime css variables to learn.
        {
          id: 'quickInput.background',
          defaults: {
            dark: 'sideBar.background',
            light: 'sideBar.background',
            hc: 'sideBar.background'
          },
          description: 'Quick Input background color. The Quick Input widget is the container for views like the color theme picker.'
        },
        {
          id: 'quickInput.foreground',
          defaults: {
            dark: 'sideBar.foreground',
            light: 'sideBar.foreground',
            hc: 'sideBar.foreground'
          },
          description: 'Quick Input foreground color. The Quick Input widget is the container for views like the color theme picker.'
        },
        {
          id: 'quickInput.list.focusBackground',
          defaults: {
            dark: undefined,
            light: undefined,
            hc: undefined
          },
          description: 'quickInput.list.focusBackground deprecation. Please use quickInputList.focusBackground instead'
        },
        {
          id: 'quickInputList.focusForeground', defaults: {
            dark: 'list.activeSelectionForeground',
            light: 'list.activeSelectionForeground',
            hc: 'list.activeSelectionForeground'
          }, description: 'Quick picker foreground color for the focused item'
        },
        {
          id: 'quickInputList.focusBackground', defaults: {
            dark: 'list.activeSelectionBackground',
            light: 'list.activeSelectionBackground',
            hc: undefined
          }, description: 'Quick picker background color for the focused item.'
        },

        // Panel colors should be aligned with https://code.visualstudio.com/api/references/theme-color#panel-colors
        {
          id: 'panel.background',
          defaults: {
            dark: 'editor.background', light: 'editor.background', hc: 'editor.background'
          },
          description: 'Panel background color. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panel.border',
          defaults: {
            dark: Color.transparent('#808080', 0.35),
            light: Color.transparent('#808080', 0.35),
            hc: 'contrastBorder'
          },
          description: 'Panel border color to separate the panel from the editor. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panel.dropBackground',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.12),
            light: Color.transparent('#2677CB', 0.18),
            hc: Color.rgba(255, 255, 255, 0.12)
          },
          description: 'Drag and drop feedback color for the panel title items. The color should have transparency so that the panel entries can still shine through. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panelTitle.activeForeground',
          defaults: {
            dark: '#E7E7E7', light: '#424242', hc: Color.white
          },
          description: 'Title color for the active panel. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panelTitle.inactiveForeground',
          defaults: {
            dark: Color.transparent('panelTitle.activeForeground', 0.6),
            light: Color.transparent('panelTitle.activeForeground', 0.75),
            hc: Color.white
          },
          description: 'Title color for the inactive panel. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panelTitle.activeBorder',
          defaults: {
            dark: 'panelTitle.activeForeground', light: 'panelTitle.activeForeground', hc: 'contrastBorder'
          },
          description: 'Border color for the active panel title. Panels are shown below the editor area and contain views like output and integrated terminal.'
        },
        {
          id: 'panelInput.border', defaults: {light: '#ddd'},
          description: 'Input box border for inputs in the panel.'
        },
        {
          id: 'imagePreview.border', defaults: {
            dark: Color.transparent('#808080', 0.35),
            light: Color.transparent('#808080', 0.35),
            hc: 'contrastBorder'
          }, description: 'Border color for image in image preview.'
        },

        // Title Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#title-bar-colors
        {
          id: 'titleBar.activeForeground',
          defaults: {
            dark: '#CCCCCC',
            light: '#333333',
            hc: '#FFFFFF'
          },
          description: 'Title bar foreground when the window is active. Note that this color is currently only supported on macOS.'
        },
        {
          id: 'titleBar.inactiveForeground',
          defaults: {
            dark: Color.transparent('titleBar.activeForeground', 0.6),
            light: Color.transparent('titleBar.activeForeground', 0.6)
          },
          description: 'Title bar foreground when the window is inactive. Note that this color is currently only supported on macOS.'
        },
        {
          id: 'titleBar.activeBackground',
          defaults: {
            dark: '#3C3C3C',
            light: '#DDDDDD',
            hc: '#000000'
          },
          description: 'Title bar background when the window is active. Note that this color is currently only supported on macOS.'
        },
        {
          id: 'titleBar.inactiveBackground',
          defaults: {
            dark: Color.transparent('titleBar.activeBackground', 0.6),
            light: Color.transparent('titleBar.activeBackground', 0.6)
          },
          description: 'Title bar background when the window is inactive. Note that this color is currently only supported on macOS.'
        },
        {
          id: 'titleBar.border', defaults: {
            hc: 'contrastBorder'
          }, description: 'Title bar border color. Note that this color is currently only supported on macOS.'
        },

        // Menu Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#menu-bar-colors
        {
          id: 'menubar.selectionForeground', defaults: {
            dark: 'titleBar.activeForeground',
            light: 'titleBar.activeForeground',
            hc: 'titleBar.activeForeground'
          }, description: 'Foreground color of the selected menu item in the menubar.'
        },
        {
          id: 'menubar.selectionBackground', defaults: {
            dark: Color.transparent('#ffffff', 0.1),
            light: Color.transparent('#000000', 0.1)
          }, description: 'Background color of the selected menu item in the menubar.'
        },
        {
          id: 'menubar.selectionBorder', defaults: {
            hc: 'activeContrastBorder'
          }, description: 'Border color of the selected menu item in the menubar.'
        },
        {
          id: 'menu.border', defaults: {
            hc: 'contrastBorder'
          }, description: 'Border color of menus.'
        },
        {
          id: 'menu.foreground', defaults: {
            dark: 'dropdown.foreground', light: 'foreground', hc: 'dropdown.foreground'
          },
          description: 'Foreground color of menu items.'
        },
        {
          id: 'menu.background', defaults: {
            dark: 'dropdown.background', light: 'dropdown.background', hc: 'dropdown.background'
          }, description: 'Background color of menu items.'
        },
        {
          id: 'menu.selectionForeground', defaults: {
            dark: 'list.activeSelectionForeground',
            light: 'list.activeSelectionForeground',
            hc: 'list.activeSelectionForeground'
          }, description: 'Foreground color of the selected menu item in menus.'
        },
        {
          id: 'menu.selectionBackground', defaults:
              {
                dark: 'list.activeSelectionBackground',
                light: 'list.activeSelectionBackground',
                hc: 'list.activeSelectionBackground'
              },
          description: 'Background color of the selected menu item in menus.'
        },
        {
          id: 'menu.selectionBorder', defaults: {
            hc: 'activeContrastBorder'
          }, description: 'Border color of the selected menu item in menus.'
        },
        {
          id: 'menu.separatorBackground', defaults: {
            dark: '#BBBBBB', light: '#888888', hc: 'contrastBorder'
          },
          description: 'Color of a separator menu item in menus.'
        },

        // Welcome Page colors should be aligned with https://code.visualstudio.com/api/references/theme-color#welcome-page
        {id: 'welcomePage.background', description: 'Background color for the Welcome page.'},
        {
          id: 'welcomePage.buttonBackground',
          defaults: {dark: Color.rgba(0, 0, 0, .2), light: Color.rgba(0, 0, 0, .04), hc: Color.black},
          description: 'Background color for the buttons on the Welcome page.'
        },
        {
          id: 'welcomePage.buttonHoverBackground',
          defaults: {dark: Color.rgba(200, 235, 255, .072), light: Color.rgba(0, 0, 0, .10)},
          description: 'Hover background color for the buttons on the Welcome page.'
        },
        {
          id: 'walkThrough.embeddedEditorBackground',
          defaults: {dark: Color.rgba(0, 0, 0, .4), light: '#f4f4f4'},
          description: 'Background color for the embedded editors on the Interactive Playground.'
        },

        // Settings Editor colors should be aligned with https://code.visualstudio.com/api/references/theme-color#settings-editor-colors
        {
          id: 'settings.headerForeground', defaults: {
            light: '#444444', dark: '#e7e7e7', hc: '#ffffff'
          }, description: 'The foreground color for a section header or active title.'
        },
        {
          id: 'settings.modifiedItemIndicator', defaults: {
            light: Color.rgba(102, 175, 224),
            dark: Color.rgba(12, 125, 157),
            hc: Color.rgba(0, 73, 122)
          }, description: 'The color of the modified setting indicator.'
        },
        {
          id: 'settings.dropdownBackground', defaults:
              {dark: 'dropdown.background', light: 'dropdown.background', hc: 'dropdown.background'},
          description: 'Settings editor dropdown background.'
        },
        {
          id: 'settings.dropdownForeground', defaults: {
            dark: 'dropdown.foreground', light: 'dropdown.foreground', hc: 'dropdown.foreground'
          }, description: 'Settings editor dropdown foreground.'
        },
        {
          id: 'settings.dropdownBorder', defaults: {
            dark: 'dropdown.border', light: 'dropdown.border', hc: 'dropdown.border'
          }, description: 'Settings editor dropdown border.'
        },
        {
          id: 'settings.dropdownListBorder',
          defaults: {
            dark: 'editorWidget.border', light: 'editorWidget.border', hc: 'editorWidget.border'
          },
          description: 'Settings editor dropdown list border. This surrounds the options and separates the options from the description.'
        },
        {
          id: 'settings.checkboxBackground', defaults: {
            dark: 'checkbox.background', light: 'checkbox.background', hc: 'checkbox.background'
          }, description: 'Settings editor checkbox background.'
        },
        {
          id: 'settings.checkboxForeground', defaults: {
            dark: 'checkbox.foreground', light: 'checkbox.foreground', hc: 'checkbox.foreground'
          }, description: 'Settings editor checkbox foreground.'
        },
        {
          id: 'settings.checkboxBorder', defaults:
              {
                dark: 'checkbox.border', light: 'checkbox.border', hc: 'checkbox.border'
              }, description: 'Settings editor checkbox border.'
        },
        {
          id: 'settings.textInputBackground', defaults: {
            dark: 'input.background', light: 'input.background', hc: 'input.background'
          }, description: 'Settings editor text input box background.'
        },
        {
          id: 'settings.textInputForeground', defaults: {
            dark: 'input.foreground', light: 'input.foreground', hc: 'input.foreground'
          }, description: 'Settings editor text input box foreground.'
        },
        {
          id: 'settings.textInputBorder', defaults: {
            dark: 'input.border', light: 'input.border', hc: 'input.border'
          }, description: 'Settings editor text input box border.'
        },
        {
          id: 'settings.numberInputBackground', defaults: {
            dark: 'input.background', light: 'input.background', hc: 'input.background'
          }, description: 'Settings editor number input box background.'
        },
        {
          id: 'settings.numberInputForeground', defaults: {
            dark: 'input.foreground', light: 'input.foreground', hc: 'input.foreground'
          }, description: 'Settings editor number input box foreground.'
        },
        {
          id: 'settings.numberInputBorder', defaults: {
            dark: 'input.border', light: 'input.border', hc: 'input.border'
          }, description: 'Settings editor number input box border.'
        },

        // Wm Variable colors
        {
          id: 'variable.name.color', defaults: {
            dark: '#C586C0',
            light: '#9B46B0',
            hc: '#C586C0'
          },
          description: 'Color of a variable name.'
        },
        {
          id: 'variable.value.color', defaults: {
            dark: Color.rgba(204, 204, 204, 0.6),
            light: Color.rgba(108, 108, 108, 0.8),
            hc: Color.rgba(204, 204, 204, 0.6)
          },
          description: 'Color of a variable value.'
        },
        {
          id: 'variable.number.variable.color', defaults: {
            dark: '#B5CEA8',
            light: '#09885A',
            hc: '#B5CEA8'
          },
          description: 'Value color of a number variable'
        },
        {
          id: 'variable.boolean.variable.color', defaults: {
            dark: '#4E94CE',
            light: '#0000FF',
            hc: '#4E94CE'
          },
          description: 'Value color of a boolean variable'
        },
        {
          id: 'variable.string.variable.color', defaults: {
            dark: '#CE9178',
            light: '#A31515',
            hc: '#CE9178'
          },
          description: 'Value color of a string variable'
        },

        // Wm ANSI colors
        {
          id: 'ansi.black.color', defaults: {
            dark: '#A0A0A0',
            light: Color.rgba(128, 128, 128),
            hc: '#A0A0A0'
          },
          description: 'ANSI black color'
        },
        {
          id: 'ansi.red.color', defaults: {
            dark: '#A74747',
            light: '#BE1717',
            hc: '#A74747'
          },
          description: 'ANSI red color'
        },
        {
          id: 'ansi.green.color', defaults: {
            dark: '#348F34',
            light: '#338A2F',
            hc: '#348F34'
          },
          description: 'ANSI green color'
        },
        {
          id: 'ansi.yellow.color', defaults: {
            dark: '#5F4C29',
            light: '#BEB817',
            hc: '#5F4C29'
          },
          description: 'ANSI yellow color'
        },
        {
          id: 'ansi.blue.color', defaults: {
            dark: '#6286BB',
            light: Color.rgba(0, 0, 139),
            hc: '#6286BB'
          },
          description: 'ANSI blue color'
        },
        {
          id: 'ansi.magenta.color', defaults: {
            dark: '#914191',
            light: Color.rgba(139, 0, 139),
            hc: '#914191'
          },
          description: 'ANSI magenta color'
        },
        {
          id: 'ansi.cyan.color', defaults: {
            dark: '#218D8D',
            light: Color.rgba(0, 139, 139),
            hc: '#218D8D'
          },
          description: 'ANSI cyan color'
        },
        {
          id: 'ansi.white.color', defaults: {
            dark: '#707070',
            light: '#BDBDBD',
            hc: '#707070'
          },
          description: 'ANSI white color'
        },

        // Wm defaults
        // Base
        {
          id: 'errorBackground',
          defaults: {
            dark: 'inputValidation.errorBackground',
            light: 'inputValidation.errorBackground',
            hc: 'inputValidation.errorBackground'
          }, description: 'Background color of error widgets (like alerts or notifications).'
        },
        {
          id: 'successBackground',
          defaults: {
            dark: 'editorGutter.addedBackground',
            light: 'editorGutter.addedBackground',
            hc: 'editorGutter.addedBackground'
          }, description: 'Background color of success widgets (like alerts or notifications).'
        },
        {
          id: 'warningBackground',
          defaults: {
            dark: 'editorWarning.foreground',
            light: 'editorWarning.foreground',
            hc: 'editorWarning.border'
          }, description: 'Background color of warning widgets (like alerts or notifications).'
        },
        {
          id: 'warningForeground',
          defaults: {
            dark: 'inputValidation.warningBackground',
            light: 'inputValidation.warningBackground',
            hc: 'inputValidation.warningBackground'
          }, description: 'Foreground color of warning widgets (like alerts or notifications).'
        },
        // Statusbar
        {
          id: 'statusBar.offlineBackground',
          defaults: {
            dark: 'editorWarning.foreground',
            light: 'editorWarning.foreground',
            hc: 'editorWarning.foreground'
          }, description: 'Background of hovered statusbar item in case the wm server is offline.'
        },
        {
          id: 'statusBar.offlineForeground',
          defaults: {
            dark: 'editor.background',
            light: 'editor.background',
            hc: 'editor.background'
          }, description: 'Background of hovered statusbar item in case the wm server is offline.'
        },
        {
          id: 'statusBarItem.offlineHoverBackground',
          defaults: {
            dark: Color.lighten('statusBar.offlineBackground', 0.4),
            light: Color.lighten('statusBar.offlineBackground', 0.4),
            hc: Color.lighten('statusBar.offlineBackground', 0.4)
          }, description: 'Background of hovered statusbar item in case the wm server is offline.'
        },
        {
          id: 'statusBarItem.offlineActiveBackground',
          defaults: {
            dark: Color.lighten('statusBar.offlineBackground', 0.6),
            light: Color.lighten('statusBar.offlineBackground', 0.6),
            hc: Color.lighten('statusBar.offlineBackground', 0.6)
          }, description: 'Background of active statusbar item in case the wm server is offline.'
        },
        // Buttons
        {
          id: 'secondaryButton.foreground',
          defaults: {
            dark: 'dropdown.foreground',
            light: 'dropdown.foreground',
            hc: 'dropdown.foreground'
          }, description: 'Foreground color of secondary buttons.'
        },
        {
          id: 'secondaryButton.disabledForeground',
          defaults: {
            dark: Color.transparent('secondaryButton.foreground', 0.5),
            light: Color.transparent('secondaryButton.foreground', 0.5),
            hc: Color.transparent('secondaryButton.foreground', 0.5),
          }, description: 'Foreground color of secondary buttons.'
        },
        {
          id: 'secondaryButton.background',
          defaults: {
            dark: Color.lighten('dropdown.background', 0.5),
            light: Color.lighten('dropdown.background', 0.5)
          }, description: 'Background color of secondary buttons.'
        },
        {
          id: 'secondaryButton.hoverBackground',
          defaults: {
            dark: Color.lighten('secondaryButton.background', 0.2),
            light: Color.lighten('secondaryButton.background', 0.2)
          }, description: 'Background color when hovering secondary buttons.'
        },
        {
          id: 'secondaryButton.disabledBackground',
          defaults: {
            dark: Color.transparent('secondaryButton.background', 0.6),
            light: Color.transparent('secondaryButton.background', 0.6)
          }, description: 'Background color when hovering secondary buttons.'
        },
        {
          id: 'button.disabledForeground',
          defaults: {
            dark: Color.transparent('button.foreground', 0.5),
            light: Color.transparent('button.foreground', 0.5),
            hc: Color.transparent('button.foreground', 0.5)
          }, description: 'Foreground color of secondary buttons.'
        },
        {
          id: 'button.disabledBackground',
          defaults: {
            dark: Color.transparent('button.background', 0.5),
            light: Color.transparent('button.background', 0.5)
          }, description: 'Background color of secondary buttons.'
        },
        {
          id: 'editorGutter.commentRangeForeground',
          defaults: {
            dark: '#c5c5c5',
            light: '#c5c5c5',
            hc: '#c5c5c5'
          }, description: 'Editor gutter decoration color for commenting ranges.'
        },
        {
          id: 'breadcrumb.foreground',
          defaults: {
            dark: Color.transparent('foreground', 0.8),
            light: Color.transparent('foreground', 0.8),
            hc: Color.transparent('foreground', 0.8),
          },
          description: 'Color of breadcrumb item text'
        },
        {
          id: 'breadcrumb.background',
          defaults: {
            dark: 'editor.background',
            light: 'editor.background',
            hc: 'editor.background',
          },
          description: 'Color of breadcrumb item background'
        },
        {
          id: 'breadcrumb.focusForeground',
          defaults: {
            dark: Color.lighten('foreground', 0.1),
            light: Color.darken('foreground', 0.2),
            hc: Color.lighten('foreground', 0.1),
          },
          description: 'Color of breadcrumb item text when focused'
        },
        {
          id: 'breadcrumb.activeSelectionForeground',
          defaults: {
            dark: Color.lighten('foreground', 0.1),
            light: Color.darken('foreground', 0.2),
            hc: Color.lighten('foreground', 0.1),
          },
          description: 'Color of selected breadcrumb item'
        },
        {
          id: 'breadcrumbPicker.background',
          defaults: {
            dark: 'editorWidget.background',
            light: 'editorWidget.background',
            hc: 'editorWidget.background',
          },
          description: 'Background color of breadcrumb item picker'
        }
    );
  }

  registerLocalizations(registry: LocalizationRegistry): void {
    registry.registerLocalizationFromRequire('zh-cn', zhcn);
  }

  selectColorTheme(): void {
    let resetTo: string | undefined = this.themeService.getCurrentTheme().id;
    const previewTheme = debounce((id: string) => this.themeService.setCurrentTheme(id), 200);


    const itemsByTheme: { light: Array<QuickPickItem>, dark: Array<QuickPickItem>, hc: Array<QuickPickItem> } = {
      light: [],
      dark: [],
      hc: []
    };
    for (const theme of this.themeService.getThemes().sort((a, b) => a.label.localeCompare(b.label))) {
      const themeItems = itemsByTheme[theme.type];
      if (themeItems.length === 0) {
        themeItems.push({
          type: 'separator',
          label: (theme.type === 'hc' ? 'high contrast' : theme.type) + ' themes'
        });
      }
      themeItems.push({
        id: theme.id,
        label: theme.label,
        description: theme.description,
      });
    }
    const items = [...itemsByTheme.light, ...itemsByTheme.dark, ...itemsByTheme.hc];
    this.quickInputService?.showQuickPick(items,
        {
          placeholder: nls.localizeByDefault('Select Color Theme (Up/Down Keys to Preview)'),
          activeItem: items.find((item: QuickPickItem) => item.id === resetTo),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDidChangeSelection: (quickPick: any, selectedItems: Array<QuickPickItem>) => {
            resetTo = undefined;
            previewTheme(selectedItems[0]?.id!);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDidChangeActive: (quickPick: any, activeItems: Array<QuickPickItem>) => {
            previewTheme(activeItems[0]?.id!);
          },
          onDidHide: () => {
            if (resetTo) {
              this.themeService.setCurrentTheme(resetTo);
            }
          }
        });
  }

  protected selectIconTheme(): void {
    let resetTo: string | undefined = this.iconThemes.current;
    const previewTheme = debounce((id: string) => this.iconThemes.current = id, 200);

    let items: Array<QuickPickItem> = [];
    for (const iconTheme of this.iconThemes.definitions) {
      items.push({
        id: iconTheme.id,
        label: iconTheme.label,
        description: iconTheme.description,
      });
    }
    items = items.sort((a, b) => {
      if (a.id === 'none') {
        return -1;
      }
      return a.label!.localeCompare(b.label!);
    });

    this.quickInputService?.showQuickPick(items,
        {
          placeholder: nls.localizeByDefault('Select File Icon Theme'),
          activeItem: items.find(item => item.id === resetTo),
          onDidChangeSelection: (quickPick: QuickPick<QuickPickItem>, selectedItems: Array<QuickPickItem>) => {
            resetTo = undefined;
            previewTheme(selectedItems[0].id!);
          },
          onDidChangeActive: (quickPick: QuickPick<QuickPickItem>, activeItems: Array<QuickPickItem>) => {
            previewTheme(activeItems[0].id!);
          },
          onDidHide: () => {
            if (resetTo) {
              this.iconThemes.current = resetTo;
            }
          }
        });
  }

  protected async configureDisplayLanguage(): Promise<void> {
    // const availableLanguages = await this.localizationProvider.getAvailableLanguages();
    // const items: QuickPickItem[] = [];
    // for (const additionalLanguage of ['en', ...availableLanguages]) {
    //     items.push({
    //         label: additionalLanguage,
    //         execute: () => {
    //             if (additionalLanguage !== nls.locale) {
    //                 window.localStorage.setItem(nls.localeId, additionalLanguage);
    //                 window.location.reload();
    //             }
    //         }
    //     });
    // }
    // this.quickInputService?.showQuickPick(items,
    //     {
    //         placeholder: CommonCommands.CONFIGURE_DISPLAY_LANGUAGE.label,
    //         activeItem: items.find(item => item.label === (nls.locale || 'en'))
    //     });
  }

  private findTabArea(event?: Event): ApplicationShell.Area | undefined {
    const tabBar = this.shell.findTabBar(event);
    if (tabBar) {
      return this.shell.getAreaFor(tabBar);
    }
    return this.shell.currentTabArea;
  }

  /**
   * Finds the index of the selected title from the tab-bar.
   * @param tabBar: used for providing an array of titles.
   * @returns the index of the selected title if it is available in the tab-bar, else returns the index of currently-selected title.
   */
  private findTitleIndex(tabBar: TabBar<Widget>, event?: Event): number {
    if (event) {
      const targetTitle = this.shell.findTitle(tabBar, event);
      return targetTitle ? tabBar.titles.indexOf(targetTitle) : tabBar.currentIndex;
    }
    return tabBar.currentIndex;
  }

  private canToggleMaximized(event?: Event): boolean {
    if (event?.target instanceof HTMLElement) {
      const widget = this.shell.findWidgetForElement(event.target);
      if (widget) {
        return this.shell.mainPanel.contains(widget) || this.shell.bottomPanel.contains(widget);
      }
    }
    return this.shell.canToggleMaximized();
  }

  /**
   * Maximize the bottom or the main dockpanel based on the widget.
   * @param event used to find the selected widget.
   */
  private toggleMaximized(event?: Event): void {
    if (event?.target instanceof HTMLElement) {
      const widget = this.shell.findWidgetForElement(event.target);
      if (widget) {
        if (this.shell.mainPanel.contains(widget)) {
          this.shell.mainPanel.toggleMaximized();
        } else if (this.shell.bottomPanel.contains(widget)) {
          this.shell.bottomPanel.toggleMaximized();
        }
        if (widget instanceof TabBar) {
          // reveals the widget when maximized.
          const title = this.shell.findTitle(widget, event);
          if (title) {
            this.shell.revealWidget(title.owner.id);
          }
        }
      }
    } else {
      this.shell.toggleMaximized();
    }
  }
}