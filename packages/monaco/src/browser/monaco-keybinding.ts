import {inject, injectable} from 'inversify';
import {KeybindingContribution, KeybindingRegistry} from '@tart/core';
import {MonacoResolvedKeybinding} from './monaco-resolved-keybinding';
import {MonacoCommandRegistry} from './monaco-command-registry';

@injectable()
export class MonacoKeybindingContribution implements KeybindingContribution {

    @inject(MonacoCommandRegistry)
    protected readonly commands: MonacoCommandRegistry;

    registerKeybindings(registry: KeybindingRegistry): void {
        const defaultKeybindings = monaco.keybindings.KeybindingsRegistry.getDefaultKeybindings();
        for (const item of defaultKeybindings) {
            const command = this.commands.validate(item.command);
            if (command) {
                const when = item.when && item.when.serialize();
                let keybinding;
                keybinding = MonacoResolvedKeybinding.toKeybinding(item.keybinding);
                registry.registerKeybinding({command, keybinding, when});
            }
        }
    }
}
