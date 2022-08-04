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
import { MessageClient, MessageOptions, MessageType, Progress, ProgressMessage } from './message-service-protocol';
export declare const MessageServiceFactory: unique symbol;
/**
 * Service to log and categorize messages, show progress information and offer actions.
 *
 * The messages are processed by this service and forwarded to an injected {@link MessageClient}.
 * For example "@tart/messages" provides such a client, rendering messages as notifications
 * in the frontend.
 *
 * ### Example usage
 *
 * ```typescript
 *   @inject(MessageService)
 *   protected readonly messageService: MessageService;
 *
 *   messageService.warn("Typings not available");
 *
 *   messageService.error("Could not restore state", ["Rollback", "Ignore"])
 *   .then(action => action === "Rollback" && rollback());
 * ```
 */
export declare class MessageService {
    protected readonly client: MessageClient;
    private progressIdPrefix;
    private counter;
    constructor(client: MessageClient);
    /**
     * Logs the message and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    log<T extends string>(message: string, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param options additional options. Can be omitted
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    log<T extends string>(message: string, options?: MessageOptions, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "info" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    info<T extends string>(message: string, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "info" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param options additional options. Can be omitted
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    info<T extends string>(message: string, options?: MessageOptions, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "warning" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    warn<T extends string>(message: string, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "warning" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param options additional options. Can be omitted
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    warn<T extends string>(message: string, options?: MessageOptions, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "error" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    error<T extends string>(message: string, ...actions: T[]): Promise<T | undefined>;
    /**
     * Logs the message as "error" and, if given, offers actions to act on it.
     * @param message the message to log.
     * @param options additional options. Can be omitted
     * @param actions the actions to offer. Can be omitted.
     *
     * @returns the selected action if there is any, `undefined` when there was no action or none was selected.
     */
    error<T extends string>(message: string, options?: MessageOptions, ...actions: T[]): Promise<T | undefined>;
    /**
     * Shows the given message as a progress.
     *
     * @param message the message to show for the progress.
     * @param onDidCancel an optional callback which will be invoked if the progress indicator was canceled.
     *
     * @returns a promise resolving to a {@link Progress} object with which the progress can be updated.
     *
     * ### Example usage
     *
     * ```typescript
     *   @inject(MessageService)
     *   protected readonly messageService: MessageService;
     *
     *   // this will show "Progress" as a cancelable message
     *   this.messageService.showProgress({text: 'Progress'});
     *
     *   // this will show "Rolling back" with "Cancel" and an additional "Skip" action
     *   this.messageService.showProgress({
     *     text: `Rolling back`,
     *     actions: ["Skip"],
     *   },
     *   () => console.log("canceled"))
     *   .then((progress) => {
     *     // register if interested in the result (only necessary for custom actions)
     *     progress.result.then((result) => {
     *       // will be 'Cancel', 'Skip' or `undefined`
     *       console.log("result is", result);
     *     });
     *     progress.report({message: "Cleaning references", work: {done: 10, total: 100}});
     *     progress.report({message: "Restoring previous state", work: {done: 80, total: 100}});
     *     progress.report({message: "Complete", work: {done: 100, total: 100}});
     *     // we are done so we can cancel the progress message, note that this will also invoke `onDidCancel`
     *     progress.cancel();
     *   });
     * ```
     */
    showProgress(message: ProgressMessage, onDidCancel?: () => void): Promise<Progress>;
    protected processMessage(type: MessageType, text: string, args?: any[]): Promise<string | undefined>;
    protected newProgressId(): string;
}
