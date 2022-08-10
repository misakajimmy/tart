import { ApplicationShell, KeybindingContext } from '@tart/core';
export declare namespace NavigatorKeybindingContexts {
    const navigatorActive = "navigatorActive";
}
export declare class NavigatorActiveContext implements KeybindingContext {
    readonly id: string;
    protected readonly applicationShell: ApplicationShell;
    isEnabled(): boolean;
}
