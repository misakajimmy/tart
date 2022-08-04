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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicationError } from '../application-error';
import { Emitter } from '../emitter';
export class JsonRpcConnectionHandler {
    path;
    targetFactory;
    factoryConstructor;
    constructor(path, targetFactory, factoryConstructor = JsonRpcProxyFactory) {
        this.path = path;
        this.targetFactory = targetFactory;
        this.factoryConstructor = factoryConstructor;
    }
    onConnection(connection) {
        const factory = new this.factoryConstructor();
        const proxy = factory.createProxy();
        factory.target = this.targetFactory(proxy);
        factory.listen(connection);
    }
}
/**
 * Factory for JSON-RPC proxy objects.
 *
 * A JSON-RPC proxy exposes the programmatic interface of an object through
 * JSON-RPC.  This allows remote programs to call methods of this objects by
 * sending JSON-RPC requests.  This takes place over a bi-directional stream,
 * where both ends can expose an object and both can call methods each other's
 * exposed object.
 *
 * For example, assuming we have an object of the following type on one end:
 *
 *     class Foo {
 *         bar(baz: number): number { return baz + 1 }
 *     }
 *
 * which we want to expose through a JSON-RPC interface.  We would do:
 *
 *     let target = new Foo()
 *     let factory = new JsonRpcProxyFactory<Foo>('/foo', target)
 *     factory.onConnection(connection)
 *
 * The party at the other end of the `connection`, in order to remotely call
 * methods on this object would do:
 *
 *     let factory = new JsonRpcProxyFactory<Foo>('/foo')
 *     factory.onConnection(connection)
 *     let proxy = factory.createProxy();
 *     let result = proxy.bar(42)
 *     // result is equal to 43
 *
 * One the wire, it would look like this:
 *
 *     --> {"jsonrpc": "2.0", "id": 0, "method": "bar", "params": {"baz": 42}}
 *     <-- {"jsonrpc": "2.0", "id": 0, "result": 43}
 *
 * Note that in the code of the caller, we didn't pass a target object to
 * JsonRpcProxyFactory, because we don't want/need to expose an object.
 * If we had passed a target object, the other side could've called methods on
 * it.
 *
 * @param <T> - The type of the object to expose to JSON-RPC.
 */
export class JsonRpcProxyFactory {
    target;
    onDidOpenConnectionEmitter = new Emitter();
    onDidCloseConnectionEmitter = new Emitter();
    connectionPromiseResolve;
    connectionPromise;
    /**
     * Build a new JsonRpcProxyFactory.
     *
     * @param target - The object to expose to JSON-RPC methods calls.  If this
     *   is omitted, the proxy won't be able to handle requests, only send them.
     */
    constructor(target) {
        this.target = target;
        this.waitForConnection();
    }
    /**
     * Connect a MessageConnection to the factory.
     *
     * This connection will be used to send/receive JSON-RPC requests and
     * response.
     */
    listen(connection) {
        connection.onRequest((prop, ...args) => this.onRequest(prop, ...args));
        connection.onNotification((prop, ...args) => this.onNotification(prop, ...args));
        connection.onDispose(() => this.waitForConnection());
        connection.listen();
        this.connectionPromiseResolve(connection);
    }
    /**
     * Create a Proxy exposing the interface of an object of type T.  This Proxy
     * can be used to do JSON-RPC method calls on the remote target object as
     * if it was local.
     *
     * If `T` implements `JsonRpcServer` then a client is used as a target object for a remote target object.
     */
    createProxy() {
        const result = new Proxy(this, this);
        return result;
    }
    /**
     * Get a callable object that executes a JSON-RPC method call.
     *
     * Getting a property on the Proxy object returns a callable that, when
     * called, executes a JSON-RPC call.  The name of the property defines the
     * method to be called.  The callable takes a variable number of arguments,
     * which are passed in the JSON-RPC method call.
     *
     * For example, if you have a Proxy object:
     *
     *     let fooProxyFactory = JsonRpcProxyFactory<Foo>('/foo')
     *     let fooProxy = fooProxyFactory.createProxy()
     *
     * accessing `fooProxy.bar` will return a callable that, when called,
     * executes a JSON-RPC method call to method `bar`.  Therefore, doing
     * `fooProxy.bar()` will call the `bar` method on the remote Foo object.
     *
     * @param target - unused.
     * @param p - The property accessed on the Proxy object.
     * @param receiver - unused.
     * @returns A callable that executes the JSON-RPC call.
     */
    get(target, p, receiver) {
        if (p === 'setClient') {
            return (client) => {
                this.target = client;
            };
        }
        if (p === 'getClient') {
            return () => this.target;
        }
        if (p === 'onDidOpenConnection') {
            return this.onDidOpenConnectionEmitter.event;
        }
        if (p === 'onDidCloseConnection') {
            return this.onDidCloseConnectionEmitter.event;
        }
        const isNotify = this.isNotification(p);
        return (...args) => {
            const method = p.toString();
            const capturedError = new Error(`Request '${method}' failed`);
            return this.connectionPromise.then(connection => new Promise((resolve, reject) => {
                try {
                    if (isNotify) {
                        connection.sendNotification(method, ...args);
                        resolve(0);
                    }
                    else {
                        const resultPromise = connection.sendRequest(method, ...args);
                        resultPromise
                            .catch((err) => reject(this.deserializeError(capturedError, err)))
                            .then((result) => resolve(result));
                    }
                }
                catch (err) {
                    reject(err);
                }
            }));
        };
    }
    waitForConnection() {
        this.connectionPromise = new Promise(resolve => this.connectionPromiseResolve = resolve);
        this.connectionPromise.then(connection => {
            connection.onClose(() => this.onDidCloseConnectionEmitter.fire(undefined));
            this.onDidOpenConnectionEmitter.fire(undefined);
        });
    }
    /**
     * Process an incoming JSON-RPC method call.
     *
     * onRequest is called when the JSON-RPC connection received a method call
     * request.  It calls the corresponding method on [[target]].
     *
     * The return value is a Promise object that is resolved with the return
     * value of the method call, if it is successful.  The promise is rejected
     * if the called method does not exist or if it throws.
     *
     * @returns A promise of the method call completion.
     */
    async onRequest(method, ...args) {
        try {
            if (this.target) {
                return await this.target[method](...args);
            }
            else {
                throw new Error(`no target was set to handle ${method}`);
            }
        }
        catch (error) {
            const e = this.serializeError(error);
            if (e) {
                throw e;
            }
            const reason = e.message || '';
            const stack = e.stack || '';
            console.error(`Request ${method} failed with error: ${reason}`, stack);
            throw e;
        }
    }
    /**
     * Process an incoming JSON-RPC notification.
     *
     * Same as [[onRequest]], but called on incoming notifications rather than
     * methods calls.
     */
    onNotification(method, ...args) {
        if (this.target) {
            this.target[method](...args);
        }
    }
    /**
     * Return whether the given property represents a notification.
     *
     * A property leads to a notification rather than a method call if its name
     * begins with `notify` or `on`.
     *
     * @param p - The property being called on the proxy.
     * @return Whether `p` represents a notification.
     */
    isNotification(p) {
        return p.toString().startsWith('notify') || p.toString().startsWith('on');
    }
    serializeError(e) {
        if (ApplicationError.is(e)) {
            return e;
        }
        return e;
    }
    deserializeError(capturedError, e) {
        if (e) {
            const capturedStack = capturedError.stack || '';
            if (e.data && e.data.kind === 'application') {
                const { stack, data, message } = e.data;
                return ApplicationError.fromJson(e.code, {
                    message: message || capturedError.message,
                    data,
                    stack: `${capturedStack}\nCaused by: ${stack}`
                });
            }
            e.stack = capturedStack;
        }
        return e;
    }
}

//# sourceMappingURL=../../../lib/common/messaging/proxy-factory.js.map
