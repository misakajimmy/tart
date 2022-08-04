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
import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { ReactRenderer } from '../widgets';
import { BreadcrumbsService } from './breadcrumbs-service';
import { BreadcrumbRenderer } from './breadcrumb-renderer';
import PerfectScrollbar from 'perfect-scrollbar';
import { Emitter } from '../../common';
import { DisposableCollection } from '../../common/disposable';
import { CorePreferences } from '../core-preferences';
import { Styles } from './breadcrumbs-constants';
import { LabelProvider } from '../label-provider';
let BreadcrumbsRenderer = class BreadcrumbsRenderer extends ReactRenderer {
    breadcrumbsService;
    breadcrumbRenderer;
    corePreferences;
    labelProvider;
    onDidChangeActiveStateEmitter = new Emitter();
    uri;
    breadcrumbs = [];
    popup;
    scrollbar;
    toDispose = new DisposableCollection();
    refreshCancellationMarker = { canceled: true };
    get onDidChangeActiveState() {
        return this.onDidChangeActiveStateEmitter.event;
    }
    get active() {
        return !!this.breadcrumbs.length;
    }
    get breadCrumbsContainer() {
        return this.host.firstElementChild ?? undefined;
    }
    dispose() {
        super.dispose();
        this.toDispose.dispose();
        if (this.popup) {
            this.popup.dispose();
        }
        if (this.scrollbar) {
            this.scrollbar.destroy();
            this.scrollbar = undefined;
        }
    }
    async refresh(uri) {
        this.uri = uri;
        this.refreshCancellationMarker.canceled = true;
        const currentCallCanceled = { canceled: false };
        this.refreshCancellationMarker = currentCallCanceled;
        let breadcrumbs;
        if (uri && this.corePreferences['breadcrumbs.enabled']) {
            breadcrumbs = await this.breadcrumbsService.getBreadcrumbs(uri);
        }
        else {
            breadcrumbs = [];
        }
        if (currentCallCanceled.canceled) {
            return;
        }
        const wasActive = this.active;
        this.breadcrumbs = breadcrumbs;
        const isActive = this.active;
        if (wasActive !== isActive) {
            this.onDidChangeActiveStateEmitter.fire(isActive);
        }
        this.update();
    }
    init() {
        this.toDispose.push(this.onDidChangeActiveStateEmitter);
        this.toDispose.push(this.breadcrumbsService.onDidChangeBreadcrumbs(uri => {
            if (this.uri?.isEqual(uri)) {
                this.refresh(this.uri);
            }
        }));
        this.toDispose.push(this.corePreferences.onPreferenceChanged(change => {
            if (change.preferenceName === 'breadcrumbs.enabled') {
                this.refresh(this.uri);
            }
        }));
        this.toDispose.push(this.labelProvider.onDidChange(() => this.refresh(this.uri)));
    }
    update() {
        this.render();
        if (!this.scrollbar) {
            this.createScrollbar();
        }
        else {
            this.scrollbar.update();
        }
        this.scrollToEnd();
    }
    createScrollbar() {
        const { breadCrumbsContainer } = this;
        if (breadCrumbsContainer) {
            this.scrollbar = new PerfectScrollbar(breadCrumbsContainer, {
                handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
                useBothWheelAxes: true,
                scrollXMarginOffset: 4,
                suppressScrollY: true
            });
        }
    }
    scrollToEnd() {
        const { breadCrumbsContainer } = this;
        if (breadCrumbsContainer) {
            breadCrumbsContainer.scrollLeft = breadCrumbsContainer.scrollWidth;
        }
    }
    doRender() {
        return React.createElement("ul", { className: Styles.BREADCRUMBS }, this.renderBreadcrumbs());
    }
    renderBreadcrumbs() {
        return this.breadcrumbs.map(breadcrumb => this.breadcrumbRenderer.render(breadcrumb, this.togglePopup));
    }
    togglePopup = (breadcrumb, event) => {
        event.stopPropagation();
        event.preventDefault();
        let openPopup = true;
        if (this.popup?.isOpen) {
            this.popup.dispose();
            // There is a popup open. If the popup is the popup that belongs to the currently clicked breadcrumb
            // just close the popup. If another breadcrumb was clicked, open the new popup immediately.
            openPopup = this.popup.breadcrumbId !== breadcrumb.id;
        }
        else {
            this.popup = undefined;
        }
        if (openPopup) {
            const { currentTarget } = event;
            const breadcrumbElement = currentTarget.closest(`.${Styles.BREADCRUMB_ITEM}`);
            if (breadcrumbElement) {
                const { left: x, bottom: y } = breadcrumbElement.getBoundingClientRect();
                this.breadcrumbsService.openPopup(breadcrumb, { x, y }).then(popup => {
                    this.popup = popup;
                });
            }
        }
    };
};
__decorate([
    inject(BreadcrumbsService)
], BreadcrumbsRenderer.prototype, "breadcrumbsService", void 0);
__decorate([
    inject(BreadcrumbRenderer)
], BreadcrumbsRenderer.prototype, "breadcrumbRenderer", void 0);
__decorate([
    inject(CorePreferences)
], BreadcrumbsRenderer.prototype, "corePreferences", void 0);
__decorate([
    inject(LabelProvider)
], BreadcrumbsRenderer.prototype, "labelProvider", void 0);
__decorate([
    postConstruct()
], BreadcrumbsRenderer.prototype, "init", null);
BreadcrumbsRenderer = __decorate([
    injectable()
], BreadcrumbsRenderer);
export { BreadcrumbsRenderer };
export const BreadcrumbsRendererFactory = Symbol('BreadcrumbsRendererFactory');

//# sourceMappingURL=../../../lib/browser/breadcrumbs/breadcrumbs-renderer.js.map
