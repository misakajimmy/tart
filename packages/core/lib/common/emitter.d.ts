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
import { Disposable } from './disposable';
import { MaybePromise } from './types';
import { CancellationToken } from './cancellation';
declare type Callback = (...args: any[]) => any;
declare class CallbackList implements Iterable<Callback> {
    private _callbacks;
    private _contexts;
    get length(): number;
    add(callback: Function, context?: any, bucket?: Disposable[]): void;
    remove(callback: Function, context?: any): void;
    [Symbol.iterator](): IterableIterator<any>;
    invoke(...args: any[]): any[];
    isEmpty(): boolean;
    dispose(): void;
}
export interface EmitterOptions {
    onFirstListenerAdd?: Function;
    onLastListenerRemove?: Function;
}
export declare class Emitter<T = any> {
    private _options?;
    private static LEAK_WARNING_THRESHHOLD;
    protected _callbacks: CallbackList | undefined;
    private _disposed;
    private _leakingStacks;
    private _leakWarnCountdown;
    constructor(_options?: EmitterOptions);
    private _event;
    /**
     * For the public to allow to subscribe
     * to events from this Emitter
     */
    get event(): Event<T>;
    private static _noop;
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    fire(event: T): any;
    /**
     * Process each listener one by one.
     * Return `false` to stop iterating over the listeners, `true` to continue.
     */
    sequence(processor: (listener: (e: T) => any) => MaybePromise<boolean>): Promise<void>;
    dispose(): void;
    protected checkMaxListeners(maxListeners: number): (() => void) | undefined;
    protected pushLeakingStack(): () => void;
    protected popLeakingStack(stack: string): void;
}
export interface WaitUntilEvent {
    /**
     * Allows to pause the event loop until the provided thenable resolved.
     *
     * *Note:* It can only be called during event dispatch and not in an asynchronous manner
     *
     * @param thenable A thenable that delays execution.
     */
    waitUntil(thenable: Promise<any>): void;
}
export declare namespace WaitUntilEvent {
    /**
     * Fire all listeners in the same tick.
     *
     * Use `AsyncEmitter.fire` to fire listeners async one after another.
     */
    function fire<T extends WaitUntilEvent>(emitter: Emitter<T>, event: Omit<T, 'waitUntil'>, timeout?: number | undefined): Promise<void>;
}
export declare class AsyncEmitter<T extends WaitUntilEvent> extends Emitter<T> {
    protected deliveryQueue: Promise<void> | undefined;
    /**
     * Fire listeners async one after another.
     */
    fire(event: Omit<T, 'waitUntil'>, token?: CancellationToken, promiseJoin?: (p: Promise<any>, listener: Function) => Promise<any>): Promise<void>;
    protected deliver(listeners: Callback[], event: Omit<T, 'waitUntil'>, token: CancellationToken, promiseJoin?: (p: Promise<any>, listener: Function) => Promise<any>): Promise<void>;
}
export {};
