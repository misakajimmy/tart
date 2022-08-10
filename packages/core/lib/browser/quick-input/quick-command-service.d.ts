import { CancellationToken, Command, CommandRegistry, Disposable } from '../../common';
import { QuickAccessContribution, QuickAccessProvider, QuickAccessRegistry } from './quick-access';
import { ContextKeyService } from '../context-key-service';
import { CorePreferences } from '../core-preferences';
import { KeybindingRegistry } from '../keybinding';
import { QuickPicks } from '../../common/quick-pick-service';
export declare const quickCommand: Command;
export declare const CLEAR_COMMAND_HISTORY: Command;
export declare class QuickCommandService implements QuickAccessContribution, QuickAccessProvider {
    static PREFIX: string;
    readonly exemptedCommands: Command[];
    protected readonly contextKeyService: ContextKeyService;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly corePreferences: CorePreferences;
    protected readonly quickAccessRegistry: QuickAccessRegistry;
    protected readonly keybindingRegistry: KeybindingRegistry;
    protected readonly contexts: Map<string, string[]>;
    private recentItems;
    private otherItems;
    registerQuickAccessProvider(): void;
    reset(): void;
    getPicks(filter: string, token: CancellationToken): QuickPicks;
    pushCommandContext(commandId: string, when: string): Disposable;
    /**
     * Get the list of valid commands.
     *
     * @param commands the list of raw commands.
     * @returns the list of valid commands.
     */
    protected getValidCommands(raw: Command[]): Command[];
    /**
     * Get the list of recently used and other commands.
     *
     * @returns the list of recently used commands and other commands.
     */
    protected getCommands(): {
        recent: Command[];
        other: Command[];
    };
    private toItem;
    private getKeybinding;
    private getItemIconClasses;
    /**
     * Normalizes a list of commands.
     * Normalization includes obtaining commands that have labels, are visible, and are enabled.
     *
     * @param commands the list of commands.
     * @returns the list of normalized commands.
     */
    private normalize;
    /**
     * Sorts a list of commands alphabetically.
     *
     * @param commands the list of commands.
     * @returns the list of sorted commands.
     */
    private sort;
}
