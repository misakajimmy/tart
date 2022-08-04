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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { Emitter } from '../common';
import { Deferred } from '../common/promise-util';
let FrontendApplicationStateService = class FrontendApplicationStateService {
    // @inject(ILogger)
    // protected readonly logger: ILogger;
    deferred = {};
    stateChanged = new Emitter();
    _state = 'init';
    get state() {
        return this._state;
    }
    set state(state) {
        if (state !== this._state) {
            if (this.deferred[this._state] === undefined) {
                this.deferred[this._state] = new Deferred();
            }
            const oldState = this._state;
            this._state = state;
            if (this.deferred[state] === undefined) {
                this.deferred[state] = new Deferred();
            }
            this.deferred[state].resolve();
            // this.logger.info(`Changed application state from '${oldState}' to '${this._state}'.`);
            this.stateChanged.fire(state);
        }
    }
    get onStateChanged() {
        return this.stateChanged.event;
    }
    reachedState(state) {
        if (this.deferred[state] === undefined) {
            this.deferred[state] = new Deferred();
        }
        return this.deferred[state].promise;
    }
    reachedAnyState(...states) {
        return Promise.race(states.map(s => this.reachedState(s)));
    }
};
FrontendApplicationStateService = __decorate([
    injectable()
], FrontendApplicationStateService);
export { FrontendApplicationStateService };

//# sourceMappingURL=../../lib/browser/frontend-application-state.js.map
