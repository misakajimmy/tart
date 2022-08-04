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
import { inject, injectable, named } from 'inversify';
import { Emitter } from '../../common';
import { ContributionProvider } from '../../common/contribution-provider';
import { FrontendApplicationContribution } from '../frontend-application';
import { DEFAULT_WINDOW_HASH } from '../../common/window';
let DefaultWindowService = class DefaultWindowService {
    frontendApplication;
    onUnloadEmitter = new Emitter();
    contributions;
    get onUnload() {
        return this.onUnloadEmitter.event;
    }
    onStart(app) {
        this.frontendApplication = app;
        this.registerUnloadListeners();
    }
    openNewWindow(url) {
        window.open(url, undefined, 'noopener');
        return undefined;
    }
    openNewDefaultWindow() {
        this.openNewWindow(DEFAULT_WINDOW_HASH);
    }
    canUnload() {
        return false;
    }
    /**
     * Implement the mechanism to detect unloading of the page.
     */
    registerUnloadListeners() {
        window.addEventListener('beforeunload', event => {
            if (!this.canUnload()) {
                return this.preventUnload(event);
            }
        });
        // In a browser, `unload` is correctly fired when the page unloads, unlike Electron.
        // If `beforeunload` is cancelled, the user will be prompted to leave or stay.
        // If the user stays, the page won't be unloaded, so `unload` is not fired.
        // If the user leaves, the page will be unloaded, so `unload` is fired.
        window.addEventListener('unload', () => this.onUnloadEmitter.fire());
    }
    /**
     * Notify the browser that we do not want to unload.
     *
     * Notes:
     *  - Shows a confirmation popup in browsers.
     *  - Prevents the window from closing without confirmation in electron.
     *
     * @param event The beforeunload event
     */
    preventUnload(event) {
        event.returnValue = '';
        event.preventDefault();
        return '';
    }
};
__decorate([
    inject(ContributionProvider),
    named(FrontendApplicationContribution)
], DefaultWindowService.prototype, "contributions", void 0);
DefaultWindowService = __decorate([
    injectable()
], DefaultWindowService);
export { DefaultWindowService };

//# sourceMappingURL=../../../lib/browser/window/default-window-service.js.map
