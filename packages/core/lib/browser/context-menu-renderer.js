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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from 'inversify';
import { DisposableCollection } from '../common';
export const Coordinate = Symbol('Coordinate');
export function toAnchor(anchor) {
    return anchor instanceof HTMLElement ? { x: anchor.offsetLeft, y: anchor.offsetTop } : anchor;
}
export function coordinateFromAnchor(anchor) {
    const { x, y } = anchor instanceof MouseEvent ? { x: anchor.clientX, y: anchor.clientY } : anchor;
    return { x, y };
}
export class ContextMenuAccess {
    toDispose = new DisposableCollection();
    onDispose = this.toDispose.onDispose;
    constructor(toClose) {
        this.toDispose.push(toClose);
    }
    get disposed() {
        return this.toDispose.disposed;
    }
    dispose() {
        this.toDispose.dispose();
    }
}
let ContextMenuRenderer = class ContextMenuRenderer {
    toDisposeOnSetCurrent = new DisposableCollection();
    _current;
    /**
     * Currently opened context menu.
     * Rendering a new context menu will close the current.
     */
    get current() {
        return this._current;
    }
    render(menuPathOrOptions, anchor, onHide) {
        const resolvedOptions = RenderContextMenuOptions.resolve(menuPathOrOptions, anchor, onHide);
        const access = this.doRender(resolvedOptions);
        this.setCurrent(access);
        return access;
    }
    setCurrent(current) {
        if (this._current === current) {
            return;
        }
        this.toDisposeOnSetCurrent.dispose();
        this._current = current;
        if (current) {
            this.toDisposeOnSetCurrent.push(current.onDispose(() => {
                this._current = undefined;
            }));
            this.toDisposeOnSetCurrent.push(current);
        }
    }
};
ContextMenuRenderer = __decorate([
    injectable()
], ContextMenuRenderer);
export { ContextMenuRenderer };
export var RenderContextMenuOptions;
(function (RenderContextMenuOptions) {
    function resolve(menuPathOrOptions, anchor, onHide) {
        let menuPath;
        let args;
        if (Array.isArray(menuPathOrOptions)) {
            menuPath = menuPathOrOptions;
            args = [anchor];
        }
        else {
            menuPath = menuPathOrOptions.menuPath;
            anchor = menuPathOrOptions.anchor;
            onHide = menuPathOrOptions.onHide;
            args = menuPathOrOptions.args ? [...menuPathOrOptions.args, anchor] : [anchor];
        }
        return {
            menuPath,
            anchor: anchor,
            onHide,
            args
        };
    }
    RenderContextMenuOptions.resolve = resolve;
})(RenderContextMenuOptions || (RenderContextMenuOptions = {}));

//# sourceMappingURL=../../lib/browser/context-menu-renderer.js.map
