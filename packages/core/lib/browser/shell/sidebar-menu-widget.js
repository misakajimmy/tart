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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import * as React from 'react';
import { ReactWidget } from '../widgets';
import { ContextMenuRenderer } from '../context-menu-renderer';
export const SidebarTopMenuWidgetFactory = Symbol('SidebarTopMenuWidgetFactory');
export const SidebarBottomMenuWidgetFactory = Symbol('SidebarBottomMenuWidgetFactory');
/**
 * The menu widget placed on the sidebar.
 */
let SidebarMenuWidget = class SidebarMenuWidget extends ReactWidget {
    menus;
    contextMenuRenderer;
    constructor() {
        super();
        this.menus = [];
    }
    addMenu(menu) {
        const exists = this.menus.find(m => m.id === menu.id);
        if (exists) {
            return;
        }
        this.menus.push(menu);
        this.update();
    }
    removeMenu(menuId) {
        const menu = this.menus.find(m => m.id === menuId);
        if (menu) {
            const index = this.menus.indexOf(menu);
            if (index !== -1) {
                this.menus.splice(index, 1);
                this.update();
            }
        }
    }
    onClick(e, menuPath) {
        const button = e.currentTarget.getBoundingClientRect();
        this.contextMenuRenderer.render({
            menuPath,
            anchor: {
                x: button.left + button.width,
                y: button.top,
            }
        });
    }
    render() {
        return React.createElement(React.Fragment, null, this.menus.sort((a, b) => a.order - b.order).map(menu => React.createElement("i", { key: menu.id, className: menu.iconClass, title: menu.title, onClick: e => this.onClick(e, menu.menuPath) })));
    }
};
__decorate([
    inject(ContextMenuRenderer)
], SidebarMenuWidget.prototype, "contextMenuRenderer", void 0);
SidebarMenuWidget = __decorate([
    injectable()
], SidebarMenuWidget);
export { SidebarMenuWidget };

//# sourceMappingURL=../../../lib/browser/shell/sidebar-menu-widget.js.map
