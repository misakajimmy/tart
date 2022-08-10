import { KeybindingRegistry, QuickAccessProviderDescriptor, QuickAccessRegistry } from '@tart/core';
import { Disposable } from '@tart/core/lib/common';
export declare class MonacoQuickAccessRegistry implements QuickAccessRegistry {
    protected readonly keybindingRegistry: KeybindingRegistry;
    private get monacoRegistry();
    registerQuickAccessProvider(descriptor: QuickAccessProviderDescriptor): Disposable;
    getQuickAccessProviders(): QuickAccessProviderDescriptor[];
    getQuickAccessProvider(prefix: string): QuickAccessProviderDescriptor | undefined;
    clear(): void;
}
