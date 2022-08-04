/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
import { Disposable, DisposableCollection } from './disposable';
import { Emitter } from './emitter';
export class AbstractReferenceCollection {
    _keys = new Map();
    _values = new Map();
    references = new Map();
    onDidCreateEmitter = new Emitter();
    onDidCreate = this.onDidCreateEmitter.event;
    onWillDisposeEmitter = new Emitter();
    onWillDispose = this.onWillDisposeEmitter.event;
    toDispose = new DisposableCollection();
    constructor() {
        this.toDispose.push(this.onDidCreateEmitter);
        this.toDispose.push(this.onWillDisposeEmitter);
        this.toDispose.push(Disposable.create(() => this.clear()));
    }
    dispose() {
        this.toDispose.dispose();
    }
    clear() {
        for (const value of this._values.values()) {
            try {
                value.dispose();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    has(args) {
        const key = this.toKey(args);
        return this.references.has(key);
    }
    keys() {
        return [...this._keys.values()];
    }
    values() {
        return [...this._values.values()];
    }
    get(args) {
        const key = this.toKey(args);
        return this._values.get(key);
    }
    doAcquire(key, object) {
        const references = this.references.get(key) || this.createReferences(key, object);
        const reference = {
            object,
            dispose: () => {
            }
        };
        references.push(reference);
        return reference;
    }
    toKey(args) {
        return JSON.stringify(args);
    }
    createReferences(key, value) {
        const references = new DisposableCollection();
        references.onDispose(() => value.dispose());
        const disposeObject = value.dispose.bind(value);
        value.dispose = () => {
            this.onWillDisposeEmitter.fire(value);
            disposeObject();
            this._values.delete(key);
            this._keys.delete(key);
            this.references.delete(key);
            references.dispose();
        };
        this.references.set(key, references);
        return references;
    }
}
export class ReferenceCollection extends AbstractReferenceCollection {
    factory;
    pendingValues = new Map();
    constructor(factory) {
        super();
        this.factory = factory;
    }
    async acquire(args) {
        const key = this.toKey(args);
        const existing = this._values.get(key);
        if (existing) {
            return this.doAcquire(key, existing);
        }
        const object = await this.getOrCreateValue(key, args);
        return this.doAcquire(key, object);
    }
    async getOrCreateValue(key, args) {
        const existing = this.pendingValues.get(key);
        if (existing) {
            return existing;
        }
        const pending = this.factory(args);
        this._keys.set(key, args);
        this.pendingValues.set(key, pending);
        try {
            const value = await pending;
            this._values.set(key, value);
            this.onDidCreateEmitter.fire(value);
            return value;
        }
        catch (e) {
            this._keys.delete(key);
            throw e;
        }
        finally {
            this.pendingValues.delete(key);
        }
    }
}
export class SyncReferenceCollection extends AbstractReferenceCollection {
    factory;
    constructor(factory) {
        super();
        this.factory = factory;
    }
    acquire(args) {
        const key = this.toKey(args);
        const object = this.getOrCreateValue(key, args);
        return this.doAcquire(key, object);
    }
    getOrCreateValue(key, args) {
        const existing = this._values.get(key);
        if (existing) {
            return existing;
        }
        const value = this.factory(args);
        this._keys.set(key, args);
        this._values.set(key, value);
        this.onDidCreateEmitter.fire(value);
        return value;
    }
}

//# sourceMappingURL=../../lib/common/reference.js.map
