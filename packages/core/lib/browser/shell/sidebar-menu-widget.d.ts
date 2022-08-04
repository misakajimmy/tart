/********************************************************************************
 * Copyright (C) 2020 Alibaba Inc. and others.
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
import { ReactWidget } from '../widgets';
import { ContextMenuRenderer } from '../context-menu-renderer';
import { MenuPath } from '../../common/menu';
export declare const SidebarTopMenuWidgetFactory: unique symbol;
export declare const SidebarBottomMenuWidgetFactory: unique symbol;
export interface SidebarMenu {
    id: string;
    iconClass: string;
    title: string;
    menuPath: MenuPath;
    order: number;
}
/**
 * The menu widget placed on the sidebar.
 */
export declare class SidebarMenuWidget extends ReactWidget {
    protected readonly menus: SidebarMenu[];
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    constructor();
    addMenu(menu: SidebarMenu): void;
    removeMenu(menuId: string): void;
    protected onClick(e: React.MouseEvent<HTMLElement, MouseEvent>, menuPath: MenuPath): void;
    protected render(): React.ReactNode;
}
