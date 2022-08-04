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
import * as React from 'react';
import { ReactWidget, Widget } from '../widgets';
import { LabelParser } from '../label-parser';
import { ContributionProvider } from '../../common/contribution-provider';
import { FrontendApplicationContribution } from '../frontend-application';
import { CommandRegistry } from '../../common/command';
import { Disposable, DisposableCollection } from '../../common/disposable';
import { ContextKeyService } from '../context-key-service';
import { Emitter, Event } from '../../common';
import { Anchor, ContextMenuRenderer } from '../context-menu-renderer';
import { MenuModelRegistry } from '../../common/menu';
/**
 * Clients should implement this interface if they want to contribute to the tab-bar toolbar.
 */
export declare const TabBarToolbarContribution: unique symbol;
/**
 * Representation of a tabbar toolbar contribution.
 */
export interface TabBarToolbarContribution {
    /**
     * Registers toolbar items.
     * @param registry the tabbar toolbar registry.
     */
    registerToolbarItems(registry: TabBarToolbarRegistry): void;
}
export interface TabBarDelegator extends Widget {
    getTabBarDelegate(): Widget | undefined;
}
export declare namespace TabBarDelegator {
    const is: (candidate?: Widget) => candidate is TabBarDelegator;
}
/**
 * Representation of an item in the tab
 */
export interface TabBarToolbarItem {
    /**
     * The unique ID of the toolbar item.
     */
    readonly id: string;
    /**
     * The command to execute.
     */
    readonly command: string;
    /**
     * Optional text of the item.
     *
     * Shamelessly copied and reused from `status-bar`:
     *
     * More details about the available `fontawesome` icons and CSS class names can be hound [here](http://fontawesome.io/icons/).
     * To set a text with icon use the following pattern in text string:
     * ```typescript
     * $(fontawesomeClassName)
     * ```
     *
     * To use animated icons use the following pattern:
     * ```typescript
     * $(fontawesomeClassName~typeOfAnimation)
     * ````
     * The type of animation can be either `spin` or `pulse`.
     * Look [here](http://fontawesome.io/examples/#animated) for more information to animated icons.
     */
    readonly text?: string;
    /**
     * Priority among the items. Can be negative. The smaller the number the left-most the item will be placed in the toolbar. It is `0` by default.
     */
    readonly priority?: number;
    /**
     * Optional group for the item. Default `navigation`.
     * `navigation` group will be inlined, while all the others will be within the `...` dropdown.
     * A group in format `submenu_group_1/submenu 1/.../submenu_group_n/ submenu n/item_group` means that the item will be located in a submenu(s) of the `...` dropdown.
     * The submenu's title is named by the submenu section name, e.g. `group/<submenu name>/subgroup`.
     */
    readonly group?: string;
    /**
     * Optional tooltip for the item.
     */
    readonly tooltip?: string;
    /**
     * Optional icon for the item.
     */
    readonly icon?: string | (() => string);
    /**
     * https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts
     */
    readonly when?: string;
    /**
     * When defined, the container tool-bar will be updated if this event is fired.
     *
     * Note: currently, each item of the container toolbar will be re-rendered if any of the items have changed.
     */
    readonly onDidChange?: Event<void>;
}
/**
 * Tab-bar toolbar item backed by a `React.ReactNode`.
 * Unlike the `TabBarToolbarItem`, this item is not connected to the command service.
 */
export interface ReactTabBarToolbarItem {
    readonly id: string;
    readonly onDidChange?: Event<void>;
    readonly when?: string;
    readonly priority?: number;
    /**
     * Optional group for the item. Default `navigation`. Always inlined.
     */
    readonly group?: string;
    render(widget?: Widget): React.ReactNode;
    isVisible?(widget: Widget): boolean;
}
export declare namespace TabBarToolbarItem {
    /**
     * Compares the items by `priority` in ascending. Undefined priorities will be treated as `0`.
     */
    const PRIORITY_COMPARATOR: (left: TabBarToolbarItem, right: TabBarToolbarItem) => number;
    function is(arg: Object | undefined): arg is TabBarToolbarItem;
}
/**
 * Main, shared registry for tab-bar toolbar items.
 */
export declare class TabBarToolbarRegistry implements FrontendApplicationContribution {
    protected items: Map<string, TabBarToolbarItem | ReactTabBarToolbarItem>;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly contextKeyService: ContextKeyService;
    protected readonly contributionProvider: ContributionProvider<TabBarToolbarContribution>;
    protected readonly onDidChangeEmitter: Emitter<void>;
    readonly onDidChange: Event<void>;
    protected fireOnDidChange: any;
    onStart(): void;
    /**
     * Registers the given item. Throws an error, if the corresponding command cannot be found or an item has been already registered for the desired command.
     *
     * @param item the item to register.
     */
    registerItem(item: TabBarToolbarItem | ReactTabBarToolbarItem): Disposable;
    /**
     * Returns an array of tab-bar toolbar items which are visible when the `widget` argument is the current one.
     *
     * By default returns with all items where the command is enabled and `item.isVisible` is `true`.
     */
    visibleItems(widget: Widget): Array<TabBarToolbarItem | ReactTabBarToolbarItem>;
    unregisterItem(itemOrId: TabBarToolbarItem | ReactTabBarToolbarItem | string): void;
}
/**
 * Factory for instantiating tab-bar toolbars.
 */
export declare const TabBarToolbarFactory: unique symbol;
export interface TabBarToolbarFactory {
    (): TabBarToolbar;
}
/**
 * Tab-bar toolbar widget representing the active [tab-bar toolbar items](TabBarToolbarItem).
 */
export declare class TabBarToolbar extends ReactWidget {
    protected current: Widget | undefined;
    protected inline: Map<string, TabBarToolbarItem | ReactTabBarToolbarItem>;
    protected more: Map<string, TabBarToolbarItem>;
    protected readonly onExecuteCommandEmitter: Emitter<void>;
    readonly onExecuteCommand: Event<void>;
    protected readonly commands: CommandRegistry;
    protected readonly labelParser: LabelParser;
    protected readonly menus: MenuModelRegistry;
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    protected readonly toolbarRegistry: TabBarToolbarRegistry;
    protected readonly toDisposeOnSetCurrent: DisposableCollection;
    constructor();
    updateItems(items: Array<TabBarToolbarItem | ReactTabBarToolbarItem>, current: Widget | undefined): void;
    updateTarget(current?: Widget): void;
    renderMoreContextMenu(anchor: Anchor): any;
    shouldHandleMouseEvent(event: MouseEvent): boolean;
    protected setCurrent(current: Widget | undefined): void;
    protected render(): React.ReactNode;
    protected renderItem(item: TabBarToolbarItem): React.ReactNode;
    protected getToolbarItemClassNames(commandId: string | undefined): string;
    protected renderMore(): React.ReactNode;
    protected showMoreContextMenu: (event: React.MouseEvent) => void;
    protected commandIsEnabled(command: string): boolean;
    protected commandIsToggled(command: string): boolean;
    protected executeCommand: (e: React.MouseEvent<HTMLElement>) => void;
    protected onMouseDownEvent: (e: React.MouseEvent<HTMLElement>) => void;
    protected onMouseUpEvent: (e: React.MouseEvent<HTMLElement>) => void;
}
export declare namespace TabBarToolbar {
    namespace Styles {
        const TAB_BAR_TOOLBAR = "p-TabBar-toolbar";
        const TAB_BAR_TOOLBAR_ITEM = "item";
    }
}
