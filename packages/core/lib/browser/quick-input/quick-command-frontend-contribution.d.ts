import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '../../common';
import { KeybindingContribution, KeybindingRegistry } from '../keybinding';
import { QuickCommandService } from './quick-command-service';
import { QuickInputService } from '../../common/quick-pick-service';
export declare class QuickCommandFrontendContribution implements CommandContribution, KeybindingContribution, MenuContribution {
    protected readonly quickInputService: QuickInputService;
    protected readonly quickCommandService: QuickCommandService;
    registerCommands(commands: CommandRegistry): void;
    registerMenus(menus: MenuModelRegistry): void;
    registerKeybindings(keybindings: KeybindingRegistry): void;
}
