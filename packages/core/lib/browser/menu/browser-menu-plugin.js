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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'inversify';
import { Menu as MenuWidget, MenuBar, Widget } from '@lumino/widgets';
import { CommandRegistry as PhosphorCommandRegistry } from '@lumino/commands';
import { ActionMenuNode, CommandRegistry, CompositeMenuNode, Disposable, DisposableCollection, MAIN_MENU_BAR, MenuModelRegistry } from '../../common';
import { KeybindingRegistry } from '../keybinding';
import { ContextKeyService } from '../context-key-service';
import { ContextMenuContext } from './context-menu-context';
import { waitForRevealed } from '../widgets';
import { ApplicationShell } from '../shell';
import { CorePreferences } from '../core-preferences';
export class MenuBarWidget extends MenuBar {
}
let BrowserMainMenuFactory = class BrowserMainMenuFactory {
    contextKeyService;
    corePreferences;
    context;
    commandRegistry;
    keybindingRegistry;
    menuProvider;
    get services() {
        return {
            context: this.context,
            contextKeyService: this.contextKeyService,
            commandRegistry: this.commandRegistry,
            keybindingRegistry: this.keybindingRegistry,
            menuWidgetFactory: this
        };
    }
    createMenuBar() {
        const menuBar = new DynamicMenuBarWidget();
        menuBar.id = 'tart:menubar';
        this.showMenuBar(menuBar, 'visible');
        this.corePreferences.ready.then(() => {
            this.showMenuBar(menuBar, this.corePreferences.get('window.menuBarVisibility', 'classic'));
        });
        const preferenceListener = this.corePreferences.onPreferenceChanged(preference => {
            if (preference.preferenceName === 'window.menuBarVisibility') {
                this.showMenuBar(menuBar, preference.newValue);
            }
        });
        const keybindingListener = this.keybindingRegistry.onKeybindingsChanged(() => {
            const preference = this.corePreferences['window.menuBarVisibility'];
            this.showMenuBar(menuBar, preference);
        });
        menuBar.disposed.connect(() => {
            preferenceListener.dispose();
            keybindingListener.dispose();
        });
        return menuBar;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createContextMenu(path, args) {
        const menuModel = this.menuProvider.getMenu(path);
        const menuCommandRegistry = this.createMenuCommandRegistry(menuModel, args).snapshot();
        const contextMenu = this.createMenuWidget(menuModel, { commands: menuCommandRegistry });
        return contextMenu;
    }
    createMenuWidget(menu, options) {
        return new DynamicMenuWidget(menu, options, this.services);
    }
    showMenuBar(menuBar, preference) {
        if (preference && ['classic', 'visible'].includes(preference)) {
            menuBar.clearMenus();
            this.fillMenuBar(menuBar);
        }
        else {
            menuBar.clearMenus();
        }
    }
    fillMenuBar(menuBar) {
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
        const menuCommandRegistry = this.createMenuCommandRegistry(menuModel);
        for (const menu of menuModel.children) {
            if (menu instanceof CompositeMenuNode) {
                const menuWidget = this.createMenuWidget(menu, { commands: menuCommandRegistry });
                menuBar.addMenu(menuWidget);
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createMenuCommandRegistry(menu, args = []) {
        const menuCommandRegistry = new MenuCommandRegistry(this.services);
        this.registerMenu(menuCommandRegistry, menu, args);
        return menuCommandRegistry;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerMenu(menuCommandRegistry, menu, args) {
        for (const child of menu.children) {
            if (child instanceof ActionMenuNode) {
                menuCommandRegistry.registerActionMenu(child, args);
                if (child.altNode) {
                    menuCommandRegistry.registerActionMenu(child.altNode, args);
                }
            }
            else if (child instanceof CompositeMenuNode) {
                this.registerMenu(menuCommandRegistry, child, args);
            }
            else {
                this.handleDefault(menuCommandRegistry, child, args);
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleDefault(menuCommandRegistry, menuNode, args) {
        // NOOP
    }
};
__decorate([
    inject(ContextKeyService)
], BrowserMainMenuFactory.prototype, "contextKeyService", void 0);
__decorate([
    inject(CorePreferences)
], BrowserMainMenuFactory.prototype, "corePreferences", void 0);
__decorate([
    inject(ContextMenuContext)
], BrowserMainMenuFactory.prototype, "context", void 0);
__decorate([
    inject(CommandRegistry)
], BrowserMainMenuFactory.prototype, "commandRegistry", void 0);
__decorate([
    inject(KeybindingRegistry)
], BrowserMainMenuFactory.prototype, "keybindingRegistry", void 0);
__decorate([
    inject(MenuModelRegistry)
], BrowserMainMenuFactory.prototype, "menuProvider", void 0);
BrowserMainMenuFactory = __decorate([
    injectable()
], BrowserMainMenuFactory);
export { BrowserMainMenuFactory };
export class DynamicMenuBarWidget extends MenuBarWidget {
    /**
     * We want to restore the focus after the menu closes.
     */
    previousFocusedElement;
    constructor() {
        super();
        // HACK we need to hook in on private method _openChildMenu. Don't do this at home!
        DynamicMenuBarWidget.prototype['_openChildMenu'] = () => {
            if (this.activeMenu instanceof DynamicMenuWidget) {
                // `childMenu` is `null` if we open the menu. For example, menu is not shown and you click on `Edit`.
                // However, the `childMenu` is set, when `Edit` was already open and you move the mouse over `Select`.
                // We want to save the focus object for the former case only.
                if (!this.childMenu) {
                    const { activeElement } = document;
                    if (activeElement instanceof HTMLElement) {
                        this.previousFocusedElement = activeElement;
                    }
                }
                this.activeMenu.aboutToShow({ previousFocusedElement: this.previousFocusedElement });
            }
            super['_openChildMenu']();
        };
    }
    async activateMenu(label, ...labels) {
        const menu = this.menus.find(m => m.title.label === label);
        if (!menu) {
            throw new Error(`could not find '${label}' menu`);
        }
        this.activeMenu = menu;
        this.openActiveMenu();
        await waitForRevealed(menu);
        const menuPath = [label];
        let current = menu;
        for (const itemLabel of labels) {
            const item = current.items.find(i => i.label === itemLabel);
            if (!item || !item.submenu) {
                throw new Error(`could not find '${label}' submenu in ${menuPath.map(l => "'" + l + "'").join(' -> ')} menu`);
            }
            current.activeItem = item;
            current.triggerActiveItem();
            current = item.submenu;
            await waitForRevealed(current);
        }
        return current;
    }
    async triggerMenuItem(label, ...labels) {
        if (!labels.length) {
            throw new Error('menu item label is not specified');
        }
        const menuPath = [label, ...labels.slice(0, labels.length - 1)];
        const menu = await this.activateMenu(menuPath[0], ...menuPath.slice(1));
        const item = menu.items.find(i => i.label === labels[labels.length - 1]);
        if (!item) {
            throw new Error(`could not find '${label}' item in ${menuPath.map(l => "'" + l + "'").join(' -> ')} menu`);
        }
        menu.activeItem = item;
        menu.triggerActiveItem();
        return item;
    }
}
export class MenuServices {
    commandRegistry;
    keybindingRegistry;
    contextKeyService;
    context;
    menuWidgetFactory;
}
/**
 * A menu widget that would recompute its items on update.
 */
export class DynamicMenuWidget extends MenuWidget {
    menu;
    options;
    services;
    /**
     * We want to restore the focus after the menu closes.
     */
    previousFocusedElement;
    constructor(menu, options, services) {
        super(options);
        this.menu = menu;
        this.options = options;
        this.services = services;
        if (menu.label) {
            this.title.label = menu.label;
        }
        if (menu.iconClass) {
            this.title.iconClass = menu.iconClass;
        }
        this.updateSubMenus(this, this.menu, this.options.commands);
    }
    // Hint: this is not called from the context menu use-case, but is not required.
    // For the context menu the command registry state is calculated by the factory before `open`.
    aboutToShow({ previousFocusedElement }) {
        this.preserveFocusedElement(previousFocusedElement);
        this.clearItems();
        this.runWithPreservedFocusContext(() => {
            this.options.commands.snapshot();
            this.updateSubMenus(this, this.menu, this.options.commands);
        });
    }
    open(x, y, options) {
        const cb = () => {
            this.restoreFocusedElement();
            this.aboutToClose.disconnect(cb);
        };
        this.aboutToClose.connect(cb);
        super.open(x, y, options);
    }
    handleDefault(menuNode) {
        return [];
    }
    preserveFocusedElement(previousFocusedElement = document.activeElement) {
        if (!this.previousFocusedElement && previousFocusedElement instanceof HTMLElement) {
            this.previousFocusedElement = previousFocusedElement;
            return true;
        }
        return false;
    }
    restoreFocusedElement() {
        if (this.previousFocusedElement) {
            this.previousFocusedElement.focus({ preventScroll: true });
            this.previousFocusedElement = undefined;
            return true;
        }
        return false;
    }
    runWithPreservedFocusContext(what) {
        let focusToRestore = undefined;
        const { activeElement } = document;
        if (this.previousFocusedElement && activeElement instanceof HTMLElement && this.previousFocusedElement !== activeElement) {
            focusToRestore = activeElement;
            this.previousFocusedElement.focus({ preventScroll: true });
        }
        try {
            what();
        }
        finally {
            if (focusToRestore) {
                focusToRestore.focus({ preventScroll: true });
            }
        }
    }
    updateSubMenus(parent, menu, commands) {
        const items = this.buildSubMenus([], menu, commands);
        for (const item of items) {
            parent.addItem(item);
        }
    }
    buildSubMenus(items, menu, commands) {
        for (const item of menu.children) {
            if (item instanceof CompositeMenuNode) {
                if (item.children.length) { // do not render empty nodes
                    if (item.isSubmenu) { // submenu node
                        const submenu = this.services.menuWidgetFactory.createMenuWidget(item, this.options);
                        if (!submenu.items.length) {
                            continue;
                        }
                        items.push({
                            type: 'submenu',
                            submenu,
                        });
                    }
                    else { // group node
                        const submenu = this.buildSubMenus([], item, commands);
                        if (!submenu.length) {
                            continue;
                        }
                        if (items.length) { // do not put a separator above the first group
                            items.push({
                                type: 'separator'
                            });
                        }
                        items.push(...submenu); // render children
                    }
                }
            }
            else if (item instanceof ActionMenuNode) {
                const { context, contextKeyService } = this.services;
                const node = item.altNode && context.altPressed ? item.altNode : item;
                const { when } = node.action;
                if (!(commands.isVisible(node.action.commandId) && (!when || contextKeyService.match(when)))) {
                    continue;
                }
                items.push({
                    command: node.action.commandId,
                    type: 'command'
                });
            }
            else {
                items.push(...this.handleDefault(item));
            }
        }
        return items;
    }
}
let BrowserMenuBarContribution = class BrowserMenuBarContribution {
    factory;
    shell;
    constructor(factory) {
        this.factory = factory;
    }
    get menuBar() {
        return this.shell.topPanel.widgets.find(w => w instanceof MenuBarWidget);
    }
    onStart(app) {
        this.appendMenu(app.shell);
    }
    appendMenu(shell) {
        const logo = this.createLogo();
        shell.addWidget(logo, { area: 'top' });
        const menu = this.factory.createMenuBar();
        shell.addWidget(menu, { area: 'top' });
        menu.setHidden(['compact', 'hidden'].includes(''));
    }
    createLogo() {
        const logo = new Widget();
        logo.id = 'tart:icon';
        logo.addClass('tart-icon');
        return logo;
    }
};
__decorate([
    inject(ApplicationShell)
], BrowserMenuBarContribution.prototype, "shell", void 0);
BrowserMenuBarContribution = __decorate([
    injectable(),
    __param(0, inject(BrowserMainMenuFactory))
], BrowserMenuBarContribution);
export { BrowserMenuBarContribution };
/**
 * Stores Tart-specific action menu nodes instead of PhosphorJS commands with their handlers.
 */
export class MenuCommandRegistry extends PhosphorCommandRegistry {
    services;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions = new Map();
    toDispose = new DisposableCollection();
    constructor(services) {
        super();
        this.services = services;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerActionMenu(menu, args) {
        const { commandId } = menu.action;
        const { commandRegistry } = this.services;
        const command = commandRegistry.getCommand(commandId);
        if (!command) {
            return;
        }
        const { id } = command;
        if (this.actions.has(id)) {
            return;
        }
        this.actions.set(id, [menu, args]);
    }
    snapshot() {
        this.toDispose.dispose();
        for (const [menu, args] of this.actions.values()) {
            this.toDispose.push(this.registerCommand(menu, args));
        }
        return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerCommand(menu, args) {
        const { commandRegistry, keybindingRegistry } = this.services;
        const command = commandRegistry.getCommand(menu.action.commandId);
        if (!command) {
            return Disposable.NULL;
        }
        const { id } = command;
        if (this.hasCommand(id)) {
            // several menu items can be registered for the same command in different contexts
            return Disposable.NULL;
        }
        // We freeze the `isEnabled`, `isVisible`, and `isToggled` states so they won't change.
        const enabled = commandRegistry.isEnabled(id, ...args);
        const visible = commandRegistry.isVisible(id, ...args);
        const toggled = commandRegistry.isToggled(id, ...args);
        const unregisterCommand = this.addCommand(id, {
            execute: () => commandRegistry.executeCommand(id, ...args),
            label: menu.label,
            icon: menu.icon,
            isEnabled: () => enabled,
            isVisible: () => visible,
            isToggled: () => toggled
        });
        const bindings = keybindingRegistry.getKeybindingsForCommand(id);
        // Only consider the first keybinding.
        if (bindings.length) {
            const binding = bindings[0];
            const keys = keybindingRegistry.acceleratorFor(binding);
            this.addKeyBinding({
                command: id,
                keys,
                selector: '.p-Widget' // We have the PhosphorJS dependency anyway.
            });
        }
        return Disposable.create(() => unregisterCommand.dispose());
    }
}

//# sourceMappingURL=../../../lib/browser/menu/browser-menu-plugin.js.map
