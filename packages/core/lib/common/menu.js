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
import { inject, injectable, named } from 'inversify';
import { Command, CommandRegistry } from './command';
import { ContributionProvider } from './contribution-provider';
export var MenuAction;
(function (MenuAction) {
    /* Determine whether object is a MenuAction */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && arg === Object(arg) && 'commandId' in arg;
    }
    MenuAction.is = is;
})(MenuAction || (MenuAction = {}));
export const MAIN_MENU_BAR = ['menubar'];
export const SETTINGS_MENU = ['settings_menu'];
export const ACCOUNTS_MENU = ['accounts_menu'];
export const ACCOUNTS_SUBMENU = [...ACCOUNTS_MENU, '1_accounts_submenu'];
export const MenuContribution = Symbol('MenuContribution');
/**
 * The MenuModelRegistry allows to register and unregister menus, submenus and actions
 * via strings and {@link MenuAction}s without the need to access the underlying UI
 * representation.
 */
let MenuModelRegistry = class MenuModelRegistry {
    contributions;
    commands;
    root = new CompositeMenuNode('');
    constructor(contributions, commands) {
        this.contributions = contributions;
        this.commands = commands;
    }
    onStart() {
        for (const contrib of this.contributions.getContributions()) {
            contrib.registerMenus(this);
        }
    }
    /**
     * Adds the given menu action to the menu denoted by the given path.
     *
     * @returns a disposable which, when called, will remove the menu action again.
     */
    registerMenuAction(menuPath, item) {
        const menuNode = new ActionMenuNode(item, this.commands);
        return this.registerMenuNode(menuPath, menuNode);
    }
    /**
     * Adds the given menu node to the menu denoted by the given path.
     *
     * @returns a disposable which, when called, will remove the menu node again.
     */
    registerMenuNode(menuPath, menuNode) {
        const parent = this.findGroup(menuPath);
        return parent.addNode(menuNode);
    }
    /**
     * Register a new menu at the given path with the given label.
     * (If the menu already exists without a label, iconClass or order this method can be used to set them.)
     *
     * @param menuPath the path for which a new submenu shall be registered.
     * @param label the label to be used for the new submenu.
     * @param options optionally allows to set an icon class and specify the order of the new menu.
     *
     * @returns if the menu was successfully created a disposable will be returned which,
     * when called, will remove the menu again. If the menu already existed a no-op disposable
     * will be returned.
     *
     * Note that if the menu already existed and was registered with a different label an error
     * will be thrown.
     */
    registerSubmenu(menuPath, label, options) {
        if (menuPath.length === 0) {
            throw new Error('The sub menu path cannot be empty.');
        }
        const index = menuPath.length - 1;
        const menuId = menuPath[index];
        const groupPath = index === 0 ? [] : menuPath.slice(0, index);
        const parent = this.findGroup(groupPath, options);
        let groupNode = this.findSubMenu(parent, menuId, options);
        if (!groupNode) {
            groupNode = new CompositeMenuNode(menuId, label, options);
            return parent.addNode(groupNode);
        }
        else {
            if (!groupNode.label) {
                groupNode.label = label;
            }
            else if (groupNode.label !== label) {
                throw new Error("The group '" + menuPath.join('/') + "' already has a different label.");
            }
            if (options) {
                if (!groupNode.iconClass) {
                    groupNode.iconClass = options.iconClass;
                }
                if (!groupNode.order) {
                    groupNode.order = options.order;
                }
            }
            return {
                dispose: () => {
                }
            };
        }
    }
    unregisterMenuAction(itemOrCommandOrId, menuPath) {
        const id = MenuAction.is(itemOrCommandOrId) ? itemOrCommandOrId.commandId
            : Command.is(itemOrCommandOrId) ? itemOrCommandOrId.id
                : itemOrCommandOrId;
        if (menuPath) {
            const parent = this.findGroup(menuPath);
            parent.removeNode(id);
            return;
        }
        this.unregisterMenuNode(id);
    }
    /**
     * Recurse all menus, removing any menus matching the `id`.
     *
     * @param id technical identifier of the `MenuNode`.
     */
    unregisterMenuNode(id) {
        const recurse = (root) => {
            root.children.forEach(node => {
                if (node instanceof CompositeMenuNode) {
                    node.removeNode(id);
                    recurse(node);
                }
            });
        };
        recurse(this.root);
    }
    /**
     * Returns the menu at the given path.
     *
     * @param menuPath the path specifying the menu to return. If not given the empty path will be used.
     *
     * @returns the root menu when `menuPath` is empty. If `menuPath` is not empty the specified menu is
     * returned if it exists, otherwise an error is thrown.
     */
    getMenu(menuPath = []) {
        return this.findGroup(menuPath);
    }
    findGroup(menuPath, options) {
        let currentMenu = this.root;
        for (const segment of menuPath) {
            currentMenu = this.findSubMenu(currentMenu, segment, options);
        }
        return currentMenu;
    }
    findSubMenu(current, menuId, options) {
        const sub = current.children.find(e => e.id === menuId);
        if (sub instanceof CompositeMenuNode) {
            return sub;
        }
        if (sub) {
            throw new Error(`'${menuId}' is not a menu group.`);
        }
        const newSub = new CompositeMenuNode(menuId, undefined, options);
        current.addNode(newSub);
        return newSub;
    }
};
MenuModelRegistry = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(MenuContribution)),
    __param(1, inject(CommandRegistry))
], MenuModelRegistry);
export { MenuModelRegistry };
/**
 * Node representing a (sub)menu in the menu tree structure.
 */
export class CompositeMenuNode {
    id;
    label;
    iconClass;
    order;
    _children = [];
    constructor(id, label, options) {
        this.id = id;
        this.label = label;
        if (options) {
            this.iconClass = options.iconClass;
            this.order = options.order;
        }
    }
    get children() {
        return this._children;
    }
    get sortString() {
        return this.order || this.id;
    }
    get isSubmenu() {
        return this.label !== undefined;
    }
    /**
     * Indicates whether the given node is the special `navigation` menu.
     *
     * @param node the menu node to check.
     * @returns `true` when the given node is a {@link CompositeMenuNode} with id `navigation`,
     * `false` otherwise.
     */
    static isNavigationGroup(node) {
        return node instanceof CompositeMenuNode && node.id === 'navigation';
    }
    /**
     * Inserts the given node at the position indicated by `sortString`.
     *
     * @returns a disposable which, when called, will remove the given node again.
     */
    addNode(node) {
        this._children.push(node);
        this._children.sort((m1, m2) => {
            // The navigation group is special as it will always be sorted to the top/beginning of a menu.
            if (CompositeMenuNode.isNavigationGroup(m1)) {
                return -1;
            }
            if (CompositeMenuNode.isNavigationGroup(m2)) {
                return 1;
            }
            if (m1.sortString < m2.sortString) {
                return -1;
            }
            else if (m1.sortString > m2.sortString) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return {
            dispose: () => {
                const idx = this._children.indexOf(node);
                if (idx >= 0) {
                    this._children.splice(idx, 1);
                }
            }
        };
    }
    /**
     * Removes the first node with the given id.
     *
     * @param id node id.
     */
    removeNode(id) {
        const node = this._children.find(n => n.id === id);
        if (node) {
            const idx = this._children.indexOf(node);
            if (idx >= 0) {
                this._children.splice(idx, 1);
            }
        }
    }
}
/**
 * Node representing an action in the menu tree structure.
 * It's based on {@link MenuAction} for which it tries to determine the
 * best label, icon and sortString with the given data.
 */
export class ActionMenuNode {
    action;
    commands;
    altNode;
    constructor(action, commands) {
        this.action = action;
        this.commands = commands;
        if (action.alt) {
            this.altNode = new ActionMenuNode({ commandId: action.alt }, commands);
        }
    }
    get id() {
        return this.action.commandId;
    }
    get label() {
        if (this.action.label) {
            return this.action.label;
        }
        const cmd = this.commands.getCommand(this.action.commandId);
        if (!cmd) {
            console.debug(`No label for action menu node: No command "${this.action.commandId}" exists.`);
            return '';
        }
        return cmd.label || cmd.id;
    }
    get icon() {
        if (this.action.icon) {
            return this.action.icon;
        }
        const command = this.commands.getCommand(this.action.commandId);
        return command && command.iconClass;
    }
    get sortString() {
        return this.action.order || this.label;
    }
}

//# sourceMappingURL=../../lib/common/menu.js.map
