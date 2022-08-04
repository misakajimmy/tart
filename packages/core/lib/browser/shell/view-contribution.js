/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
import { inject, injectable, optional } from 'inversify';
import { CommandContribution, MenuContribution } from '../../common';
import { KeybindingContribution } from '../keybinding';
import { WidgetManager } from '../widget-manager';
import { CommonMenus } from '../common-frontend-contribution';
import { ApplicationShell } from './application-shell';
import { QuickViewService } from '../quick-input';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindViewContribution(bind, identifier) {
    const syntax = bind(identifier).toSelf().inSingletonScope();
    bind(CommandContribution).toService(identifier);
    bind(KeybindingContribution).toService(identifier);
    bind(MenuContribution).toService(identifier);
    return syntax;
}
/**
 * An abstract superclass for frontend contributions that add a view to the application shell.
 */
let AbstractViewContribution = class AbstractViewContribution {
    options;
    toggleCommand;
    widgetManager;
    shell;
    quickView;
    constructor(options) {
        this.options = options;
        if (options.toggleCommandId) {
            this.toggleCommand = {
                id: options.toggleCommandId,
                label: 'Toggle ' + this.viewLabel + ' View'
            };
        }
    }
    get viewId() {
        return this.options.widgetId;
    }
    get viewLabel() {
        return this.options.widgetName;
    }
    get defaultViewOptions() {
        return this.options.defaultWidgetOptions;
    }
    get widget() {
        return this.widgetManager.getOrCreateWidget(this.viewId);
    }
    tryGetWidget() {
        return this.widgetManager.tryGetWidget(this.viewId);
    }
    async openView(args = {}) {
        const shell = this.shell;
        const widget = await this.widgetManager.getOrCreateWidget(this.options.viewContainerId || this.viewId);
        const tabBar = shell.getTabBarFor(widget);
        const area = shell.getAreaFor(widget);
        if (!tabBar) {
            // The widget is not attached yet, so add it to the shell
            const widgetArgs = {
                ...this.defaultViewOptions,
                ...args
            };
            await shell.addWidget(widget, widgetArgs);
        }
        else if (args.toggle && area && shell.isExpanded(area) && tabBar.currentTitle === widget.title) {
            // The widget is attached and visible, so collapse the containing panel (toggle)
            switch (area) {
                case 'left':
                case 'right':
                    await shell.collapsePanel(area);
                    break;
                case 'bottom':
                    // Don't collapse the bottom panel if it's currently split
                    if (shell.bottomAreaTabBars.length === 1) {
                        await shell.collapsePanel('bottom');
                    }
                    break;
                default:
                    // The main area cannot be collapsed, so close the widget
                    await this.closeView();
            }
            return this.widget;
        }
        if (widget.isAttached && args.activate) {
            await shell.activateWidget(this.viewId);
        }
        else if (widget.isAttached && args.reveal) {
            await shell.revealWidget(this.viewId);
        }
        return this.widget;
    }
    registerCommands(commands) {
        if (this.toggleCommand) {
            commands.registerCommand(this.toggleCommand, {
                execute: () => this.toggleView()
            });
        }
        this.quickView?.registerItem({
            label: this.viewLabel,
            open: () => this.openView({ activate: true })
        });
    }
    async closeView() {
        const widget = await this.shell.closeWidget(this.viewId);
        return widget;
    }
    toggleView() {
        return this.openView({
            toggle: true,
            activate: true
        });
    }
    registerMenus(menus) {
        if (this.toggleCommand) {
            menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
                commandId: this.toggleCommand.id,
                label: this.viewLabel
            });
        }
    }
    registerKeybindings(keybindings) {
        if (this.toggleCommand && this.options.toggleKeybinding) {
            keybindings.registerKeybinding({
                command: this.toggleCommand.id,
                keybinding: this.options.toggleKeybinding
            });
        }
    }
};
__decorate([
    inject(WidgetManager)
], AbstractViewContribution.prototype, "widgetManager", void 0);
__decorate([
    inject(ApplicationShell)
], AbstractViewContribution.prototype, "shell", void 0);
__decorate([
    inject(QuickViewService),
    optional()
], AbstractViewContribution.prototype, "quickView", void 0);
AbstractViewContribution = __decorate([
    injectable()
], AbstractViewContribution);
export { AbstractViewContribution };

//# sourceMappingURL=../../../lib/browser/shell/view-contribution.js.map
