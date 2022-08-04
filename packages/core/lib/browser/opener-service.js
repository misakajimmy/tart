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
import { ContributionProvider, Disposable, Emitter, Prioritizeable } from '../common';
export const OpenHandler = Symbol('OpenHandler');
export const OpenerService = Symbol('OpenerService');
export async function open(openerService, uri, options) {
    const opener = await openerService.getOpener(uri, options);
    return opener.open(uri, options);
}
let DefaultOpenerService = class DefaultOpenerService {
    handlersProvider;
    // Collection of open-handlers for custom-editor contributions.
    customEditorOpenHandlers = [];
    onDidChangeOpenersEmitter = new Emitter();
    onDidChangeOpeners = this.onDidChangeOpenersEmitter.event;
    constructor(handlersProvider) {
        this.handlersProvider = handlersProvider;
    }
    addHandler(openHandler) {
        this.customEditorOpenHandlers.push(openHandler);
        this.onDidChangeOpenersEmitter.fire();
        return Disposable.create(() => {
            this.customEditorOpenHandlers.splice(this.customEditorOpenHandlers.indexOf(openHandler), 1);
            this.onDidChangeOpenersEmitter.fire();
        });
    }
    async getOpener(uri, options) {
        const handlers = await this.prioritize(uri, options);
        if (handlers.length >= 1) {
            return handlers[0];
        }
        return Promise.reject(new Error(`There is no opener for ${uri}.`));
    }
    async getOpeners(uri, options) {
        return uri ? this.prioritize(uri, options) : this.getHandlers();
    }
    async prioritize(uri, options) {
        const prioritized = await Prioritizeable.prioritizeAll(this.getHandlers(), async (handler) => {
            try {
                return await handler.canHandle(uri, options);
            }
            catch {
                return 0;
            }
        });
        return prioritized.map(p => p.value);
    }
    getHandlers() {
        return [
            ...this.handlersProvider.getContributions(),
            ...this.customEditorOpenHandlers
        ];
    }
};
DefaultOpenerService = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(OpenHandler))
], DefaultOpenerService);
export { DefaultOpenerService };

//# sourceMappingURL=../../lib/browser/opener-service.js.map
