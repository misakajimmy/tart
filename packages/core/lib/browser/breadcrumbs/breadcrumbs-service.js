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
import { inject, injectable, named, postConstruct } from 'inversify';
import { ContributionProvider, Emitter, Prioritizeable } from '../../common';
import { BreadcrumbPopupContainerFactory } from './breadcrumb-popup-container';
import { BreadcrumbsContribution, Styles } from './breadcrumbs-constants';
let BreadcrumbsService = class BreadcrumbsService {
    contributions;
    breadcrumbPopupContainerFactory;
    hasSubscribed = false;
    popupsOverlayContainer;
    onDidChangeBreadcrumbsEmitter = new Emitter();
    /**
     * Subscribe to this event emitter to be notified when the breadcrumbs have changed.
     * The URI is the URI of the editor the breadcrumbs have changed for.
     */
    get onDidChangeBreadcrumbs() {
        // This lazy subscription is to address problems in inversify's instantiation routine
        // related to use of the IconThemeService by different components instantiated by the
        // ContributionProvider.
        if (!this.hasSubscribed) {
            this.subscribeToContributions();
        }
        return this.onDidChangeBreadcrumbsEmitter.event;
    }
    init() {
        this.createOverlayContainer();
    }
    /**
     * Returns the breadcrumbs for a given URI, possibly an empty list.
     */
    async getBreadcrumbs(uri) {
        const result = [];
        for (const contribution of await this.prioritizedContributions()) {
            result.push(...await contribution.computeBreadcrumbs(uri));
        }
        return result;
    }
    /**
     * Opens a popup for the given breadcrumb at the given position.
     */
    async openPopup(breadcrumb, position) {
        const contribution = this.contributions.getContributions().find(c => c.type === breadcrumb.type);
        if (contribution) {
            const popup = this.breadcrumbPopupContainerFactory(this.popupsOverlayContainer, breadcrumb.id, position);
            const popupContent = await contribution.attachPopupContent(breadcrumb, popup.container);
            if (popupContent && popup.isOpen) {
                popup.onDidDispose(() => popupContent.dispose());
            }
            else {
                popupContent?.dispose();
            }
            return popup;
        }
    }
    createOverlayContainer() {
        this.popupsOverlayContainer = window.document.createElement('div');
        this.popupsOverlayContainer.id = Styles.BREADCRUMB_POPUP_OVERLAY_CONTAINER;
        if (window.document.body) {
            window.document.body.appendChild(this.popupsOverlayContainer);
        }
    }
    /**
     * Subscribes to the onDidChangeBreadcrumbs events for all contributions.
     */
    subscribeToContributions() {
        this.hasSubscribed = true;
        for (const contribution of this.contributions.getContributions()) {
            contribution.onDidChangeBreadcrumbs(uri => this.onDidChangeBreadcrumbsEmitter.fire(uri));
        }
    }
    async prioritizedContributions() {
        const prioritized = await Prioritizeable.prioritizeAll(this.contributions.getContributions(), contribution => contribution.priority);
        return prioritized.map(p => p.value).reverse();
    }
};
__decorate([
    inject(ContributionProvider),
    named(BreadcrumbsContribution)
], BreadcrumbsService.prototype, "contributions", void 0);
__decorate([
    inject(BreadcrumbPopupContainerFactory)
], BreadcrumbsService.prototype, "breadcrumbPopupContainerFactory", void 0);
__decorate([
    postConstruct()
], BreadcrumbsService.prototype, "init", null);
BreadcrumbsService = __decorate([
    injectable()
], BreadcrumbsService);
export { BreadcrumbsService };

//# sourceMappingURL=../../../lib/browser/breadcrumbs/breadcrumbs-service.js.map
