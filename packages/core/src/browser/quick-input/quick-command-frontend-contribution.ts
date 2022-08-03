import {inject, injectable, optional} from 'inversify';
import {CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry} from '../../common';
import {KeybindingContribution, KeybindingRegistry} from '../keybinding';
import {quickCommand, QuickCommandService} from './quick-command-service';
import {CommonMenus} from '../common-frontend-contribution';
import {QuickInputService} from '../../common/quick-pick-service';
import {nls} from '../../common/nls';

@injectable()
export class QuickCommandFrontendContribution implements CommandContribution, KeybindingContribution, MenuContribution {

  @inject(QuickInputService) @optional()
  protected readonly quickInputService: QuickInputService;


  @inject(QuickCommandService) @optional()
  protected readonly quickCommandService: QuickCommandService;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(quickCommand, {
      execute: () => {
        this.quickInputService?.open('>');
      }
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
      commandId: quickCommand.id,
      label: nls.localizeByDefault('Command Palette...')
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: quickCommand.id,
      keybinding: 'f1'
    });
  }
}
