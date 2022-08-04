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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KeybindingRegistry_1;
import { inject, injectable, named } from 'inversify';
import { isOSX } from '../common/os';
import { Emitter } from '../common';
import { Command, CommandRegistry } from '../common/command';
import { Disposable, DisposableCollection } from '../common/disposable';
import { Key, KeyCode, KeySequence } from './keyboard/keys';
import { KeyboardLayoutService } from './keyboard/keyboard-layout-service';
import { ContributionProvider } from '../common/contribution-provider';
import { StatusBar, StatusBarAlignment } from './status-bar/status-bar';
import { ContextKeyService } from './context-key-service';
import * as common from '../common/keybinding';
export var KeybindingScope;
(function (KeybindingScope) {
    KeybindingScope[KeybindingScope["DEFAULT"] = 0] = "DEFAULT";
    KeybindingScope[KeybindingScope["USER"] = 1] = "USER";
    KeybindingScope[KeybindingScope["WORKSPACE"] = 2] = "WORKSPACE";
    KeybindingScope[KeybindingScope["END"] = 3] = "END";
})(KeybindingScope || (KeybindingScope = {}));
(function (KeybindingScope) {
    KeybindingScope.length = KeybindingScope.END - KeybindingScope.DEFAULT;
})(KeybindingScope || (KeybindingScope = {}));
export const Keybinding = common.Keybinding;
export const KeybindingContribution = Symbol('KeybindingContribution');
export const KeybindingContext = Symbol('KeybindingContext');
export var KeybindingContexts;
(function (KeybindingContexts) {
    KeybindingContexts.NOOP_CONTEXT = {
        id: 'noop.keybinding.context',
        isEnabled: () => true
    };
    KeybindingContexts.DEFAULT_CONTEXT = {
        id: 'default.keybinding.context',
        isEnabled: () => false
    };
})(KeybindingContexts || (KeybindingContexts = {}));
let KeybindingRegistry = KeybindingRegistry_1 = class KeybindingRegistry {
    static PASSTHROUGH_PSEUDO_COMMAND = 'passthrough';
    keySequence = [];
    contexts = {};
    keymaps = [...Array(KeybindingScope.length)].map(() => []);
    keyboardLayoutService;
    contextProvider;
    commandRegistry;
    contributions;
    statusBar;
    whenContextService;
    keybindingsChanged = new Emitter();
    toResetKeymap = new Map();
    /**
     * Event that is fired when the resolved keybindings change due to a different keyboard layout
     * or when a new keymap is being set
     */
    get onKeybindingsChanged() {
        return this.keybindingsChanged.event;
    }
    async onStart() {
        await this.keyboardLayoutService.initialize();
        this.keyboardLayoutService.onKeyboardLayoutChanged(newLayout => {
            this.clearResolvedKeybindings();
            this.keybindingsChanged.fire(undefined);
        });
        this.registerContext(KeybindingContexts.NOOP_CONTEXT);
        this.registerContext(KeybindingContexts.DEFAULT_CONTEXT);
        this.registerContext(...this.contextProvider.getContributions());
        for (const contribution of this.contributions.getContributions()) {
            contribution.registerKeybindings(this);
        }
    }
    /**
     * Register a default keybinding to the registry.
     *
     * Keybindings registered later have higher priority during evaluation.
     *
     * @param binding the keybinding to be registered
     */
    registerKeybinding(binding) {
        return this.doRegisterKeybinding(binding);
    }
    /**
     * Register multiple default keybindings to the registry
     *
     * @param bindings An array of keybinding to be registered
     */
    registerKeybindings(...bindings) {
        return this.doRegisterKeybindings(bindings, KeybindingScope.DEFAULT);
    }
    unregisterKeybinding(arg) {
        const keymap = this.keymaps[KeybindingScope.DEFAULT];
        const filter = Command.is(arg)
            ? ({ command }) => command === arg.id
            : ({ keybinding }) => Keybinding.is(arg)
                ? keybinding === arg.keybinding
                : keybinding === arg;
        for (const binding of keymap.filter(filter)) {
            const idx = keymap.indexOf(binding);
            if (idx !== -1) {
                keymap.splice(idx, 1);
            }
        }
    }
    /**
     * Ensure that the `resolved` property of the given binding is set by calling the KeyboardLayoutService.
     */
    resolveKeybinding(binding) {
        if (!binding.resolved) {
            const sequence = KeySequence.parse(binding.keybinding);
            binding.resolved = sequence.map(code => this.keyboardLayoutService.resolveKeyCode(code));
        }
        return binding.resolved;
    }
    /**
     * Checks whether a colliding {@link common.Keybinding} exists in a specific scope.
     * @param binding the keybinding to check
     * @param scope the keybinding scope to check
     * @returns true if there is a colliding keybinding
     */
    containsKeybindingInScope(binding, scope = KeybindingScope.USER) {
        const bindingKeySequence = this.resolveKeybinding(binding);
        const collisions = this.getKeySequenceCollisions(this.getUsableBindings(this.keymaps[scope]), bindingKeySequence)
            .filter(b => b.context === binding.context && !b.when && !binding.when);
        if (collisions.full.length > 0) {
            return true;
        }
        if (collisions.partial.length > 0) {
            return true;
        }
        if (collisions.shadow.length > 0) {
            return true;
        }
        return false;
    }
    /**
     * Get a user visible representation of a {@link common.Keybinding}.
     * @returns an array of strings representing all elements of the {@link KeySequence} defined by the {@link common.Keybinding}
     * @param keybinding the keybinding
     * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
     */
    acceleratorFor(keybinding, separator = ' ') {
        const bindingKeySequence = this.resolveKeybinding(keybinding);
        return this.acceleratorForSequence(bindingKeySequence, separator);
    }
    /**
     * Get a user visible representation of a {@link KeySequence}.
     * @returns an array of strings representing all elements of the {@link KeySequence}
     * @param keySequence the keysequence
     * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
     */
    acceleratorForSequence(keySequence, separator = ' ') {
        return keySequence.map(keyCode => this.acceleratorForKeyCode(keyCode, separator));
    }
    /**
     * Get a user visible representation of a key code (a key with modifiers).
     * @returns a string representing the {@link KeyCode}
     * @param keyCode the keycode
     * @param separator the separator used to separate keys (key and modifiers) in the returning string
     */
    acceleratorForKeyCode(keyCode, separator = ' ') {
        const keyCodeResult = [];
        if (keyCode.meta && isOSX) {
            keyCodeResult.push('Cmd');
        }
        if (keyCode.ctrl) {
            keyCodeResult.push('Ctrl');
        }
        if (keyCode.alt) {
            keyCodeResult.push('Alt');
        }
        if (keyCode.shift) {
            keyCodeResult.push('Shift');
        }
        if (keyCode.key) {
            keyCodeResult.push(this.acceleratorForKey(keyCode.key));
        }
        return keyCodeResult.join(separator);
    }
    /**
     * Return a user visible representation of a single key.
     */
    acceleratorForKey(key) {
        if (isOSX) {
            if (key === Key.ARROW_LEFT) {
                return '←';
            }
            if (key === Key.ARROW_RIGHT) {
                return '→';
            }
            if (key === Key.ARROW_UP) {
                return '↑';
            }
            if (key === Key.ARROW_DOWN) {
                return '↓';
            }
        }
        const keyString = this.keyboardLayoutService.getKeyboardCharacter(key);
        if (key.keyCode >= Key.KEY_A.keyCode && key.keyCode <= Key.KEY_Z.keyCode ||
            key.keyCode >= Key.F1.keyCode && key.keyCode <= Key.F24.keyCode) {
            return keyString.toUpperCase();
        }
        else if (keyString.length > 1) {
            return keyString.charAt(0).toUpperCase() + keyString.slice(1);
        }
        else {
            return keyString;
        }
    }
    /**
     * Get all keybindings associated to a commandId.
     *
     * @param commandId The ID of the command for which we are looking for keybindings.
     * @returns an array of {@link ScopedKeybinding}
     */
    getKeybindingsForCommand(commandId) {
        const result = [];
        for (let scope = KeybindingScope.END - 1; scope >= KeybindingScope.DEFAULT; scope--) {
            this.keymaps[scope].forEach(binding => {
                const command = this.commandRegistry.getCommand(binding.command);
                if (command) {
                    if (command.id === commandId) {
                        result.push({ ...binding, scope });
                    }
                }
            });
            if (result.length > 0) {
                return result;
            }
        }
        return result;
    }
    dispatchCommand(id, target) {
        const keybindings = this.getKeybindingsForCommand(id);
        if (keybindings.length) {
            for (const keyCode of this.resolveKeybinding(keybindings[0])) {
                this.dispatchKeyDown(keyCode, target);
            }
        }
    }
    dispatchKeyDown(input, target = document.activeElement || window) {
        const eventInit = this.asKeyboardEventInit(input);
        const emulatedKeyboardEvent = new KeyboardEvent('keydown', eventInit);
        target.dispatchEvent(emulatedKeyboardEvent);
    }
    /**
     * Run the command matching to the given keyboard event.
     */
    run(event) {
        if (event.defaultPrevented) {
            return;
        }
        const eventDispatch = 'code';
        const keyCode = KeyCode.createKeyCode(event, eventDispatch);
        /* Keycode is only a modifier, next keycode will be modifier + key.
           Ignore this one.  */
        // if (keyCode.isModifierOnly()) {
        //     return;
        // }
        //
        this.keyboardLayoutService.validateKeyCode(keyCode);
        this.keySequence.push(keyCode);
        const match = this.matchKeybinding(this.keySequence, event);
        if (match && match.kind === 'partial') {
            /* Accumulate the keysequence */
            event.preventDefault();
            event.stopPropagation();
            this.statusBar.setElement('keybinding-status', {
                text: `(${this.acceleratorForSequence(this.keySequence, '+')}) was pressed, waiting for more keys`,
                alignment: StatusBarAlignment.LEFT,
                priority: 2
            });
        }
        else {
            if (match && match.kind === 'full') {
                this.executeKeyBinding(match.binding, event);
            }
            this.keySequence = [];
            this.statusBar.removeElement('keybinding-status');
        }
    }
    /**
     * Match first binding in the current context.
     * Keybindings ordered by a scope and by a registration order within the scope.
     *
     * FIXME:
     * This method should run very fast since it happens on each keystroke. We should reconsider how keybindings are stored.
     * It should be possible to look up full and partial keybinding for given key sequence for constant time using some kind of tree.
     * Such tree should not contain disabled keybindings and be invalidated whenever the registry is changed.
     */
    matchKeybinding(keySequence, event) {
        let disabled;
        const isEnabled = (binding) => {
            if (event && !this.isEnabled(binding, event)) {
                return false;
            }
            const { command, context, when, keybinding } = binding;
            if (!this.isUsable(binding)) {
                disabled = disabled || new Set();
                disabled.add(JSON.stringify({ command: command.substr(1), context, when, keybinding }));
                return false;
            }
            return !disabled?.has(JSON.stringify({ command, context, when, keybinding }));
        };
        for (let scope = KeybindingScope.END; --scope >= KeybindingScope.DEFAULT;) {
            for (const binding of this.keymaps[scope]) {
                const resolved = this.resolveKeybinding(binding);
                const compareResult = KeySequence.compare(keySequence, resolved);
                if (compareResult === KeySequence.CompareResult.FULL && isEnabled(binding)) {
                    return { kind: 'full', binding };
                }
                if (compareResult === KeySequence.CompareResult.PARTIAL && isEnabled(binding)) {
                    return { kind: 'partial', binding };
                }
            }
        }
        return undefined;
    }
    /**
     * Return true of string a pseudo-command id, in other words a command id
     * that has a special meaning and that we won't find in the command
     * registry.
     *
     * @param commandId commandId to test
     */
    isPseudoCommand(commandId) {
        return commandId === KeybindingRegistry_1.PASSTHROUGH_PSEUDO_COMMAND;
    }
    /**
     * Sets a new keymap replacing all existing {@link common.Keybinding}s in the given scope.
     * @param scope the keybinding scope
     * @param bindings an array containing the new {@link common.Keybinding}s
     */
    setKeymap(scope, bindings) {
        this.resetKeybindingsForScope(scope);
        this.toResetKeymap.set(scope, this.doRegisterKeybindings(bindings, scope));
        this.keybindingsChanged.fire(undefined);
    }
    /**
     * Reset keybindings for a specific scope
     * @param scope scope to reset the keybindings for
     */
    resetKeybindingsForScope(scope) {
        const toReset = this.toResetKeymap.get(scope);
        if (toReset) {
            toReset.dispose();
        }
    }
    /**
     * Reset keybindings for all scopes(only leaves the default keybindings mapped)
     */
    resetKeybindings() {
        for (let i = KeybindingScope.DEFAULT + 1; i < KeybindingScope.END; i++) {
            this.keymaps[i] = [];
        }
    }
    /**
     * Get all {@link common.Keybinding}s for a {@link KeybindingScope}.
     * @returns an array of {@link common.ScopedKeybinding}
     * @param scope the keybinding scope to retrieve the {@link common.Keybinding}s for.
     */
    getKeybindingsByScope(scope) {
        return this.keymaps[scope];
    }
    /**
     * Registers the keybinding context arguments into the application. Fails when an already registered
     * context is being registered.
     *
     * @param contexts the keybinding contexts to register into the application.
     */
    registerContext(...contexts) {
        for (const context of contexts) {
            const { id } = context;
            if (this.contexts[id]) {
                // this.logger.error(`A keybinding context with ID ${id} is already registered.`);
            }
            else {
                this.contexts[id] = context;
            }
        }
    }
    doRegisterKeybindings(bindings, scope = KeybindingScope.DEFAULT) {
        const toDispose = new DisposableCollection();
        for (const binding of bindings) {
            toDispose.push(this.doRegisterKeybinding(binding, scope));
        }
        return toDispose;
    }
    doRegisterKeybinding(binding, scope = KeybindingScope.DEFAULT) {
        try {
            this.resolveKeybinding(binding);
            const scoped = Object.assign(binding, { scope });
            this.insertBindingIntoScope(scoped, scope);
            return Disposable.create(() => {
                const index = this.keymaps[scope].indexOf(scoped);
                if (index !== -1) {
                    this.keymaps[scope].splice(index, 1);
                }
            });
        }
        catch (error) {
            console.log('Could not register keybinding');
            // this.logger.warn(`Could not register keybinding:\n  ${common.Keybinding.stringify(binding)}\n${error}`);
            return Disposable.NULL;
        }
    }
    /**
     * Ensures that keybindings are inserted in order of increasing length of binding to ensure that if a
     * user triggers a short keybinding (e.g. ctrl+k), the UI won't wait for a longer one (e.g. ctrl+k enter)
     */
    insertBindingIntoScope(item, scope) {
        const scopedKeymap = this.keymaps[scope];
        const getNumberOfKeystrokes = (binding) => (binding.keybinding.trim().match(/\s/g)?.length ?? 0) + 1;
        const numberOfKeystrokesInBinding = getNumberOfKeystrokes(item);
        const indexOfFirstItemWithEqualStrokes = scopedKeymap.findIndex(existingBinding => getNumberOfKeystrokes(existingBinding) === numberOfKeystrokesInBinding);
        if (indexOfFirstItemWithEqualStrokes > -1) {
            scopedKeymap.splice(indexOfFirstItemWithEqualStrokes, 0, item);
        }
        else {
            scopedKeymap.push(item);
        }
    }
    /**
     * Clear all `resolved` properties of registered keybindings so the KeyboardLayoutService is called
     * again to resolve them. This is necessary when the user's keyboard layout has changed.
     */
    clearResolvedKeybindings() {
        for (let i = KeybindingScope.DEFAULT; i < KeybindingScope.END; i++) {
            const bindings = this.keymaps[i];
            for (let j = 0; j < bindings.length; j++) {
                const binding = bindings[j];
                binding.resolved = undefined;
            }
        }
    }
    /**
     * Finds collisions for a key sequence inside a list of bindings (error-free)
     *
     * @param bindings the reference bindings
     * @param candidate the sequence to match
     */
    getKeySequenceCollisions(bindings, candidate) {
        const result = new KeybindingRegistry_1.KeybindingsResult();
        for (const binding of bindings) {
            try {
                const bindingKeySequence = this.resolveKeybinding(binding);
                const compareResult = KeySequence.compare(candidate, bindingKeySequence);
                switch (compareResult) {
                    case KeySequence.CompareResult.FULL: {
                        result.full.push(binding);
                        break;
                    }
                    case KeySequence.CompareResult.PARTIAL: {
                        result.partial.push(binding);
                        break;
                    }
                    case KeySequence.CompareResult.SHADOW: {
                        result.shadow.push(binding);
                        break;
                    }
                }
            }
            catch (error) {
                // this.logger.warn(error);
            }
        }
        return result;
    }
    isActive(binding) {
        /* Pseudo commands like "passthrough" are always active (and not found
           in the command registry).  */
        if (this.isPseudoCommand(binding.command)) {
            return true;
        }
        const command = this.commandRegistry.getCommand(binding.command);
        return !!command && !!this.commandRegistry.getActiveHandler(command.id);
    }
    /**
     * Tries to execute a keybinding.
     *
     * @param binding to execute
     * @param event keyboard event.
     */
    executeKeyBinding(binding, event) {
        if (this.isPseudoCommand(binding.command)) {
            /* Don't do anything, let the event propagate.  */
        }
        else {
            const command = this.commandRegistry.getCommand(binding.command);
            if (command) {
                if (this.commandRegistry.isEnabled(binding.command, binding.args)) {
                    this.commandRegistry.executeCommand(binding.command, binding.args)
                        .catch(e => console.error('Failed to execute command:', e));
                }
                /* Note that if a keybinding is in context but the command is
                   not active we still stop the processing here.  */
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
    /**
     * Only execute if it has no context (global context) or if we're in that context.
     */
    isEnabled(binding, event) {
        const context = binding.context && this.contexts[binding.context];
        if (context && !context.isEnabled(binding)) {
            return false;
        }
        if (binding.when && !this.whenContextService.match(binding.when, event.target)) {
            return false;
        }
        return true;
    }
    asKeyboardEventInit(input) {
        if (typeof input === 'string') {
            return this.asKeyboardEventInit(KeyCode.createKeyCode(input));
        }
        if (input instanceof KeyCode) {
            return {
                metaKey: input.meta,
                shiftKey: input.shift,
                altKey: input.alt,
                ctrlKey: input.ctrl,
                code: input.key && input.key.code,
                key: (input && input.character) || (input.key && input.key.code),
                keyCode: input.key && input.key.keyCode
            };
        }
        return input;
    }
    /**
     * Returns true if the binding is usable
     * @param binding Binding to be checked
     */
    isUsable(binding) {
        return binding.command.charAt(0) !== '-';
    }
    /**
     * Return a new filtered array containing only the usable bindings among the input bindings
     * @param bindings Bindings to filter
     */
    getUsableBindings(bindings) {
        return bindings.filter(binding => this.isUsable(binding));
    }
};
__decorate([
    inject(KeyboardLayoutService)
], KeybindingRegistry.prototype, "keyboardLayoutService", void 0);
__decorate([
    inject(ContributionProvider),
    named(KeybindingContext)
], KeybindingRegistry.prototype, "contextProvider", void 0);
__decorate([
    inject(CommandRegistry)
], KeybindingRegistry.prototype, "commandRegistry", void 0);
__decorate([
    inject(ContributionProvider),
    named(KeybindingContribution)
], KeybindingRegistry.prototype, "contributions", void 0);
__decorate([
    inject(StatusBar)
], KeybindingRegistry.prototype, "statusBar", void 0);
__decorate([
    inject(ContextKeyService)
], KeybindingRegistry.prototype, "whenContextService", void 0);
KeybindingRegistry = KeybindingRegistry_1 = __decorate([
    injectable()
], KeybindingRegistry);
export { KeybindingRegistry };
(function (KeybindingRegistry) {
    class KeybindingsResult {
        full = [];
        partial = [];
        shadow = [];
        /**
         * Merge two results together inside `this`
         *
         * @param other the other KeybindingsResult to merge with
         * @return this
         */
        merge(other) {
            this.full.push(...other.full);
            this.partial.push(...other.partial);
            this.shadow.push(...other.shadow);
            return this;
        }
        /**
         * Returns a new filtered KeybindingsResult
         *
         * @param fn callback filter on the results
         * @return filtered new result
         */
        filter(fn) {
            const result = new KeybindingsResult();
            result.full = this.full.filter(fn);
            result.partial = this.partial.filter(fn);
            result.shadow = this.shadow.filter(fn);
            return result;
        }
    }
    KeybindingRegistry.KeybindingsResult = KeybindingsResult;
})(KeybindingRegistry || (KeybindingRegistry = {}));

//# sourceMappingURL=../../lib/browser/keybinding.js.map
