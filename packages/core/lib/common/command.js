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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, named } from 'inversify';
import { Emitter, WaitUntilEvent } from './emitter';
import { Disposable, DisposableCollection } from './disposable';
import { ContributionProvider } from './contribution-provider';
import { nls } from './nls';
export var Command;
(function (Command) {
    /* Determine whether object is a Command */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && arg === Object(arg) && 'id' in arg;
    }
    Command.is = is;
    /** Utility function to easily translate commands */
    function toLocalizedCommand(command, nlsLabelKey = command.id, nlsCategoryKey) {
        return {
            ...command,
            label: command.label && nls.localize(nlsLabelKey, command.label),
            originalLabel: command.label,
            category: nlsCategoryKey && command.category && nls.localize(nlsCategoryKey, command.category) || command.category,
            originalCategory: command.category,
        };
    }
    Command.toLocalizedCommand = toLocalizedCommand;
    function toDefaultLocalizedCommand(command) {
        return {
            ...command,
            label: command.label && nls.localizeByDefault(command.label),
            originalLabel: command.label,
            category: command.category && nls.localizeByDefault(command.category),
            originalCategory: command.category,
        };
    }
    Command.toDefaultLocalizedCommand = toDefaultLocalizedCommand;
    /** Comparator function for when sorting commands */
    function compareCommands(a, b) {
        if (a.label && b.label) {
            const aCommand = (a.category ? `${a.category}: ${a.label}` : a.label).toLowerCase();
            const bCommand = (b.category ? `${b.category}: ${b.label}` : b.label).toLowerCase();
            return (aCommand).localeCompare(bCommand);
        }
        else {
            return 0;
        }
    }
    Command.compareCommands = compareCommands;
    /**
     * Determine if two commands are equal.
     *
     * @param a the first command for comparison.
     * @param b the second command for comparison.
     */
    function equals(a, b) {
        return (a.id === b.id &&
            a.label === b.label &&
            a.iconClass === b.iconClass &&
            a.category === b.category);
    }
    Command.equals = equals;
})(Command || (Command = {}));
export const CommandContribution = Symbol('CommandContribution');
export const commandServicePath = '/services/commands';
export const CommandService = Symbol('CommandService');
/**
 * The command registry manages commands and handlers.
 */
let CommandRegistry = class CommandRegistry {
    contributionProvider;
    _commands = {};
    _handlers = {};
    toUnregisterCommands = new Map();
    onWillExecuteCommandEmitter = new Emitter();
    onWillExecuteCommand = this.onWillExecuteCommandEmitter.event;
    onDidExecuteCommandEmitter = new Emitter();
    onDidExecuteCommand = this.onDidExecuteCommandEmitter.event;
    constructor(contributionProvider) {
        this.contributionProvider = contributionProvider;
    }
    // List of recently used commands.
    _recent = [];
    /**
     * Get the list of recently used commands.
     */
    get recent() {
        return this._recent;
    }
    /**
     * Set the list of recently used commands.
     * @param commands the list of recently used commands.
     */
    set recent(commands) {
        this._recent = commands;
    }
    /**
     * Get all registered commands.
     */
    get commands() {
        const commands = [];
        for (const id of this.commandIds) {
            const cmd = this.getCommand(id);
            if (cmd) {
                commands.push(cmd);
            }
        }
        return commands;
    }
    /**
     * Get all registered commands identifiers.
     */
    get commandIds() {
        return Object.keys(this._commands);
    }
    onStart() {
        const contributions = this.contributionProvider.getContributions();
        for (const contrib of contributions) {
            contrib.registerCommands(this);
        }
    }
    /**
     * Register the given command and handler if present.
     *
     * Throw if a command is already registered for the given command identifier.
     */
    registerCommand(command, handler) {
        if (this._commands[command.id]) {
            console.warn(`A command ${command.id} is already registered.`);
            return Disposable.NULL;
        }
        const toDispose = new DisposableCollection(this.doRegisterCommand(command));
        if (handler) {
            toDispose.push(this.registerHandler(command.id, handler));
        }
        this.toUnregisterCommands.set(command.id, toDispose);
        toDispose.push(Disposable.create(() => this.toUnregisterCommands.delete(command.id)));
        return toDispose;
    }
    unregisterCommand(commandOrId) {
        const id = Command.is(commandOrId) ? commandOrId.id : commandOrId;
        const toUnregister = this.toUnregisterCommands.get(id);
        if (toUnregister) {
            toUnregister.dispose();
        }
    }
    /**
     * Register the given handler for the given command identifier.
     *
     * If there is already a handler for the given command
     * then the given handler is registered as more specific, and
     * has higher priority during enablement, visibility and toggle state evaluations.
     */
    registerHandler(commandId, handler) {
        let handlers = this._handlers[commandId];
        if (!handlers) {
            this._handlers[commandId] = handlers = [];
        }
        handlers.unshift(handler);
        return {
            dispose: () => {
                const idx = handlers.indexOf(handler);
                if (idx >= 0) {
                    handlers.splice(idx, 1);
                }
            }
        };
    }
    /**
     * Test whether there is an active handler for the given command.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isEnabled(command, ...args) {
        return typeof this.getActiveHandler(command, ...args) !== 'undefined';
    }
    /**
     * Test whether there is a visible handler for the given command.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isVisible(command, ...args) {
        return typeof this.getVisibleHandler(command, ...args) !== 'undefined';
    }
    /**
     * Test whether there is a toggled handler for the given command.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isToggled(command, ...args) {
        return typeof this.getToggledHandler(command, ...args) !== 'undefined';
    }
    /**
     * Execute the active handler for the given command and arguments.
     *
     * Reject if a command cannot be executed.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeCommand(commandId, ...args) {
        const handler = this.getActiveHandler(commandId, ...args);
        if (handler) {
            await this.fireWillExecuteCommand(commandId, args);
            const result = await handler.execute(...args);
            this.onDidExecuteCommandEmitter.fire({ commandId, args });
            return result;
        }
        throw Object.assign(new Error(`The command '${commandId}' cannot be executed. There are no active handlers available for the command.`), { code: 'NO_ACTIVE_HANDLER' });
    }
    /**
     * Get a visible handler for the given command or `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getVisibleHandler(commandId, ...args) {
        const handlers = this._handlers[commandId];
        if (handlers) {
            for (const handler of handlers) {
                try {
                    if (!handler.isVisible || handler.isVisible(...args)) {
                        return handler;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return undefined;
    }
    /**
     * Get an active handler for the given command or `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getActiveHandler(commandId, ...args) {
        const handlers = this._handlers[commandId];
        if (handlers) {
            for (const handler of handlers) {
                try {
                    if (!handler.isEnabled || handler.isEnabled(...args)) {
                        return handler;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return undefined;
    }
    /**
     * Get a toggled handler for the given command or `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getToggledHandler(commandId, ...args) {
        const handlers = this._handlers[commandId];
        if (handlers) {
            for (const handler of handlers) {
                try {
                    if (handler.isToggled && handler.isToggled(...args)) {
                        return handler;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        return undefined;
    }
    /**
     * Returns with all handlers for the given command. If the command does not have any handlers,
     * or the command is not registered, returns an empty array.
     */
    getAllHandlers(commandId) {
        const handlers = this._handlers[commandId];
        return handlers ? handlers.slice() : [];
    }
    /**
     * Get a command for the given command identifier.
     */
    getCommand(id) {
        return this._commands[id];
    }
    /**
     * Adds a command to recently used list.
     * Prioritizes commands that were recently executed to be most recent.
     *
     * @param recent a recent command, or array of recent commands.
     */
    addRecentCommand(recent) {
        if (Array.isArray(recent)) {
            recent.forEach((command) => this.addRecentCommand(command));
        }
        else {
            // Determine if the command currently exists in the recently used list.
            const index = this._recent.findIndex((command) => Command.equals(recent, command));
            // If the command exists, remove it from the array so it can later be placed at the top.
            if (index >= 0) {
                this._recent.splice(index, 1);
            }
            // Add the recent command to the beginning of the array (most recent).
            this._recent.unshift(recent);
        }
    }
    /**
     * Clear the list of recently used commands.
     */
    clearCommandHistory() {
        this.recent = [];
    }
    doRegisterCommand(command) {
        this._commands[command.id] = command;
        return {
            dispose: () => {
                delete this._commands[command.id];
            }
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async fireWillExecuteCommand(commandId, args = []) {
        await WaitUntilEvent.fire(this.onWillExecuteCommandEmitter, { commandId, args }, 30000);
    }
};
CommandRegistry = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(CommandContribution))
], CommandRegistry);
export { CommandRegistry };

//# sourceMappingURL=../../lib/common/command.js.map
