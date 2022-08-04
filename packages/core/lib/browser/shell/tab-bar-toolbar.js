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
var TabBarToolbar_1;
import { debounce } from 'lodash';
import * as React from 'react';
import { inject, injectable, named } from 'inversify';
import { ACTION_ITEM, codicon, ReactWidget } from '../widgets';
import { LabelIcon, LabelParser } from '../label-parser';
import { ContributionProvider } from '../../common/contribution-provider';
import { CommandRegistry } from '../../common/command';
import { Disposable, DisposableCollection } from '../../common/disposable';
import { ContextKeyService } from '../context-key-service';
import { Emitter } from '../../common';
import { ContextMenuRenderer } from '../context-menu-renderer';
import { MenuModelRegistry } from '../../common/menu';
/**
 * Clients should implement this interface if they want to contribute to the tab-bar toolbar.
 */
export const TabBarToolbarContribution = Symbol('TabBarToolbarContribution');
export var TabBarDelegator;
(function (TabBarDelegator) {
    TabBarDelegator.is = (candidate) => {
        if (candidate) {
            const asDelegator = candidate;
            return typeof asDelegator.getTabBarDelegate === 'function';
        }
        return false;
    };
})(TabBarDelegator || (TabBarDelegator = {}));
export var TabBarToolbarItem;
(function (TabBarToolbarItem) {
    /**
     * Compares the items by `priority` in ascending. Undefined priorities will be treated as `0`.
     */
    TabBarToolbarItem.PRIORITY_COMPARATOR = (left, right) => {
        // The navigation group is special as it will always be sorted to the top/beginning of a menu.
        const compareGroup = (leftGroup = 'navigation', rightGroup = 'navigation') => {
            if (leftGroup === 'navigation') {
                return rightGroup === 'navigation' ? 0 : -1;
            }
            if (rightGroup === 'navigation') {
                return leftGroup === 'navigation' ? 0 : 1;
            }
            return leftGroup.localeCompare(rightGroup);
        };
        const result = compareGroup(left.group, right.group);
        if (result !== 0) {
            return result;
        }
        return (left.priority || 0) - (right.priority || 0);
    };
    function is(arg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!arg && 'command' in arg && typeof arg.command === 'string';
    }
    TabBarToolbarItem.is = is;
})(TabBarToolbarItem || (TabBarToolbarItem = {}));
/**
 * Main, shared registry for tab-bar toolbar items.
 */
let TabBarToolbarRegistry = class TabBarToolbarRegistry {
    items = new Map();
    commandRegistry;
    contextKeyService;
    contributionProvider;
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    // debounce in order to avoid to fire more than once in the same tick
    fireOnDidChange = debounce(() => this.onDidChangeEmitter.fire(undefined), 0);
    onStart() {
        console.log('TabBarToolbarRegistry Start');
        const contributions = this.contributionProvider.getContributions();
        for (const contribution of contributions) {
            contribution.registerToolbarItems(this);
        }
    }
    /**
     * Registers the given item. Throws an error, if the corresponding command cannot be found or an item has been already registered for the desired command.
     *
     * @param item the item to register.
     */
    registerItem(item) {
        const { id } = item;
        if (this.items.has(id)) {
            throw new Error(`A toolbar item is already registered with the '${id}' ID.`);
        }
        this.items.set(id, item);
        this.fireOnDidChange();
        const toDispose = new DisposableCollection(Disposable.create(() => {
            this.fireOnDidChange();
        }), Disposable.create(() => this.items.delete(id)));
        if (item.onDidChange) {
            toDispose.push(item.onDidChange(() => this.fireOnDidChange()));
        }
        return toDispose;
    }
    /**
     * Returns an array of tab-bar toolbar items which are visible when the `widget` argument is the current one.
     *
     * By default returns with all items where the command is enabled and `item.isVisible` is `true`.
     */
    visibleItems(widget) {
        if (widget.isDisposed) {
            return [];
        }
        const result = [];
        for (const item of this.items.values()) {
            const visible = TabBarToolbarItem.is(item)
                ? this.commandRegistry.isVisible(item.command, widget)
                : (!item.isVisible || item.isVisible(widget));
            if (visible && (!item.when || this.contextKeyService.match(item.when, widget.node))) {
                result.push(item);
            }
        }
        return result;
    }
    unregisterItem(itemOrId) {
        const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
        if (this.items.delete(id)) {
            this.fireOnDidChange();
        }
    }
};
__decorate([
    inject(CommandRegistry)
], TabBarToolbarRegistry.prototype, "commandRegistry", void 0);
__decorate([
    inject(ContextKeyService)
], TabBarToolbarRegistry.prototype, "contextKeyService", void 0);
__decorate([
    inject(ContributionProvider),
    named(TabBarToolbarContribution)
], TabBarToolbarRegistry.prototype, "contributionProvider", void 0);
TabBarToolbarRegistry = __decorate([
    injectable()
], TabBarToolbarRegistry);
export { TabBarToolbarRegistry };
/**
 * Factory for instantiating tab-bar toolbars.
 */
export const TabBarToolbarFactory = Symbol('TabBarToolbarFactory');
/**
 * Tab-bar toolbar widget representing the active [tab-bar toolbar items](TabBarToolbarItem).
 */
let TabBarToolbar = TabBarToolbar_1 = class TabBarToolbar extends ReactWidget {
    current;
    inline = new Map();
    more = new Map();
    onExecuteCommandEmitter = new Emitter();
    onExecuteCommand = this.onExecuteCommandEmitter.event;
    commands;
    labelParser;
    menus;
    contextMenuRenderer;
    toolbarRegistry;
    toDisposeOnSetCurrent = new DisposableCollection();
    constructor() {
        super();
        this.addClass(TabBarToolbar_1.Styles.TAB_BAR_TOOLBAR);
        this.hide();
    }
    updateItems(items, current) {
        this.inline.clear();
        this.more.clear();
        for (const item of items.sort(TabBarToolbarItem.PRIORITY_COMPARATOR).reverse()) {
            if ('render' in item || item.group === undefined || item.group === 'navigation') {
                this.inline.set(item.id, item);
            }
            else {
                this.more.set(item.id, item);
            }
        }
        this.setCurrent(current);
        if (!items.length) {
            this.hide();
        }
        this.onRender.push(Disposable.create(() => {
            if (items.length) {
                this.show();
            }
        }));
        this.update();
    }
    updateTarget(current) {
        const operativeWidget = TabBarDelegator.is(current) ? current.getTabBarDelegate() : current;
        const items = operativeWidget ? this.toolbarRegistry.visibleItems(operativeWidget) : [];
        this.updateItems(items, operativeWidget);
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    renderMoreContextMenu(anchor) {
        const menuPath = ['TAB_BAR_TOOLBAR_CONTEXT_MENU'];
        const toDisposeOnHide = new DisposableCollection();
        this.addClass('menu-open');
        toDisposeOnHide.push(Disposable.create(() => this.removeClass('menu-open')));
        for (const item of this.more.values()) {
            // Register a submenu for the item, if the group is in format `<submenu group>/<submenu name>/.../<item group>`
            if (item.group?.includes('/')) {
                const split = item.group.split('/');
                const paths = [];
                for (let i = 0; i < split.length - 1; i += 2) {
                    paths.push(split[i], split[i + 1]);
                    // TODO order is missing, items sorting will be alphabetic
                    toDisposeOnHide.push(this.menus.registerSubmenu([...menuPath, ...paths], split[i + 1]));
                }
            }
            // TODO order is missing, items sorting will be alphabetic
            toDisposeOnHide.push(this.menus.registerMenuAction([...menuPath, ...item.group.split('/')], {
                label: item.tooltip,
                commandId: item.command,
                when: item.when
            }));
        }
        return this.contextMenuRenderer.render({
            menuPath,
            args: [this.current],
            anchor,
            onHide: () => toDisposeOnHide.dispose()
        });
    }
    shouldHandleMouseEvent(event) {
        return event.target instanceof Element && this.node.contains(event.target);
    }
    setCurrent(current) {
        this.toDisposeOnSetCurrent.dispose();
        this.toDispose.push(this.toDisposeOnSetCurrent);
        this.current = current;
        if (current) {
            const resetCurrent = () => {
                this.setCurrent(undefined);
                this.update();
            };
            current.disposed.connect(resetCurrent);
            this.toDisposeOnSetCurrent.push(Disposable.create(() => current.disposed.disconnect(resetCurrent)));
        }
    }
    render() {
        return React.createElement(React.Fragment, null,
            this.renderMore(),
            [...this.inline.values()].map(item => TabBarToolbarItem.is(item) ? this.renderItem(item) : item.render(this.current)));
    }
    renderItem(item) {
        let innerText = '';
        const classNames = [];
        if (item.text) {
            for (const labelPart of this.labelParser.parse(item.text)) {
                if (typeof labelPart !== 'string' && LabelIcon.is(labelPart)) {
                    const className = `fa fa-${labelPart.name}${labelPart.animation ? ' fa-' + labelPart.animation : ''}`;
                    classNames.push(...className.split(' '));
                }
                else {
                    innerText = labelPart;
                }
            }
        }
        const command = this.commands.getCommand(item.command);
        let iconClass = (typeof item.icon === 'function' && item.icon()) || item.icon || (command && command.iconClass);
        if (iconClass) {
            iconClass += ` ${ACTION_ITEM}`;
            classNames.push(iconClass);
        }
        const tooltip = item.tooltip || (command && command.label);
        const toolbarItemClassNames = this.getToolbarItemClassNames(command?.id);
        return React.createElement("div", { key: item.id, className: toolbarItemClassNames, onMouseDown: this.onMouseDownEvent, onMouseUp: this.onMouseUpEvent, onMouseOut: this.onMouseUpEvent },
            React.createElement("div", { id: item.id, className: classNames.join(' '), onClick: this.executeCommand, title: tooltip }, innerText));
    }
    getToolbarItemClassNames(commandId) {
        const classNames = [TabBarToolbar_1.Styles.TAB_BAR_TOOLBAR_ITEM];
        if (commandId) {
            if (this.commandIsEnabled(commandId)) {
                classNames.push('enabled');
            }
            if (this.commandIsToggled(commandId)) {
                classNames.push('toggled');
            }
        }
        return classNames.join(' ');
    }
    renderMore() {
        return !!this.more.size &&
            React.createElement("div", { key: '__more__', className: TabBarToolbar_1.Styles.TAB_BAR_TOOLBAR_ITEM + ' enabled' },
                React.createElement("div", { id: '__more__', className: codicon('ellipsis', true), onClick: this.showMoreContextMenu, title: 'More Actions...' }));
    }
    showMoreContextMenu = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.renderMoreContextMenu(event.nativeEvent);
    };
    commandIsEnabled(command) {
        return this.commands.isEnabled(command, this.current);
    }
    commandIsToggled(command) {
        return this.commands.isToggled(command, this.current);
    }
    executeCommand = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = this.inline.get(e.currentTarget.id);
        if (TabBarToolbarItem.is(item)) {
            this.commands.executeCommand(item.command, this.current).then(() => {
                this.onExecuteCommandEmitter.fire();
            });
        }
        this.update();
    };
    onMouseDownEvent = (e) => {
        if (e.button === 0) {
            e.currentTarget.classList.add('active');
        }
    };
    onMouseUpEvent = (e) => {
        e.currentTarget.classList.remove('active');
    };
};
__decorate([
    inject(CommandRegistry)
], TabBarToolbar.prototype, "commands", void 0);
__decorate([
    inject(LabelParser)
], TabBarToolbar.prototype, "labelParser", void 0);
__decorate([
    inject(MenuModelRegistry)
], TabBarToolbar.prototype, "menus", void 0);
__decorate([
    inject(ContextMenuRenderer)
], TabBarToolbar.prototype, "contextMenuRenderer", void 0);
__decorate([
    inject(TabBarToolbarRegistry)
], TabBarToolbar.prototype, "toolbarRegistry", void 0);
TabBarToolbar = TabBarToolbar_1 = __decorate([
    injectable()
], TabBarToolbar);
export { TabBarToolbar };
(function (TabBarToolbar) {
    let Styles;
    (function (Styles) {
        Styles.TAB_BAR_TOOLBAR = 'p-TabBar-toolbar';
        Styles.TAB_BAR_TOOLBAR_ITEM = 'item';
    })(Styles = TabBarToolbar.Styles || (TabBarToolbar.Styles = {}));
})(TabBarToolbar || (TabBarToolbar = {}));

//# sourceMappingURL=../../../lib/browser/shell/tab-bar-toolbar.js.map
