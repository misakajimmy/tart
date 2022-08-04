var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, optional } from 'inversify';
import { quickCommand, QuickCommandService } from './quick-command-service';
import { CommonMenus } from '../common-frontend-contribution';
import { QuickInputService } from '../../common/quick-pick-service';
import { nls } from '../../common/nls';
let QuickCommandFrontendContribution = class QuickCommandFrontendContribution {
    quickInputService;
    quickCommandService;
    registerCommands(commands) {
        commands.registerCommand(quickCommand, {
            execute: () => {
                this.quickInputService?.open('>');
            }
        });
    }
    registerMenus(menus) {
        menus.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
            commandId: quickCommand.id,
            label: nls.localizeByDefault('Command Palette...')
        });
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: quickCommand.id,
            keybinding: 'f1'
        });
    }
};
__decorate([
    inject(QuickInputService),
    optional()
], QuickCommandFrontendContribution.prototype, "quickInputService", void 0);
__decorate([
    inject(QuickCommandService),
    optional()
], QuickCommandFrontendContribution.prototype, "quickCommandService", void 0);
QuickCommandFrontendContribution = __decorate([
    injectable()
], QuickCommandFrontendContribution);
export { QuickCommandFrontendContribution };

//# sourceMappingURL=../../../lib/browser/quick-input/quick-command-frontend-contribution.js.map
