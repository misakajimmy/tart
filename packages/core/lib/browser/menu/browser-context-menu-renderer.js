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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, injectable } from 'inversify';
import { ContextMenuAccess, ContextMenuRenderer, coordinateFromAnchor } from '../context-menu-renderer';
import { BrowserMainMenuFactory } from './browser-menu-plugin';
export class BrowserContextMenuAccess extends ContextMenuAccess {
    menu;
    constructor(menu) {
        super(menu);
        this.menu = menu;
    }
}
let BrowserContextMenuRenderer = class BrowserContextMenuRenderer extends ContextMenuRenderer {
    menuFactory;
    constructor(menuFactory) {
        super();
        this.menuFactory = menuFactory;
    }
    doRender({ menuPath, anchor, args, onHide }) {
        const contextMenu = this.menuFactory.createContextMenu(menuPath, args);
        const { x, y } = coordinateFromAnchor(anchor);
        if (onHide) {
            contextMenu.aboutToClose.connect(() => onHide());
        }
        contextMenu.open(x, y);
        return new BrowserContextMenuAccess(contextMenu);
    }
};
BrowserContextMenuRenderer = __decorate([
    injectable(),
    __param(0, inject(BrowserMainMenuFactory))
], BrowserContextMenuRenderer);
export { BrowserContextMenuRenderer };

//# sourceMappingURL=../../../lib/browser/menu/browser-context-menu-renderer.js.map
