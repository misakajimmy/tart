import { KeybindingContribution, KeybindingRegistry } from '@tart/core';
import { MonacoCommandRegistry } from './monaco-command-registry';
export declare class MonacoKeybindingContribution implements KeybindingContribution {
    protected readonly commands: MonacoCommandRegistry;
    registerKeybindings(registry: KeybindingRegistry): void;
}
