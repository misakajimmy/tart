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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation and others. All rights reserved.
 *  Licensed under the MIT License. See https://github.com/Microsoft/vscode/blob/master/LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/
import { Emitter } from './emitter';
import { Event } from './event';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shortcutEvent = Object.freeze(Object.assign(function (callback, context) {
    const handle = setTimeout(callback.bind(context), 0);
    return {
        dispose() {
            clearTimeout(handle);
        }
    };
}, { maxListeners: 0 }));
export var CancellationToken;
(function (CancellationToken) {
    CancellationToken.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: shortcutEvent
    });
    CancellationToken.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: Event.None,
    });
})(CancellationToken || (CancellationToken = {}));
export class CancellationError extends Error {
    constructor() {
        super('Canceled');
        this.name = this.message;
    }
}
class MutableToken {
    _isCancelled = false;
    _emitter;
    get isCancellationRequested() {
        return this._isCancelled;
    }
    get onCancellationRequested() {
        if (this._isCancelled) {
            return shortcutEvent;
        }
        if (!this._emitter) {
            this._emitter = new Emitter();
        }
        return this._emitter.event;
    }
    cancel() {
        if (!this._isCancelled) {
            this._isCancelled = true;
            if (this._emitter) {
                this._emitter.fire(undefined);
                this._emitter = undefined;
            }
        }
    }
}
export class CancellationTokenSource {
    _token;
    get token() {
        if (!this._token) {
            // be lazy and create the token only when
            // actually needed
            this._token = new MutableToken();
        }
        return this._token;
    }
    cancel() {
        if (!this._token) {
            // save an object by returning the default
            // cancelled token when cancellation happens
            // before someone asks for the token
            this._token = CancellationToken.Cancelled;
        }
        else if (this._token !== CancellationToken.Cancelled) {
            this._token.cancel();
        }
    }
    dispose() {
        this.cancel();
    }
}
const cancelledMessage = 'Cancelled';
export function cancelled() {
    return new Error(cancelledMessage);
}
export function isCancelled(err) {
    return !!err && err.message === cancelledMessage;
}
export function checkCancelled(token) {
    if (!!token && token.isCancellationRequested) {
        throw cancelled();
    }
}

//# sourceMappingURL=../../lib/common/cancellation.js.map
