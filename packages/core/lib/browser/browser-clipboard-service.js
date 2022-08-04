/********************************************************************************
 * Copyright (C) 2019 RedHat and others.
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
import { inject, injectable } from 'inversify';
import { isFirefox } from './browser';
import { MessageService } from '../common/message-service';
let BrowserClipboardService = class BrowserClipboardService {
    messageService;
    async readText() {
        let permission;
        try {
            permission = await this.queryPermission('clipboard-read');
        }
        catch (e1) {
            console.error('Failed checking a clipboard-read permission.', e1);
            // in FireFox, Clipboard API isn't gated with the permissions
            try {
                return await this.getClipboardAPI().readText();
            }
            catch (e2) {
                console.error('Failed reading clipboard content.', e2);
                if (isFirefox) {
                    this.messageService.warn(`Clipboard API is not available.
                    It can be enabled by 'dom.events.testing.asyncClipboard' preference on 'about:config' page. Then reload tart.
                    Note, it will allow FireFox getting full access to the system clipboard.`);
                }
                return '';
            }
        }
        if (permission.state === 'denied') {
            // most likely, the user intentionally denied the access
            this.messageService.warn("Access to the clipboard is denied. Check your browser's permission.");
            return '';
        }
        return this.getClipboardAPI().readText();
    }
    async writeText(value) {
        let permission;
        try {
            permission = await this.queryPermission('clipboard-write');
        }
        catch (e1) {
            console.error('Failed checking a clipboard-write permission.', e1);
            // in FireFox, Clipboard API isn't gated with the permissions
            try {
                await this.getClipboardAPI().writeText(value);
                return;
            }
            catch (e2) {
                console.error('Failed writing to the clipboard.', e2);
                if (isFirefox) {
                    this.messageService.warn(`Clipboard API is not available.
                    It can be enabled by 'dom.events.testing.asyncClipboard' preference on 'about:config' page. Then reload tart.
                    Note, it will allow FireFox getting full access to the system clipboard.`);
                }
                return;
            }
        }
        if (permission.state === 'denied') {
            // most likely, the user intentionally denied the access
            this.messageService.warn("Access to the clipboard is denied. Check your browser's permission.");
            return;
        }
        return this.getClipboardAPI().writeText(value);
    }
    async queryPermission(name) {
        if ('permissions' in navigator) {
            return navigator['permissions'].query({ name: name });
        }
        throw new Error('Permissions API unavailable');
    }
    getClipboardAPI() {
        if ('clipboard' in navigator) {
            return navigator['clipboard'];
        }
        throw new Error('Async Clipboard API unavailable');
    }
};
__decorate([
    inject(MessageService)
], BrowserClipboardService.prototype, "messageService", void 0);
BrowserClipboardService = __decorate([
    injectable()
], BrowserClipboardService);
export { BrowserClipboardService };

//# sourceMappingURL=../../lib/browser/browser-clipboard-service.js.map
