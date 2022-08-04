/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
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
import { inject, injectable, postConstruct } from 'inversify';
import { Emitter } from '../../common';
import { DisposableCollection } from '../../common/disposable';
import { Coordinate } from '../context-menu-renderer';
import { RendererHost } from '../widgets/react-renderer';
import { Styles } from './breadcrumbs-constants';
export const BreadcrumbPopupContainerFactory = Symbol('BreadcrumbPopupContainerFactory');
export const BreadcrumbID = Symbol('BreadcrumbID');
/**
 * This class creates a popup container at the given position
 * so that contributions can attach their HTML elements
 * as children of `BreadcrumbPopupContainer#container`.
 *
 * - `dispose()` is called on blur or on hit on escape
 */
let BreadcrumbPopupContainer = class BreadcrumbPopupContainer {
    breadcrumbId;
    parent;
    position;
    onDidDisposeEmitter = new Emitter();
    toDispose = new DisposableCollection(this.onDidDisposeEmitter);
    get onDidDispose() {
        return this.onDidDisposeEmitter.event;
    }
    _container;
    get container() {
        return this._container;
    }
    _isOpen;
    get isOpen() {
        return this._isOpen;
    }
    dispose() {
        if (!this.toDispose.disposed) {
            this.onDidDisposeEmitter.fire();
            this.toDispose.dispose();
            this._container.remove();
            this._isOpen = false;
            document.removeEventListener('keyup', this.escFunction);
        }
    }
    init() {
        this._container = this.createPopupDiv(this.position);
        document.addEventListener('keyup', this.escFunction);
        this._container.focus();
        this._isOpen = true;
    }
    createPopupDiv(position) {
        const result = window.document.createElement('div');
        result.className = Styles.BREADCRUMB_POPUP;
        result.style.left = `${position.x}px`;
        result.style.top = `${position.y}px`;
        result.tabIndex = 0;
        result.addEventListener('focusout', this.onFocusOut);
        this.parent.appendChild(result);
        return result;
    }
    onFocusOut = (event) => {
        if (!(event.relatedTarget instanceof Element) || !this._container.contains(event.relatedTarget)) {
            this.dispose();
        }
    };
    escFunction = (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            this.dispose();
        }
    };
};
__decorate([
    inject(BreadcrumbID)
], BreadcrumbPopupContainer.prototype, "breadcrumbId", void 0);
__decorate([
    inject(RendererHost)
], BreadcrumbPopupContainer.prototype, "parent", void 0);
__decorate([
    inject(Coordinate)
], BreadcrumbPopupContainer.prototype, "position", void 0);
__decorate([
    postConstruct()
], BreadcrumbPopupContainer.prototype, "init", null);
BreadcrumbPopupContainer = __decorate([
    injectable()
], BreadcrumbPopupContainer);
export { BreadcrumbPopupContainer };

//# sourceMappingURL=../../../lib/browser/breadcrumbs/breadcrumb-popup-container.js.map
