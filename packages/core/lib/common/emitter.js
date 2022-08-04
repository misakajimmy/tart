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
import { CancellationToken } from './cancellation';
class CallbackList {
    _callbacks;
    _contexts;
    get length() {
        return this._callbacks && this._callbacks.length || 0;
    }
    add(callback, context = undefined, bucket) {
        if (!this._callbacks) {
            this._callbacks = [];
            this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
            bucket.push({ dispose: () => this.remove(callback, context) });
        }
    }
    remove(callback, context = undefined) {
        if (!this._callbacks) {
            return;
        }
        let foundCallbackWithDifferentContext = false;
        for (let i = 0; i < this._callbacks.length; i++) {
            if (this._callbacks[i] === callback) {
                if (this._contexts[i] === context) {
                    // callback & context match => remove it
                    this._callbacks.splice(i, 1);
                    this._contexts.splice(i, 1);
                    return;
                }
                else {
                    foundCallbackWithDifferentContext = true;
                }
            }
        }
        if (foundCallbackWithDifferentContext) {
            throw new Error('When adding a listener with a context, you should remove it with the same context');
        }
    }
    // tslint:disable-next-line:typedef
    [Symbol.iterator]() {
        if (!this._callbacks) {
            return [][Symbol.iterator]();
        }
        const callbacks = this._callbacks.slice(0);
        const contexts = this._contexts.slice(0);
        return callbacks.map((callback, i) => (...args) => callback.apply(contexts[i], args))[Symbol.iterator]();
    }
    invoke(...args) {
        const ret = [];
        for (const callback of this) {
            try {
                ret.push(callback(...args));
            }
            catch (e) {
                console.error(e);
            }
        }
        return ret;
    }
    isEmpty() {
        return !this._callbacks || this._callbacks.length === 0;
    }
    dispose() {
        this._callbacks = undefined;
        this._contexts = undefined;
    }
}
export class Emitter {
    _options;
    static LEAK_WARNING_THRESHHOLD = 175;
    _callbacks;
    _disposed = false;
    _leakingStacks;
    _leakWarnCountdown = 0;
    constructor(_options) {
        this._options = _options;
    }
    _event;
    /**
     * For the public to allow to subscribe
     * to events from this Emitter
     */
    get event() {
        if (!this._event) {
            this._event = Object.assign((listener, thisArgs, disposables) => {
                if (!this._callbacks) {
                    this._callbacks = new CallbackList();
                }
                if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
                    this._options.onFirstListenerAdd(this);
                }
                this._callbacks.add(listener, thisArgs);
                const removeMaxListenersCheck = this.checkMaxListeners(this._event.maxListeners);
                const result = {
                    dispose: () => {
                        if (removeMaxListenersCheck) {
                            removeMaxListenersCheck();
                        }
                        result.dispose = Emitter._noop;
                        if (!this._disposed) {
                            this._callbacks.remove(listener, thisArgs);
                            result.dispose = Emitter._noop;
                            if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                                this._options.onLastListenerRemove(this);
                            }
                        }
                    }
                };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            }, {
                maxListeners: Emitter.LEAK_WARNING_THRESHHOLD
            });
        }
        return this._event;
    }
    static _noop = function () {
    };
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    fire(event) {
        if (this._callbacks) {
            this._callbacks.invoke(event);
        }
    }
    /**
     * Process each listener one by one.
     * Return `false` to stop iterating over the listeners, `true` to continue.
     */
    async sequence(processor) {
        if (this._callbacks) {
            for (const listener of this._callbacks) {
                if (!await processor(listener)) {
                    break;
                }
            }
        }
    }
    dispose() {
        if (this._leakingStacks) {
            this._leakingStacks.clear();
            this._leakingStacks = undefined;
        }
        if (this._callbacks) {
            this._callbacks.dispose();
            this._callbacks = undefined;
        }
        this._disposed = true;
    }
    checkMaxListeners(maxListeners) {
        if (maxListeners === 0 || !this._callbacks) {
            return undefined;
        }
        const listenerCount = this._callbacks.length;
        if (listenerCount <= maxListeners) {
            return undefined;
        }
        const popStack = this.pushLeakingStack();
        this._leakWarnCountdown -= 1;
        if (this._leakWarnCountdown <= 0) {
            // only warn on first exceed and then every time the limit
            // is exceeded by 50% again
            this._leakWarnCountdown = maxListeners * 0.5;
            let topStack;
            let topCount = 0;
            this._leakingStacks.forEach((stackCount, stack) => {
                if (!topStack || topCount < stackCount) {
                    topStack = stack;
                    topCount = stackCount;
                }
            });
            // eslint-disable-next-line max-len
            console.warn(`Possible Emitter memory leak detected. ${listenerCount} listeners added. Use event.maxListeners to increase the limit (${maxListeners}). MOST frequent listener (${topCount}):`);
            console.warn(topStack);
        }
        return popStack;
    }
    pushLeakingStack() {
        if (!this._leakingStacks) {
            this._leakingStacks = new Map();
        }
        const stack = new Error().stack.split('\n').slice(3).join('\n');
        const count = (this._leakingStacks.get(stack) || 0);
        this._leakingStacks.set(stack, count + 1);
        return () => this.popLeakingStack(stack);
    }
    popLeakingStack(stack) {
        if (!this._leakingStacks) {
            return;
        }
        const count = (this._leakingStacks.get(stack) || 0);
        this._leakingStacks.set(stack, count - 1);
    }
}
export var WaitUntilEvent;
(function (WaitUntilEvent) {
    /**
     * Fire all listeners in the same tick.
     *
     * Use `AsyncEmitter.fire` to fire listeners async one after another.
     */
    async function fire(emitter, event, timeout = undefined) {
        const waitables = [];
        const asyncEvent = Object.assign(event, {
            waitUntil: (thenable) => {
                if (Object.isFrozen(waitables)) {
                    throw new Error('waitUntil cannot be called asynchronously.');
                }
                waitables.push(thenable);
            }
        });
        try {
            emitter.fire(asyncEvent);
            // Asynchronous calls to `waitUntil` should fail.
            Object.freeze(waitables);
        }
        finally {
            delete asyncEvent['waitUntil'];
        }
        if (!waitables.length) {
            return;
        }
        if (timeout !== undefined) {
            await Promise.race([Promise.all(waitables), new Promise(resolve => setTimeout(resolve, timeout))]);
        }
        else {
            await Promise.all(waitables);
        }
    }
    WaitUntilEvent.fire = fire;
})(WaitUntilEvent || (WaitUntilEvent = {}));
export class AsyncEmitter extends Emitter {
    deliveryQueue;
    /**
     * Fire listeners async one after another.
     */
    fire(event, token = CancellationToken.None, promiseJoin) {
        const callbacks = this._callbacks;
        if (!callbacks) {
            return Promise.resolve();
        }
        const listeners = [...callbacks];
        if (this.deliveryQueue) {
            return this.deliveryQueue = this.deliveryQueue.then(() => this.deliver(listeners, event, token, promiseJoin));
        }
        return this.deliveryQueue = this.deliver(listeners, event, token, promiseJoin);
    }
    async deliver(listeners, event, token, promiseJoin) {
        for (const listener of listeners) {
            if (token.isCancellationRequested) {
                return;
            }
            const waitables = [];
            const asyncEvent = Object.assign(event, {
                waitUntil: (thenable) => {
                    if (Object.isFrozen(waitables)) {
                        throw new Error('waitUntil cannot be called asynchronously.');
                    }
                    if (promiseJoin) {
                        thenable = promiseJoin(thenable, listener);
                    }
                    waitables.push(thenable);
                }
            });
            try {
                listener(event);
                // Asynchronous calls to `waitUntil` should fail.
                Object.freeze(waitables);
            }
            catch (e) {
                console.error(e);
            }
            finally {
                delete asyncEvent['waitUntil'];
            }
            if (!waitables.length) {
                return;
            }
            try {
                await Promise.all(waitables);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}

//# sourceMappingURL=../../lib/common/emitter.js.map
