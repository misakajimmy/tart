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
import { Menu as MenuWidget, MenuBar, Widget } from '@lumino/widgets';
import { CommandRegistry as PhosphorCommandRegistry } from '@lumino/commands';
import { ActionMenuNode, CommandRegistry, CompositeMenuNode, Disposable, DisposableCollection, MenuModelRegistry, MenuNode, MenuPath } from '../../common';
import { KeybindingRegistry } from '../keybinding';
import { FrontendApplication, FrontendApplicationContribution } from '../frontend-application';
import { ContextKeyService } from '../context-key-service';
import { ContextMenuContext } from './context-menu-context';
import { ApplicationShell } from '../shell';
import { CorePreferences } from '../core-preferences';
export declare abstract class MenuBarWidget extends MenuBar {
    abstract activateMenu(label: string, ...labels: string[]): Promise<MenuWidget>;
    abstract triggerMenuItem(label: string, ...labels: string[]): Promise<MenuWidget.IItem>;
}
export declare class BrowserMainMenuFactory implements MenuWidgetFactory {
    protected readonly contextKeyService: ContextKeyService;
    protected readonly corePreferences: CorePreferences;
    protected readonly context: ContextMenuContext;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly keybindingRegistry: KeybindingRegistry;
    protected readonly menuProvider: MenuModelRegistry;
    protected get services(): MenuServices;
    createMenuBar(): MenuBarWidget;
    createContextMenu(path: MenuPath, args?: any[]): MenuWidget;
    createMenuWidget(menu: CompositeMenuNode, options: MenuWidget.IOptions & {
        commands: MenuCommandRegistry;
    }): DynamicMenuWidget;
    protected showMenuBar(menuBar: DynamicMenuBarWidget, preference: string | undefined): void;
    protected fillMenuBar(menuBar: MenuBarWidget): void;
    protected createMenuCommandRegistry(menu: CompositeMenuNode, args?: any[]): MenuCommandRegistry;
    protected registerMenu(menuCommandRegistry: MenuCommandRegistry, menu: CompositeMenuNode, args: any[]): void;
    protected handleDefault(menuCommandRegistry: MenuCommandRegistry, menuNode: MenuNode, args: any[]): void;
}
export declare class DynamicMenuBarWidget extends MenuBarWidget {
    /**
     * We want to restore the focus after the menu closes.
     */
    protected previousFocusedElement: HTMLElement | undefined;
    constructor();
    activateMenu(label: string, ...labels: string[]): Promise<MenuWidget>;
    triggerMenuItem(label: string, ...labels: string[]): Promise<MenuWidget.IItem>;
}
export declare class MenuServices {
    readonly commandRegistry: CommandRegistry;
    readonly keybindingRegistry: KeybindingRegistry;
    readonly contextKeyService: ContextKeyService;
    readonly context: ContextMenuContext;
    readonly menuWidgetFactory: MenuWidgetFactory;
}
export interface MenuWidgetFactory {
    createMenuWidget(menu: CompositeMenuNode, options: MenuWidget.IOptions & {
        commands: MenuCommandRegistry;
    }): MenuWidget;
}
/**
 * A menu widget that would recompute its items on update.
 */
export declare class DynamicMenuWidget extends MenuWidget {
    protected menu: CompositeMenuNode;
    protected options: MenuWidget.IOptions & {
        commands: MenuCommandRegistry;
    };
    protected services: MenuServices;
    /**
     * We want to restore the focus after the menu closes.
     */
    protected previousFocusedElement: HTMLElement | undefined;
    constructor(menu: CompositeMenuNode, options: MenuWidget.IOptions & {
        commands: MenuCommandRegistry;
    }, services: MenuServices);
    aboutToShow({ previousFocusedElement }: {
        previousFocusedElement: HTMLElement | undefined;
    }): void;
    open(x: number, y: number, options?: MenuWidget.IOpenOptions): void;
    protected handleDefault(menuNode: MenuNode): MenuWidget.IItemOptions[];
    protected preserveFocusedElement(previousFocusedElement?: Element | null): boolean;
    protected restoreFocusedElement(): boolean;
    protected runWithPreservedFocusContext(what: () => void): void;
    private updateSubMenus;
    private buildSubMenus;
}
export declare class BrowserMenuBarContribution implements FrontendApplicationContribution {
    protected readonly factory: BrowserMainMenuFactory;
    protected readonly shell: ApplicationShell;
    constructor(factory: BrowserMainMenuFactory);
    get menuBar(): MenuBarWidget | undefined;
    onStart(app: FrontendApplication): void;
    protected appendMenu(shell: ApplicationShell): void;
    protected createLogo(): Widget;
}
/**
 * Stores Tart-specific action menu nodes instead of PhosphorJS commands with their handlers.
 */
export declare class MenuCommandRegistry extends PhosphorCommandRegistry {
    protected services: MenuServices;
    protected actions: Map<string, [ActionMenuNode, any[]]>;
    protected toDispose: DisposableCollection;
    constructor(services: MenuServices);
    registerActionMenu(menu: ActionMenuNode, args: any[]): void;
    snapshot(): this;
    protected registerCommand(menu: ActionMenuNode, args: any[]): Disposable;
}
