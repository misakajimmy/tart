import { FrontendApplicationContribution } from './frontend-application';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService, SelectionService } from '../common';
import { StorageService } from './storage-service';
import { OpenerService } from '../browser/opener-service';
import { KeybindingContribution, KeybindingRegistry } from './keybinding';
import { ColorContribution } from './color-application-contribution';
import { ColorRegistry } from './color-registry';
import { ThemeService } from './theming';
import { QuickInputService } from '../common/quick-pick-service';
import { ApplicationShell } from './shell';
import { ClipboardService } from './clipboard-service';
import { PreferenceService } from './preferences';
import { CorePreferences } from './core-preferences';
import { IconThemeService } from './icon-theme-service';
import { LocalizationContribution, LocalizationRegistry } from '../common/i18n/localization-contribution';
import { LocalizationProvider } from '../common/i18n/localization-provider';
export declare namespace CommonMenus {
    const FILE: string[];
    const FILE_NEW: string[];
    const FILE_OPEN: string[];
    const FILE_SAVE: string[];
    const FILE_AUTOSAVE: string[];
    const FILE_SETTINGS: string[];
    const FILE_SETTINGS_SUBMENU: string[];
    const FILE_SETTINGS_SUBMENU_OPEN: string[];
    const FILE_SETTINGS_SUBMENU_THEME: string[];
    const FILE_CLOSE: string[];
    const EDIT: string[];
    const EDIT_UNDO: string[];
    const EDIT_CLIPBOARD: string[];
    const EDIT_FIND: string[];
    const VIEW: string[];
    const VIEW_PRIMARY: string[];
    const VIEW_VIEWS: string[];
    const VIEW_LAYOUT: string[];
    const VIEW_TOGGLE: string[];
    const SETTINGS_OPEN: string[];
    const SETTINGS__THEME: string[];
    const HELP: string[];
}
export declare namespace CommonCommands {
    const FILE_CATEGORY = "File";
    const VIEW_CATEGORY = "View";
    const PREFERENCES_CATEGORY = "Preferences";
    const FILE_CATEGORY_KEY: string;
    const VIEW_CATEGORY_KEY: string;
    const PREFERENCES_CATEGORY_KEY: string;
    const OPEN: Command;
    const CUT: Command;
    const COPY: Command;
    const PASTE: Command;
    const COPY_PATH: Command;
    const UNDO: Command;
    const REDO: Command;
    const SELECT_ALL: Command;
    const FIND: Command;
    const REPLACE: Command;
    const NEXT_TAB: Command;
    const PREVIOUS_TAB: Command;
    const NEXT_TAB_IN_GROUP: Command;
    const PREVIOUS_TAB_IN_GROUP: Command;
    const NEXT_TAB_GROUP: Command;
    const PREVIOUS_TAB_GROUP: Command;
    const CLOSE_TAB: Command;
    const CLOSE_OTHER_TABS: Command;
    const CLOSE_RIGHT_TABS: Command;
    const CLOSE_ALL_TABS: Command;
    const CLOSE_MAIN_TAB: Command;
    const CLOSE_OTHER_MAIN_TABS: Command;
    const CLOSE_ALL_MAIN_TABS: Command;
    const COLLAPSE_PANEL: Command;
    const COLLAPSE_ALL_PANELS: Command;
    const TOGGLE_BOTTOM_PANEL: Command;
    const TOGGLE_STATUS_BAR: Command;
    const TOGGLE_MAXIMIZED: Command;
    const OPEN_VIEW: Command;
    const SAVE: Command;
    const SAVE_WITHOUT_FORMATTING: Command;
    const SAVE_ALL: Command;
    const AUTO_SAVE: Command;
    const ABOUT_COMMAND: Command;
    const OPEN_PREFERENCES: Command;
    const SELECT_COLOR_THEME: Command;
    const SELECT_ICON_THEME: Command;
    const CONFIGURE_DISPLAY_LANGUAGE: Command;
}
export declare const supportCut: boolean;
export declare const supportCopy: boolean;
export declare const supportPaste: boolean;
export declare const RECENT_COMMANDS_STORAGE_KEY = "commands";
export declare class CommonFrontendContribution implements FrontendApplicationContribution, MenuContribution, CommandContribution, KeybindingContribution, ColorContribution, LocalizationContribution {
    protected readonly shell: ApplicationShell;
    protected readonly selectionService: SelectionService;
    protected readonly messageService: MessageService;
    protected readonly openerService: OpenerService;
    protected readonly quickInputService: QuickInputService;
    protected readonly preferences: CorePreferences;
    protected readonly preferenceService: PreferenceService;
    protected readonly themeService: ThemeService;
    protected readonly storageService: StorageService;
    protected readonly clipboardService: ClipboardService;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly iconThemes: IconThemeService;
    protected readonly localizationProvider: LocalizationProvider;
    constructor(shell: ApplicationShell, selectionService: SelectionService, messageService: MessageService, openerService: OpenerService);
    onStart(): void;
    registerCommands(commandRegistry: CommandRegistry): void;
    registerKeybindings(registry: KeybindingRegistry): void;
    registerMenus(registry: MenuModelRegistry): void;
    registerColors(colors: ColorRegistry): void;
    registerLocalizations(registry: LocalizationRegistry): void;
    selectColorTheme(): void;
    protected selectIconTheme(): void;
    protected configureDisplayLanguage(): Promise<void>;
    private findTabArea;
    /**
     * Finds the index of the selected title from the tab-bar.
     * @param tabBar: used for providing an array of titles.
     * @returns the index of the selected title if it is available in the tab-bar, else returns the index of currently-selected title.
     */
    private findTitleIndex;
    private canToggleMaximized;
    /**
     * Maximize the bottom or the main dockpanel based on the widget.
     * @param event used to find the selected widget.
     */
    private toggleMaximized;
}
