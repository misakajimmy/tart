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
import * as React from 'react';
import { ReactRenderer } from '../widgets';
import { BreadcrumbsService } from './breadcrumbs-service';
import { BreadcrumbRenderer } from './breadcrumb-renderer';
import PerfectScrollbar from 'perfect-scrollbar';
import URI from '../../common/uri';
import { Emitter, Event } from '../../common';
import { BreadcrumbPopupContainer } from './breadcrumb-popup-container';
import { DisposableCollection } from '../../common/disposable';
import { CorePreferences } from '../core-preferences';
import { Breadcrumb } from './breadcrumbs-constants';
import { LabelProvider } from '../label-provider';
interface Cancelable {
    canceled: boolean;
}
export declare class BreadcrumbsRenderer extends ReactRenderer {
    protected readonly breadcrumbsService: BreadcrumbsService;
    protected readonly breadcrumbRenderer: BreadcrumbRenderer;
    protected readonly corePreferences: CorePreferences;
    protected readonly labelProvider: LabelProvider;
    protected readonly onDidChangeActiveStateEmitter: Emitter<boolean>;
    protected uri: URI | undefined;
    protected breadcrumbs: Breadcrumb[];
    protected popup: BreadcrumbPopupContainer | undefined;
    protected scrollbar: PerfectScrollbar | undefined;
    protected toDispose: DisposableCollection;
    protected refreshCancellationMarker: Cancelable;
    get onDidChangeActiveState(): Event<boolean>;
    get active(): boolean;
    protected get breadCrumbsContainer(): Element | undefined;
    dispose(): void;
    refresh(uri?: URI): Promise<void>;
    protected init(): void;
    protected update(): void;
    protected createScrollbar(): void;
    protected scrollToEnd(): void;
    protected doRender(): React.ReactNode;
    protected renderBreadcrumbs(): React.ReactNode;
    protected togglePopup: (breadcrumb: Breadcrumb, event: React.MouseEvent) => void;
}
export declare const BreadcrumbsRendererFactory: unique symbol;
export interface BreadcrumbsRendererFactory {
    (): BreadcrumbsRenderer;
}
export {};
