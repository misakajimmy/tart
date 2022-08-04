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
import { inject, injectable } from 'inversify';
import { WindowService } from './window/window-service';
import { ExternalUriService } from './external-uri-service';
let HttpOpenHandler = class HttpOpenHandler {
    id = 'http';
    windowService;
    externalUriService;
    canHandle(uri, options) {
        return ((options && options.openExternal) || uri.scheme.startsWith('http') || uri.scheme.startsWith('mailto')) ? 500 : 0;
    }
    async open(uri) {
        const resolvedUri = await this.externalUriService.resolve(uri);
        return this.windowService.openNewWindow(resolvedUri.toString(true), { external: true });
    }
};
__decorate([
    inject(WindowService)
], HttpOpenHandler.prototype, "windowService", void 0);
__decorate([
    inject(ExternalUriService)
], HttpOpenHandler.prototype, "externalUriService", void 0);
HttpOpenHandler = __decorate([
    injectable()
], HttpOpenHandler);
export { HttpOpenHandler };

//# sourceMappingURL=../../lib/browser/http-open-handler.js.map
