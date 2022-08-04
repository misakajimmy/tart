/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Emitter, Event } from '../common';
import { Command, CommandRegistry } from '../common/command';
import { Disposable } from '../common/disposable';
import { Key, KeyCode, KeySequence } from './keyboard/keys';
import { KeyboardLayoutService } from './keyboard/keyboard-layout-service';
import { ContributionProvider } from '../common/contribution-provider';
import { StatusBar } from './status-bar/status-bar';
import { ContextKeyService } from './context-key-service';
import * as common from '../common/keybinding';
export declare enum KeybindingScope {
    DEFAULT = 0,
    USER = 1,
    WORKSPACE = 2,
    END = 3
}
export declare namespace KeybindingScope {
    const length: number;
}
/**
 * @deprecated import from `@tart/core/lib/common/keybinding` instead
 */
export declare type Keybinding = common.Keybinding;
export declare const Keybinding: typeof common.Keybinding;
export interface ResolvedKeybinding extends common.Keybinding {
    /**
     * The KeyboardLayoutService may transform the `keybinding` depending on the
     * user's keyboard layout. This property holds the transformed keybinding that
     * should be used in the UI. The value is undefined if the KeyboardLayoutService
     * has not been called yet to resolve the keybinding.
     */
    resolved?: KeyCode[];
}
export interface ScopedKeybinding extends common.Keybinding {
    /** Current keybinding scope */
    scope: KeybindingScope;
}
export declare const KeybindingContribution: unique symbol;
/**
 * Allows extensions to contribute {@link common.Keybinding}s
 */
export interface KeybindingContribution {
    /**
     * Registers keybindings.
     * @param keybindings the keybinding registry.
     */
    registerKeybindings(keybindings: KeybindingRegistry): void;
}
export declare const KeybindingContext: unique symbol;
export interface KeybindingContext {
    /**
     * The unique ID of the current context.
     */
    readonly id: string;
    isEnabled(arg: common.Keybinding): boolean;
}
export declare namespace KeybindingContexts {
    const NOOP_CONTEXT: KeybindingContext;
    const DEFAULT_CONTEXT: KeybindingContext;
}
export declare class KeybindingRegistry {
    static readonly PASSTHROUGH_PSEUDO_COMMAND = "passthrough";
    protected keySequence: KeySequence;
    protected readonly contexts: {
        [id: string]: KeybindingContext;
    };
    protected readonly keymaps: ScopedKeybinding[][];
    protected readonly keyboardLayoutService: KeyboardLayoutService;
    protected readonly contextProvider: ContributionProvider<KeybindingContext>;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly contributions: ContributionProvider<KeybindingContribution>;
    protected readonly statusBar: StatusBar;
    protected readonly whenContextService: ContextKeyService;
    protected keybindingsChanged: Emitter<void>;
    protected readonly toResetKeymap: Map<KeybindingScope, Disposable>;
    /**
     * Event that is fired when the resolved keybindings change due to a different keyboard layout
     * or when a new keymap is being set
     */
    get onKeybindingsChanged(): Event<void>;
    onStart(): Promise<void>;
    /**
     * Register a default keybinding to the registry.
     *
     * Keybindings registered later have higher priority during evaluation.
     *
     * @param binding the keybinding to be registered
     */
    registerKeybinding(binding: common.Keybinding): Disposable;
    /**
     * Register multiple default keybindings to the registry
     *
     * @param bindings An array of keybinding to be registered
     */
    registerKeybindings(...bindings: common.Keybinding[]): Disposable;
    /**
     * Unregister all keybindings from the registry that are bound to the key of the given keybinding
     *
     * @param binding a keybinding specifying the key to be unregistered
     */
    unregisterKeybinding(binding: common.Keybinding): void;
    /**
     * Unregister all keybindings with the given key from the registry
     *
     * @param key a key to be unregistered
     */
    unregisterKeybinding(key: string): void;
    /**
     * Unregister all existing keybindings for the given command
     * @param command the command to unregister all keybindings for
     */
    unregisterKeybinding(command: Command): void;
    /**
     * Ensure that the `resolved` property of the given binding is set by calling the KeyboardLayoutService.
     */
    resolveKeybinding(binding: ResolvedKeybinding): KeyCode[];
    /**
     * Checks whether a colliding {@link common.Keybinding} exists in a specific scope.
     * @param binding the keybinding to check
     * @param scope the keybinding scope to check
     * @returns true if there is a colliding keybinding
     */
    containsKeybindingInScope(binding: common.Keybinding, scope?: KeybindingScope): boolean;
    /**
     * Get a user visible representation of a {@link common.Keybinding}.
     * @returns an array of strings representing all elements of the {@link KeySequence} defined by the {@link common.Keybinding}
     * @param keybinding the keybinding
     * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
     */
    acceleratorFor(keybinding: common.Keybinding, separator?: string): string[];
    /**
     * Get a user visible representation of a {@link KeySequence}.
     * @returns an array of strings representing all elements of the {@link KeySequence}
     * @param keySequence the keysequence
     * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
     */
    acceleratorForSequence(keySequence: KeySequence, separator?: string): string[];
    /**
     * Get a user visible representation of a key code (a key with modifiers).
     * @returns a string representing the {@link KeyCode}
     * @param keyCode the keycode
     * @param separator the separator used to separate keys (key and modifiers) in the returning string
     */
    acceleratorForKeyCode(keyCode: KeyCode, separator?: string): string;
    /**
     * Return a user visible representation of a single key.
     */
    acceleratorForKey(key: Key): string;
    /**
     * Get all keybindings associated to a commandId.
     *
     * @param commandId The ID of the command for which we are looking for keybindings.
     * @returns an array of {@link ScopedKeybinding}
     */
    getKeybindingsForCommand(commandId: string): ScopedKeybinding[];
    dispatchCommand(id: string, target?: EventTarget): void;
    dispatchKeyDown(input: KeyboardEventInit | KeyCode | string, target?: EventTarget): void;
    /**
     * Run the command matching to the given keyboard event.
     */
    run(event: KeyboardEvent): void;
    /**
     * Match first binding in the current context.
     * Keybindings ordered by a scope and by a registration order within the scope.
     *
     * FIXME:
     * This method should run very fast since it happens on each keystroke. We should reconsider how keybindings are stored.
     * It should be possible to look up full and partial keybinding for given key sequence for constant time using some kind of tree.
     * Such tree should not contain disabled keybindings and be invalidated whenever the registry is changed.
     */
    matchKeybinding(keySequence: KeySequence, event?: KeyboardEvent): KeybindingRegistry.Match;
    /**
     * Return true of string a pseudo-command id, in other words a command id
     * that has a special meaning and that we won't find in the command
     * registry.
     *
     * @param commandId commandId to test
     */
    isPseudoCommand(commandId: string): boolean;
    /**
     * Sets a new keymap replacing all existing {@link common.Keybinding}s in the given scope.
     * @param scope the keybinding scope
     * @param bindings an array containing the new {@link common.Keybinding}s
     */
    setKeymap(scope: KeybindingScope, bindings: common.Keybinding[]): void;
    /**
     * Reset keybindings for a specific scope
     * @param scope scope to reset the keybindings for
     */
    resetKeybindingsForScope(scope: KeybindingScope): void;
    /**
     * Reset keybindings for all scopes(only leaves the default keybindings mapped)
     */
    resetKeybindings(): void;
    /**
     * Get all {@link common.Keybinding}s for a {@link KeybindingScope}.
     * @returns an array of {@link common.ScopedKeybinding}
     * @param scope the keybinding scope to retrieve the {@link common.Keybinding}s for.
     */
    getKeybindingsByScope(scope: KeybindingScope): ScopedKeybinding[];
    /**
     * Registers the keybinding context arguments into the application. Fails when an already registered
     * context is being registered.
     *
     * @param contexts the keybinding contexts to register into the application.
     */
    protected registerContext(...contexts: KeybindingContext[]): void;
    protected doRegisterKeybindings(bindings: common.Keybinding[], scope?: KeybindingScope): Disposable;
    protected doRegisterKeybinding(binding: common.Keybinding, scope?: KeybindingScope): Disposable;
    /**
     * Ensures that keybindings are inserted in order of increasing length of binding to ensure that if a
     * user triggers a short keybinding (e.g. ctrl+k), the UI won't wait for a longer one (e.g. ctrl+k enter)
     */
    protected insertBindingIntoScope(item: common.Keybinding & {
        scope: KeybindingScope;
    }, scope: KeybindingScope): void;
    /**
     * Clear all `resolved` properties of registered keybindings so the KeyboardLayoutService is called
     * again to resolve them. This is necessary when the user's keyboard layout has changed.
     */
    protected clearResolvedKeybindings(): void;
    /**
     * Finds collisions for a key sequence inside a list of bindings (error-free)
     *
     * @param bindings the reference bindings
     * @param candidate the sequence to match
     */
    protected getKeySequenceCollisions(bindings: ScopedKeybinding[], candidate: KeySequence): KeybindingRegistry.KeybindingsResult;
    protected isActive(binding: common.Keybinding): boolean;
    /**
     * Tries to execute a keybinding.
     *
     * @param binding to execute
     * @param event keyboard event.
     */
    protected executeKeyBinding(binding: common.Keybinding, event: KeyboardEvent): void;
    /**
     * Only execute if it has no context (global context) or if we're in that context.
     */
    protected isEnabled(binding: common.Keybinding, event: KeyboardEvent): boolean;
    protected asKeyboardEventInit(input: KeyboardEventInit | KeyCode | string): KeyboardEventInit & Partial<{
        keyCode: number;
    }>;
    /**
     * Returns true if the binding is usable
     * @param binding Binding to be checked
     */
    protected isUsable(binding: common.Keybinding): boolean;
    /**
     * Return a new filtered array containing only the usable bindings among the input bindings
     * @param bindings Bindings to filter
     */
    protected getUsableBindings<T extends common.Keybinding>(bindings: T[]): T[];
}
export declare namespace KeybindingRegistry {
    type Match = {
        kind: 'full' | 'partial';
        binding: ScopedKeybinding;
    } | undefined;
    class KeybindingsResult {
        full: ScopedKeybinding[];
        partial: ScopedKeybinding[];
        shadow: ScopedKeybinding[];
        /**
         * Merge two results together inside `this`
         *
         * @param other the other KeybindingsResult to merge with
         * @return this
         */
        merge(other: KeybindingsResult): KeybindingsResult;
        /**
         * Returns a new filtered KeybindingsResult
         *
         * @param fn callback filter on the results
         * @return filtered new result
         */
        filter(fn: (binding: common.Keybinding) => boolean): KeybindingsResult;
    }
}
