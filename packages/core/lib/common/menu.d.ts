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
import { Disposable } from './disposable';
import { Command, CommandRegistry } from './command';
import { ContributionProvider } from './contribution-provider';
/**
 * A menu entry representing an action, e.g. "New File".
 */
export interface MenuAction {
    /**
     * The command to execute.
     */
    commandId: string;
    /**
     * In addition to the mandatory command property, an alternative command can be defined.
     * It will be shown and invoked when pressing Alt while opening a menu.
     */
    alt?: string;
    /**
     * A specific label for this action. If not specified the command label or command id will be used.
     */
    label?: string;
    /**
     * Icon class(es). If not specified the icon class associated with the specified command
     * (i.e. `command.iconClass`) will be used if it exists.
     */
    icon?: string;
    /**
     * Menu entries are sorted in ascending order based on their `order` strings. If omitted the determined
     * label will be used instead.
     */
    order?: string;
    /**
     * Optional expression which will be evaluated by the {@link ContextKeyService} to determine visibility
     * of the action, e.g. `resourceLangId == markdown`.
     */
    when?: string;
}
export declare namespace MenuAction {
    function is(arg: MenuAction | any): arg is MenuAction;
}
/**
 * Additional options when creating a new submenu.
 */
export interface SubMenuOptions {
    /**
     * The class to use for the submenu icon.
     */
    iconClass?: string;
    /**
     * Menu entries are sorted in ascending order based on their `order` strings. If omitted the determined
     * label will be used instead.
     */
    order?: string;
}
export declare type MenuPath = string[];
export declare const MAIN_MENU_BAR: MenuPath;
export declare const SETTINGS_MENU: MenuPath;
export declare const ACCOUNTS_MENU: MenuPath;
export declare const ACCOUNTS_SUBMENU: string[];
export declare const MenuContribution: unique symbol;
/**
 * Representation of a menu contribution.
 *
 * Note that there are also convenience classes which combine multiple contributions into one.
 * For example to register a view together with a menu and keybinding you could use
 * {@link AbstractViewContribution} instead.
 *
 * ### Example usage
 *
 * ```ts
 * import { MenuContribution, MenuModelRegistry, MAIN_MENU_BAR } from '@tart/core';
 *
 * @injectable()
 * export class NewMenuContribution implements MenuContribution {
 *    registerMenus(menus: MenuModelRegistry): void {
 *         const menuPath = [...MAIN_MENU_BAR, '99_mymenu'];
 *         menus.registerSubmenu(menuPath, 'My Menu');
 *
 *         menus.registerMenuAction(menuPath, {
 *            commandId: MyCommand.id,
 *            label: 'My Action'
 *         });
 *     }
 * }
 * ```
 */
export interface MenuContribution {
    /**
     * Registers menus.
     * @param menus the menu model registry.
     */
    registerMenus(menus: MenuModelRegistry): void;
}
/**
 * The MenuModelRegistry allows to register and unregister menus, submenus and actions
 * via strings and {@link MenuAction}s without the need to access the underlying UI
 * representation.
 */
export declare class MenuModelRegistry {
    protected readonly contributions: ContributionProvider<MenuContribution>;
    protected readonly commands: CommandRegistry;
    protected readonly root: CompositeMenuNode;
    constructor(contributions: ContributionProvider<MenuContribution>, commands: CommandRegistry);
    onStart(): void;
    /**
     * Adds the given menu action to the menu denoted by the given path.
     *
     * @returns a disposable which, when called, will remove the menu action again.
     */
    registerMenuAction(menuPath: MenuPath, item: MenuAction): Disposable;
    /**
     * Adds the given menu node to the menu denoted by the given path.
     *
     * @returns a disposable which, when called, will remove the menu node again.
     */
    registerMenuNode(menuPath: MenuPath, menuNode: MenuNode): Disposable;
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
    registerSubmenu(menuPath: MenuPath, label: string, options?: SubMenuOptions): Disposable;
    /**
     * Unregister all menu nodes with the same id as the given menu action.
     *
     * @param item the item whose id will be used.
     * @param menuPath if specified only nodes within the path will be unregistered.
     */
    unregisterMenuAction(item: MenuAction, menuPath?: MenuPath): void;
    /**
     * Unregister all menu nodes with the same id as the given command.
     *
     * @param command the command whose id will be used.
     * @param menuPath if specified only nodes within the path will be unregistered.
     */
    unregisterMenuAction(command: Command, menuPath?: MenuPath): void;
    /**
     * Unregister all menu nodes with the given id.
     *
     * @param id the id which shall be removed.
     * @param menuPath if specified only nodes within the path will be unregistered.
     */
    unregisterMenuAction(id: string, menuPath?: MenuPath): void;
    /**
     * Recurse all menus, removing any menus matching the `id`.
     *
     * @param id technical identifier of the `MenuNode`.
     */
    unregisterMenuNode(id: string): void;
    /**
     * Returns the menu at the given path.
     *
     * @param menuPath the path specifying the menu to return. If not given the empty path will be used.
     *
     * @returns the root menu when `menuPath` is empty. If `menuPath` is not empty the specified menu is
     * returned if it exists, otherwise an error is thrown.
     */
    getMenu(menuPath?: MenuPath): CompositeMenuNode;
    protected findGroup(menuPath: MenuPath, options?: SubMenuOptions): CompositeMenuNode;
    protected findSubMenu(current: CompositeMenuNode, menuId: string, options?: SubMenuOptions): CompositeMenuNode;
}
/**
 * Base interface of the nodes used in the menu tree structure.
 */
export interface MenuNode {
    /**
     * the optional label for this specific node.
     */
    readonly label?: string;
    /**
     * technical identifier.
     */
    readonly id: string;
    /**
     * Menu nodes are sorted in ascending order based on their `sortString`.
     */
    readonly sortString: string;
}
/**
 * Node representing a (sub)menu in the menu tree structure.
 */
export declare class CompositeMenuNode implements MenuNode {
    readonly id: string;
    label?: string;
    iconClass?: string;
    order?: string;
    protected readonly _children: MenuNode[];
    constructor(id: string, label?: string, options?: SubMenuOptions);
    get children(): ReadonlyArray<MenuNode>;
    get sortString(): string;
    get isSubmenu(): boolean;
    /**
     * Indicates whether the given node is the special `navigation` menu.
     *
     * @param node the menu node to check.
     * @returns `true` when the given node is a {@link CompositeMenuNode} with id `navigation`,
     * `false` otherwise.
     */
    static isNavigationGroup(node: MenuNode): node is CompositeMenuNode;
    /**
     * Inserts the given node at the position indicated by `sortString`.
     *
     * @returns a disposable which, when called, will remove the given node again.
     */
    addNode(node: MenuNode): Disposable;
    /**
     * Removes the first node with the given id.
     *
     * @param id node id.
     */
    removeNode(id: string): void;
}
/**
 * Node representing an action in the menu tree structure.
 * It's based on {@link MenuAction} for which it tries to determine the
 * best label, icon and sortString with the given data.
 */
export declare class ActionMenuNode implements MenuNode {
    readonly action: MenuAction;
    protected readonly commands: CommandRegistry;
    readonly altNode: ActionMenuNode | undefined;
    constructor(action: MenuAction, commands: CommandRegistry);
    get id(): string;
    get label(): string;
    get icon(): string | undefined;
    get sortString(): string;
}
