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
import { Emitter, Event } from '../../common';
import { Disposable, DisposableCollection } from '../../common/disposable';
import { Coordinate } from '../context-menu-renderer';
import { RendererHost } from '../widgets/react-renderer';
export interface BreadcrumbPopupContainerFactory {
    (parent: HTMLElement, breadcrumbId: string, position: Coordinate): BreadcrumbPopupContainer;
}
export declare const BreadcrumbPopupContainerFactory: unique symbol;
export declare type BreadcrumbID = string;
export declare const BreadcrumbID: unique symbol;
/**
 * This class creates a popup container at the given position
 * so that contributions can attach their HTML elements
 * as children of `BreadcrumbPopupContainer#container`.
 *
 * - `dispose()` is called on blur or on hit on escape
 */
export declare class BreadcrumbPopupContainer implements Disposable {
    readonly breadcrumbId: BreadcrumbID;
    protected readonly parent: RendererHost;
    protected readonly position: Coordinate;
    protected onDidDisposeEmitter: Emitter<void>;
    protected toDispose: DisposableCollection;
    get onDidDispose(): Event<void>;
    protected _container: HTMLElement;
    get container(): HTMLElement;
    protected _isOpen: boolean;
    get isOpen(): boolean;
    dispose(): void;
    protected init(): void;
    protected createPopupDiv(position: Coordinate): HTMLDivElement;
    protected onFocusOut: (event: FocusEvent) => void;
    protected escFunction: (event: KeyboardEvent) => void;
}
