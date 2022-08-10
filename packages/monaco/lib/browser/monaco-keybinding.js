var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { MonacoResolvedKeybinding } from './monaco-resolved-keybinding';
import { MonacoCommandRegistry } from './monaco-command-registry';
let MonacoKeybindingContribution = class MonacoKeybindingContribution {
    registerKeybindings(registry) {
        const defaultKeybindings = monaco.keybindings.KeybindingsRegistry.getDefaultKeybindings();
        for (const item of defaultKeybindings) {
            const command = this.commands.validate(item.command);
            if (command) {
                const when = item.when && item.when.serialize();
                let keybinding;
                keybinding = MonacoResolvedKeybinding.toKeybinding(item.keybinding);
                registry.registerKeybinding({ command, keybinding, when });
            }
        }
    }
};
__decorate([
    inject(MonacoCommandRegistry)
], MonacoKeybindingContribution.prototype, "commands", void 0);
MonacoKeybindingContribution = __decorate([
    injectable()
], MonacoKeybindingContribution);
export { MonacoKeybindingContribution };

//# sourceMappingURL=../../lib/browser/monaco-keybinding.js.map
