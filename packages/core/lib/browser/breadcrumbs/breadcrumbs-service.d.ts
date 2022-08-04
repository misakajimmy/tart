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
import { ContributionProvider, Emitter, Event } from '../../common';
import URI from '../../common/uri';
import { Coordinate } from '../context-menu-renderer';
import { BreadcrumbPopupContainer, BreadcrumbPopupContainerFactory } from './breadcrumb-popup-container';
import { Breadcrumb, BreadcrumbsContribution } from './breadcrumbs-constants';
export declare class BreadcrumbsService {
    protected readonly contributions: ContributionProvider<BreadcrumbsContribution>;
    protected readonly breadcrumbPopupContainerFactory: BreadcrumbPopupContainerFactory;
    protected hasSubscribed: boolean;
    protected popupsOverlayContainer: HTMLDivElement;
    protected readonly onDidChangeBreadcrumbsEmitter: Emitter<URI>;
    /**
     * Subscribe to this event emitter to be notified when the breadcrumbs have changed.
     * The URI is the URI of the editor the breadcrumbs have changed for.
     */
    get onDidChangeBreadcrumbs(): Event<URI>;
    init(): void;
    /**
     * Returns the breadcrumbs for a given URI, possibly an empty list.
     */
    getBreadcrumbs(uri: URI): Promise<Breadcrumb[]>;
    /**
     * Opens a popup for the given breadcrumb at the given position.
     */
    openPopup(breadcrumb: Breadcrumb, position: Coordinate): Promise<BreadcrumbPopupContainer | undefined>;
    protected createOverlayContainer(): void;
    /**
     * Subscribes to the onDidChangeBreadcrumbs events for all contributions.
     */
    protected subscribeToContributions(): void;
    protected prioritizedContributions(): Promise<BreadcrumbsContribution[]>;
}
