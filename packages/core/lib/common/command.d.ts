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
import { Event } from './event';
import { Emitter, WaitUntilEvent } from './emitter';
import { Disposable } from './disposable';
import { ContributionProvider } from './contribution-provider';
/**
 * A command is a unique identifier of a function
 * which can be executed by a user via a keyboard shortcut,
 * a menu action or directly.
 */
export interface Command {
    /**
     * A unique identifier of this command.
     */
    id: string;
    /**
     * A label of this command.
     */
    label?: string;
    originalLabel?: string;
    /**
     * An icon class of this command.
     */
    iconClass?: string;
    /**
     * A category of this command.
     */
    category?: string;
    originalCategory?: string;
}
export declare namespace Command {
    function is(arg: Command | any): arg is Command;
    /** Utility function to easily translate commands */
    function toLocalizedCommand(command: Command, nlsLabelKey?: string, nlsCategoryKey?: string): Command;
    function toDefaultLocalizedCommand(command: Command): Command;
    /** Comparator function for when sorting commands */
    function compareCommands(a: Command, b: Command): number;
    /**
     * Determine if two commands are equal.
     *
     * @param a the first command for comparison.
     * @param b the second command for comparison.
     */
    function equals(a: Command, b: Command): boolean;
}
/**
 * A command handler is an implementation of a command.
 *
 * A command can have multiple handlers
 * but they should be active in different contexts,
 * otherwise first active will be executed.
 */
export interface CommandHandler {
    /**
     * Execute this handler.
     *
     * Don't call it directly, use `CommandService.executeCommand` instead.
     */
    execute(...args: any[]): any;
    /**
     * Test whether this handler is enabled (active).
     */
    isEnabled?(...args: any[]): boolean;
    /**
     * Test whether menu items for this handler should be visible.
     */
    isVisible?(...args: any[]): boolean;
    /**
     * Test whether menu items for this handler should be toggled.
     */
    isToggled?(...args: any[]): boolean;
}
export declare const CommandContribution: unique symbol;
/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export interface CommandContribution {
    /**
     * Register commands and handlers.
     */
    registerCommands(commands: CommandRegistry): void;
}
export interface CommandEvent {
    commandId: string;
    args: any[];
}
export interface WillExecuteCommandEvent extends WaitUntilEvent, CommandEvent {
}
export declare const commandServicePath = "/services/commands";
export declare const CommandService: unique symbol;
/**
 * The command service should be used to execute commands.
 */
export interface CommandService {
    /**
     * An event is emitted when a command is about to be executed.
     *
     * It can be used to install or activate a command handler.
     */
    readonly onWillExecuteCommand: Event<WillExecuteCommandEvent>;
    /**
     * An event is emitted when a command was executed.
     */
    readonly onDidExecuteCommand: Event<CommandEvent>;
    /**
     * Execute the active handler for the given command and arguments.
     *
     * Reject if a command cannot be executed.
     */
    executeCommand<T>(command: string, ...args: any[]): Promise<T | undefined>;
}
/**
 * The command registry manages commands and handlers.
 */
export declare class CommandRegistry implements CommandService {
    protected readonly contributionProvider: ContributionProvider<CommandContribution>;
    protected readonly _commands: {
        [id: string]: Command;
    };
    protected readonly _handlers: {
        [id: string]: CommandHandler[];
    };
    protected readonly toUnregisterCommands: Map<string, Disposable>;
    protected readonly onWillExecuteCommandEmitter: Emitter<WillExecuteCommandEvent>;
    readonly onWillExecuteCommand: Event<WillExecuteCommandEvent>;
    protected readonly onDidExecuteCommandEmitter: Emitter<CommandEvent>;
    readonly onDidExecuteCommand: Event<CommandEvent>;
    constructor(contributionProvider: ContributionProvider<CommandContribution>);
    protected _recent: Command[];
    /**
     * Get the list of recently used commands.
     */
    get recent(): Command[];
    /**
     * Set the list of recently used commands.
     * @param commands the list of recently used commands.
     */
    set recent(commands: Command[]);
    /**
     * Get all registered commands.
     */
    get commands(): Command[];
    /**
     * Get all registered commands identifiers.
     */
    get commandIds(): string[];
    onStart(): void;
    /**
     * Register the given command and handler if present.
     *
     * Throw if a command is already registered for the given command identifier.
     */
    registerCommand(command: Command, handler?: CommandHandler): Disposable;
    /**
     * Unregister command from the registry
     *
     * @param command
     */
    unregisterCommand(command: Command): void;
    /**
     * Unregister command from the registry
     *
     * @param id
     */
    unregisterCommand(id: string): void;
    /**
     * Register the given handler for the given command identifier.
     *
     * If there is already a handler for the given command
     * then the given handler is registered as more specific, and
     * has higher priority during enablement, visibility and toggle state evaluations.
     */
    registerHandler(commandId: string, handler: CommandHandler): Disposable;
    /**
     * Test whether there is an active handler for the given command.
     */
    isEnabled(command: string, ...args: any[]): boolean;
    /**
     * Test whether there is a visible handler for the given command.
     */
    isVisible(command: string, ...args: any[]): boolean;
    /**
     * Test whether there is a toggled handler for the given command.
     */
    isToggled(command: string, ...args: any[]): boolean;
    /**
     * Execute the active handler for the given command and arguments.
     *
     * Reject if a command cannot be executed.
     */
    executeCommand<T>(commandId: string, ...args: any[]): Promise<T | undefined>;
    /**
     * Get a visible handler for the given command or `undefined`.
     */
    getVisibleHandler(commandId: string, ...args: any[]): CommandHandler | undefined;
    /**
     * Get an active handler for the given command or `undefined`.
     */
    getActiveHandler(commandId: string, ...args: any[]): CommandHandler | undefined;
    /**
     * Get a toggled handler for the given command or `undefined`.
     */
    getToggledHandler(commandId: string, ...args: any[]): CommandHandler | undefined;
    /**
     * Returns with all handlers for the given command. If the command does not have any handlers,
     * or the command is not registered, returns an empty array.
     */
    getAllHandlers(commandId: string): CommandHandler[];
    /**
     * Get a command for the given command identifier.
     */
    getCommand(id: string): Command | undefined;
    /**
     * Adds a command to recently used list.
     * Prioritizes commands that were recently executed to be most recent.
     *
     * @param recent a recent command, or array of recent commands.
     */
    addRecentCommand(recent: Command | Command[]): void;
    /**
     * Clear the list of recently used commands.
     */
    clearCommandHistory(): void;
    protected doRegisterCommand(command: Command): Disposable;
    protected fireWillExecuteCommand(commandId: string, args?: any[]): Promise<void>;
}
