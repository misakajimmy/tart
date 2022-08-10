var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QuickCommandService_1;
import { Command, CommandRegistry, Disposable } from '../../common';
import { inject, injectable } from 'inversify';
import { QuickAccessRegistry } from './quick-access';
import { ContextKeyService } from '../context-key-service';
import { CorePreferences } from '../core-preferences';
import { KeybindingRegistry } from '../keybinding';
import { filterItems } from '../../common/quick-pick-service';
import { codiconArray } from '../widgets';
export const quickCommand = {
    id: 'workbench.action.showCommands'
};
export const CLEAR_COMMAND_HISTORY = Command.toDefaultLocalizedCommand({
    id: 'clear.command.history',
    label: 'Clear Command History'
});
let QuickCommandService = QuickCommandService_1 = class QuickCommandService {
    static PREFIX = '>';
    // The list of exempted commands not to be displayed in the recently used list.
    exemptedCommands = [
        CLEAR_COMMAND_HISTORY,
    ];
    contextKeyService;
    commandRegistry;
    corePreferences;
    quickAccessRegistry;
    keybindingRegistry;
    contexts = new Map();
    recentItems = [];
    otherItems = [];
    registerQuickAccessProvider() {
        this.quickAccessRegistry.registerQuickAccessProvider({
            getInstance: () => this,
            prefix: QuickCommandService_1.PREFIX,
            placeholder: '',
            helpEntries: [{ description: 'Quick Command', needsEditor: false }]
        });
    }
    reset() {
        const { recent, other } = this.getCommands();
        this.recentItems = [];
        this.otherItems = [];
        this.recentItems.push(...recent.map(command => this.toItem(command)));
        this.otherItems.push(...other.map(command => this.toItem(command)));
    }
    getPicks(filter, token) {
        const items = [];
        // Update the list of commands by fetching them from the registry.
        this.reset();
        const recentItems = filterItems(this.recentItems.slice(), filter);
        const otherItems = filterItems(this.otherItems.slice(), filter);
        if (recentItems.length > 0) {
            items.push({ type: 'separator', label: 'recently used' }, ...recentItems);
        }
        if (otherItems.length > 0) {
            if (recentItems.length > 0) {
                items.push({ type: 'separator', label: 'other commands' });
            }
            items.push(...otherItems);
        }
        return items;
    }
    pushCommandContext(commandId, when) {
        const contexts = this.contexts.get(commandId) || [];
        contexts.push(when);
        this.contexts.set(commandId, contexts);
        return Disposable.create(() => {
            const index = contexts.indexOf(when);
            if (index !== -1) {
                contexts.splice(index, 1);
            }
        });
    }
    /**
     * Get the list of valid commands.
     *
     * @param commands the list of raw commands.
     * @returns the list of valid commands.
     */
    getValidCommands(raw) {
        const valid = [];
        raw.forEach(command => {
            if (command.label) {
                const contexts = this.contexts.get(command.id);
                if (!contexts || contexts.some(when => this.contextKeyService.match(when))) {
                    valid.push(command);
                }
            }
        });
        return valid;
    }
    /**
     * Get the list of recently used and other commands.
     *
     * @returns the list of recently used commands and other commands.
     */
    getCommands() {
        // Get the list of recent commands.
        const recentCommands = this.commandRegistry.recent;
        // Get the list of all valid commands.
        const allCommands = this.getValidCommands(this.commandRegistry.commands);
        // Get the max history limit.
        const limit = this.corePreferences['workbench.commandPalette.history'];
        // Build the list of recent commands.
        let rCommands = [];
        if (limit > 0) {
            rCommands.push(...recentCommands.filter(r => !this.exemptedCommands.some(c => Command.equals(r, c)) &&
                allCommands.some(c => Command.equals(r, c))));
            if (rCommands.length > limit) {
                rCommands = rCommands.slice(0, limit);
            }
        }
        // Build the list of other commands.
        const oCommands = allCommands.filter(c => !rCommands.some(r => Command.equals(r, c)));
        // Normalize the list of recent commands.
        const recent = this.normalize(rCommands);
        // Normalize, and sort the list of other commands.
        const other = this.sort(this.normalize(oCommands));
        return { recent, other };
    }
    toItem(command) {
        const label = (command.category) ? `${command.category}: ` + command.label : command.label;
        const iconClasses = this.getItemIconClasses(command);
        const activeElement = window.document.activeElement;
        const originalLabel = command.originalLabel || command.label;
        const originalCategory = command.originalCategory || command.category;
        let detail = originalCategory ? `${originalCategory}: ${originalLabel}` : originalLabel;
        if (label === detail) {
            detail = undefined;
        }
        return {
            label,
            detail,
            iconClasses,
            alwaysShow: !!this.commandRegistry.getActiveHandler(command.id),
            keySequence: this.getKeybinding(command),
            execute: () => {
                activeElement.focus({ preventScroll: true });
                this.commandRegistry.executeCommand(command.id);
                this.commandRegistry.addRecentCommand(command);
            }
        };
    }
    getKeybinding(command) {
        const keybindings = this.keybindingRegistry.getKeybindingsForCommand(command.id);
        if (!keybindings || keybindings.length === 0) {
            return undefined;
        }
        try {
            return this.keybindingRegistry.resolveKeybinding(keybindings[0]);
        }
        catch (error) {
            return undefined;
        }
    }
    getItemIconClasses(command) {
        const toggledHandler = this.commandRegistry.getToggledHandler(command.id);
        if (toggledHandler) {
            return codiconArray('check');
        }
        return undefined;
    }
    /**
     * Normalizes a list of commands.
     * Normalization includes obtaining commands that have labels, are visible, and are enabled.
     *
     * @param commands the list of commands.
     * @returns the list of normalized commands.
     */
    normalize(commands) {
        return commands.filter((a) => a.label && (this.commandRegistry.isVisible(a.id) && this.commandRegistry.isEnabled(a.id)));
    }
    /**
     * Sorts a list of commands alphabetically.
     *
     * @param commands the list of commands.
     * @returns the list of sorted commands.
     */
    sort(commands) {
        return commands.sort((a, b) => Command.compareCommands(a, b));
    }
};
__decorate([
    inject(ContextKeyService)
], QuickCommandService.prototype, "contextKeyService", void 0);
__decorate([
    inject(CommandRegistry)
], QuickCommandService.prototype, "commandRegistry", void 0);
__decorate([
    inject(CorePreferences)
], QuickCommandService.prototype, "corePreferences", void 0);
__decorate([
    inject(QuickAccessRegistry)
], QuickCommandService.prototype, "quickAccessRegistry", void 0);
__decorate([
    inject(KeybindingRegistry)
], QuickCommandService.prototype, "keybindingRegistry", void 0);
QuickCommandService = QuickCommandService_1 = __decorate([
    injectable()
], QuickCommandService);
export { QuickCommandService };

//# sourceMappingURL=../../../lib/browser/quick-input/quick-command-service.js.map
