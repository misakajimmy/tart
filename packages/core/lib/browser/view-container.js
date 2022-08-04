/********************************************************************************
 * Copyright (C) 2018-2019 TypeFox and others.
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
var ViewContainer_1;
import { inject, injectable, postConstruct } from 'inversify';
import { ArrayExt, every, find, map, some, toArray } from '@lumino/algorithm';
import { addEventListener, addKeyListener, BaseWidget, CODICON_TREE_ITEM_CLASSES, COLLAPSED_CLASS, EXPANSION_TOGGLE_CLASS, MessageLoop, PanelLayout, SplitLayout, SplitPanel, UnsafeWidgetUtilities, waitForRevealed, Widget } from './widgets';
import { Emitter, isEmpty } from '../common';
import { Disposable, DisposableCollection } from '../common/disposable';
import { CommandRegistry } from '../common/command';
import { MenuModelRegistry } from '../common/menu';
import { ApplicationShell, SIDE_PANEL_TOOLBAR_CONTEXT_MENU, SplitPositionHandler } from './shell';
import { BOTTOM_AREA_ID, MAIN_AREA_ID } from './shell/tart-dock-panel';
import { FrontendApplicationStateService } from './frontend-application-state';
import { ContextMenuRenderer } from './context-menu-renderer';
import { parseCssMagnitude } from './browser';
import { WidgetManager } from './widget-manager';
import { TabBarToolbarFactory, TabBarToolbarRegistry } from './shell/tab-bar-toolbar';
import { Key } from './keys';
import { ProgressBarFactory } from './progress-bar-factory';
import { TabBarDecoratorService } from './shell/tab-bar-decorator';
import { Drag } from '@lumino/dragdrop';
import { ElementExt } from '@lumino/domutils';
import { MimeData } from '@lumino/coreutils';
import { DockPanel } from '@lumino/widgets';
let ViewContainerIdentifier = class ViewContainerIdentifier {
    id;
    progressLocationId;
};
ViewContainerIdentifier = __decorate([
    injectable()
], ViewContainerIdentifier);
export { ViewContainerIdentifier };
export var DescriptionWidget;
(function (DescriptionWidget) {
    function is(arg) {
        return !!arg && typeof arg === 'object' && 'onDidChangeDescription' in arg;
    }
    DescriptionWidget.is = is;
})(DescriptionWidget || (DescriptionWidget = {}));
/**
 * A view container holds an arbitrary number of widgets inside a split panel.
 * Each widget is wrapped in a _part_ that displays the widget title and toolbar
 * and allows to collapse / expand the widget content.
 */
let ViewContainer = ViewContainer_1 = class ViewContainer extends BaseWidget {
    /**
     * Disable dragging parts from/to this view container.
     */
    disableDNDBetweenContainers = false;
    options;
    toDisposeOnDragEnd = new DisposableCollection();
    panel;
    currentPart;
    applicationStateService;
    contextMenuRenderer;
    commandRegistry;
    menuRegistry;
    widgetManager;
    splitPositionHandler;
    toolbarRegistry;
    toolbarFactory;
    onDidChangeTrackableWidgetsEmitter = new Emitter();
    onDidChangeTrackableWidgets = this.onDidChangeTrackableWidgetsEmitter.event;
    progressBarFactory;
    shell;
    decoratorService;
    toDisposeOnCurrentPart = new DisposableCollection();
    titleOptions;
    toDisposeOnUpdateTitle = new DisposableCollection();
    _tabBarDelegate = this;
    toRemoveWidgets = new Map();
    lastVisibleState;
    get containerLayout() {
        const layout = this.panel.layout;
        if (layout instanceof ViewContainerLayout) {
            return layout;
        }
        throw new Error('view container is disposed');
    }
    get orientation() {
        return ViewContainer_1.getOrientation(this.node);
    }
    get enableAnimation() {
        return this.applicationStateService.state === 'ready';
    }
    get contextMenuPath() {
        return [`${this.id}-context-menu`];
    }
    get globalHideCommandId() {
        return `${this.id}:toggle-visibility`;
    }
    setTitleOptions(titleOptions) {
        this.titleOptions = titleOptions;
        this.updateTitle();
    }
    updateTabBarDelegate() {
        const visibleParts = this.getParts().filter(part => !part.isHidden);
        if (visibleParts.length === 1) {
            this._tabBarDelegate = visibleParts[0].wrapped;
        }
        else {
            this._tabBarDelegate = this;
        }
    }
    getTabBarDelegate() {
        return this._tabBarDelegate;
    }
    addWidget(widget, options, originalContainerId, originalContainerTitle) {
        const existing = this.toRemoveWidgets.get(widget.id);
        if (existing) {
            return existing;
        }
        const partId = this.createPartId(widget);
        const newPart = this.createPart(widget, partId, originalContainerId || this.id, originalContainerTitle || this.titleOptions, options);
        return this.attachNewPart(newPart);
    }
    removeWidget(widget) {
        const disposable = this.toRemoveWidgets.get(widget.id);
        if (disposable) {
            disposable.dispose();
            return true;
        }
        return false;
    }
    getParts() {
        return this.containerLayout.widget;
    }
    getPartFor(widget) {
        return this.getParts().find(p => p.wrapped.id === widget.id);
    }
    storeState() {
        if (!this.isVisible && this.lastVisibleState) {
            return this.lastVisibleState;
        }
        return this.doStoreState();
    }
    restoreState(state) {
        this.lastVisibleState = state;
        this.doRestoreState(state);
    }
    getTrackableWidgets() {
        return this.getParts().map(w => w.wrapped);
    }
    activateWidget(id) {
        const part = this.revealPart(id);
        if (!part) {
            return undefined;
        }
        this.updateCurrentPart(part);
        part.collapsed = false;
        return part.wrapped;
    }
    revealWidget(id) {
        const part = this.revealPart(id);
        return part && part.wrapped;
    }
    handleEvent(event) {
        switch (event.type) {
            case 'p-dragenter':
                this.handleDragEnter(event);
                break;
            case 'p-dragover':
                this.handleDragOver(event);
                break;
            case 'p-dragleave':
                this.handleDragLeave(event);
                break;
            case 'p-drop':
                this.handleDrop(event);
                break;
        }
    }
    handleDragEnter(event) {
        if (event.mimeData.hasData('application/vnd.phosphor.view-container-factory')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    handleDragOver(event) {
        const factory = event.mimeData.getData('application/vnd.phosphor.view-container-factory');
        const widget = factory && factory();
        if (!(widget instanceof ViewContainerPart)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const sameContainers = this.id === widget.currentViewContainerId;
        const targetPart = ArrayExt.findFirstValue(this.getParts(), (p => ElementExt.hitTest(p.node, event.clientX, event.clientY)));
        if (!targetPart && sameContainers) {
            event.dropAction = 'none';
            return;
        }
        if (targetPart) {
            // add overlay class style to the `targetPart` node.
            targetPart.node.classList.add('drop-target');
            this.toDisposeOnDragEnd.push(Disposable.create(() => targetPart.node.classList.remove('drop-target')));
        }
        else {
            // show panel overlay.
            const dockPanel = this.getDockPanel();
            if (dockPanel) {
                dockPanel.overlay.show({ top: 0, bottom: 0, right: 0, left: 0 });
                this.toDisposeOnDragEnd.push(Disposable.create(() => dockPanel.overlay.hide(100)));
            }
        }
        const isDraggingOutsideDisabled = this.disableDNDBetweenContainers || widget.viewContainer?.disableDNDBetweenContainers
            || widget.options.disableDraggingToOtherContainers;
        if (isDraggingOutsideDisabled && !sameContainers) {
            const { target } = event;
            if (target instanceof HTMLElement) {
                target.classList.add('tart-cursor-no-drop');
                this.toDisposeOnDragEnd.push(Disposable.create(() => {
                    target.classList.remove('tart-cursor-no-drop');
                }));
            }
            event.dropAction = 'none';
            return;
        }
        event.dropAction = event.proposedAction;
    }
    ;
    handleDragLeave(event) {
        this.toDisposeOnDragEnd.dispose();
        if (event.mimeData.hasData('application/vnd.phosphor.view-container-factory')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    ;
    handleDrop(event) {
        this.toDisposeOnDragEnd.dispose();
        const factory = event.mimeData.getData('application/vnd.phosphor.view-container-factory');
        const draggedPart = factory && factory();
        if (!(draggedPart instanceof ViewContainerPart)) {
            event.dropAction = 'none';
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const parts = this.getParts();
        const toIndex = ArrayExt.findFirstIndex(parts, part => ElementExt.hitTest(part.node, event.clientX, event.clientY));
        if (draggedPart.currentViewContainerId !== this.id) {
            this.attachNewPart(draggedPart, toIndex > -1 ? toIndex + 1 : toIndex);
            draggedPart.onPartMoved(this);
        }
        else {
            this.moveBefore(draggedPart.id, parts[toIndex].id);
        }
        event.dropAction = event.proposedAction;
    }
    init() {
        this.id = this.options.id;
        this.addClass('tart-view-container');
        const layout = new PanelLayout();
        this.layout = layout;
        this.panel = new SplitPanel({
            layout: new ViewContainerLayout({
                renderer: SplitPanel.defaultRenderer,
                orientation: this.orientation,
                spacing: 2,
                headerSize: ViewContainerPart.HEADER_HEIGHT,
                animationDuration: 200
            }, this.splitPositionHandler)
        });
        this.panel.node.tabIndex = -1;
        this.configureLayout(layout);
        const { commandRegistry, menuRegistry, contextMenuRenderer } = this;
        this.toDispose.pushAll([
            addEventListener(this.node, 'contextmenu', event => {
                if (event.button === 2 && every(this.containerLayout.iter(), part => !!part.isHidden)) {
                    event.stopPropagation();
                    event.preventDefault();
                    contextMenuRenderer.render({ menuPath: this.contextMenuPath, anchor: event });
                }
            }),
            commandRegistry.registerCommand({ id: this.globalHideCommandId }, {
                execute: (anchor) => {
                    const toHide = this.findPartForAnchor(anchor);
                    if (toHide && toHide.canHide) {
                        toHide.hide();
                    }
                },
                isVisible: (anchor) => {
                    const toHide = this.findPartForAnchor(anchor);
                    if (toHide) {
                        return toHide.canHide && !toHide.isHidden;
                    }
                    else {
                        return some(this.containerLayout.iter(), part => !part.isHidden);
                    }
                }
            }),
            menuRegistry.registerMenuAction([...this.contextMenuPath, '0_global'], {
                commandId: this.globalHideCommandId,
                label: 'Hide'
            }),
            this.onDidChangeTrackableWidgetsEmitter,
            this.onDidChangeTrackableWidgets(() => this.decoratorService.fireDidChangeDecorations())
        ]);
        if (this.options.progressLocationId) {
            this.toDispose.push(this.progressBarFactory({
                container: this.node,
                insertMode: 'prepend',
                locationId: this.options.progressLocationId
            }));
        }
    }
    configureLayout(layout) {
        layout.addWidget(this.panel);
    }
    updateCurrentPart(part) {
        if (part && this.getParts().indexOf(part) !== -1) {
            this.currentPart = part;
        }
        if (this.currentPart && !this.currentPart.isDisposed) {
            return;
        }
        const visibleParts = this.getParts().filter(p => !p.isHidden);
        const expandedParts = visibleParts.filter(p => !p.collapsed);
        this.currentPart = expandedParts[0] || visibleParts[0];
    }
    updateTitle() {
        this.toDisposeOnUpdateTitle.dispose();
        this.toDispose.push(this.toDisposeOnUpdateTitle);
        this.updateTabBarDelegate();
        let title = Object.assign({}, this.titleOptions);
        if (isEmpty(title)) {
            return;
        }
        const allParts = this.getParts();
        const visibleParts = allParts.filter(part => !part.isHidden);
        this.title.label = title.label;
        // If there's only one visible part - inline it's title into the container title except in case the part
        // isn't originally belongs to this container but there are other **original** hidden parts.
        if (visibleParts.length === 1 && (visibleParts[0].originalContainerId === this.id || !this.findOriginalPart())) {
            const part = visibleParts[0];
            this.toDisposeOnUpdateTitle.push(part.onTitleChanged(() => this.updateTitle()));
            const partLabel = part.wrapped.title.label;
            // Change the container title if it contains only one part that originally belongs to another container.
            if (allParts.length === 1 && part.originalContainerId !== this.id && !this.isCurrentTitle(part.originalContainerTitle)) {
                title = Object.assign({}, part.originalContainerTitle);
                this.setTitleOptions(title);
                return;
            }
            if (partLabel) {
                if (this.title.label && this.title.label !== partLabel) {
                    this.title.label += ': ' + partLabel;
                }
                else {
                    this.title.label = partLabel;
                }
            }
            part.collapsed = false;
            part.hideTitle();
        }
        else {
            visibleParts.forEach(part => part.showTitle());
            // If at least one part originally belongs to this container the title should return to its original value.
            const originalPart = this.findOriginalPart();
            if (originalPart && !this.isCurrentTitle(originalPart.originalContainerTitle)) {
                title = Object.assign({}, originalPart.originalContainerTitle);
                this.setTitleOptions(title);
                return;
            }
        }
        this.updateToolbarItems(allParts);
        const caption = title?.caption || title?.label;
        if (caption) {
            this.title.caption = caption;
            if (visibleParts.length === 1) {
                const partCaption = visibleParts[0].wrapped.title.caption || visibleParts[0].wrapped.title.label;
                if (partCaption) {
                    this.title.caption += ': ' + partCaption;
                }
            }
        }
        if (title.iconClass) {
            this.title.iconClass = title.iconClass;
        }
        if (title.closeable !== undefined) {
            this.title.closable = title.closeable;
        }
    }
    updateToolbarItems(allParts) {
        if (allParts.length > 1) {
            const group = this.getToggleVisibilityGroupLabel();
            for (const part of allParts) {
                const existingId = this.toggleVisibilityCommandId(part);
                const { caption, label, dataset: { visibilityCommandLabel } } = part.wrapped.title;
                this.registerToolbarItem(existingId, { tooltip: visibilityCommandLabel || caption || label, group });
            }
        }
    }
    getToggleVisibilityGroupLabel() {
        return 'view';
    }
    registerToolbarItem(commandId, options) {
        const newId = `${this.id}-tabbar-toolbar-${commandId}`;
        const existingHandler = this.commandRegistry.getAllHandlers(commandId)[0];
        const existingCommand = this.commandRegistry.getCommand(commandId);
        if (existingHandler && existingCommand) {
            this.toDisposeOnUpdateTitle.push(this.commandRegistry.registerCommand({ ...existingCommand, id: newId }, {
                execute: (_widget, ...args) => this.commandRegistry.executeCommand(commandId, ...args),
                isToggled: (_widget, ...args) => this.commandRegistry.isToggled(commandId, ...args),
                isEnabled: (_widget, ...args) => this.commandRegistry.isEnabled(commandId, ...args),
                isVisible: (widget, ...args) => widget === this.getTabBarDelegate() && this.commandRegistry.isVisible(commandId, ...args),
            }));
            this.toDisposeOnUpdateTitle.push(this.toolbarRegistry.registerItem({
                ...options,
                id: newId,
                command: newId,
            }));
        }
    }
    findOriginalPart() {
        return this.getParts().find(part => part.originalContainerId === this.id);
    }
    isCurrentTitle(titleOptions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (!!titleOptions && !!this.titleOptions && Object.keys(titleOptions).every(key => titleOptions[key] === this.titleOptions[key]))
            || (!titleOptions && !this.titleOptions);
    }
    findPartForAnchor(anchor) {
        const element = document.elementFromPoint(anchor.x, anchor.y);
        if (element instanceof Element) {
            const closestPart = ViewContainerPart.closestPart(element);
            if (closestPart && closestPart.id) {
                return find(this.containerLayout.iter(), part => part.id === closestPart.id);
            }
        }
        return undefined;
    }
    createPartId(widget) {
        const description = this.widgetManager.getDescription(widget);
        return widget.id || JSON.stringify(description);
    }
    attachNewPart(newPart, insertIndex) {
        const toRemoveWidget = new DisposableCollection();
        this.toDispose.push(toRemoveWidget);
        this.toRemoveWidgets.set(newPart.wrapped.id, toRemoveWidget);
        toRemoveWidget.push(Disposable.create(() => this.toRemoveWidgets.delete(newPart.wrapped.id)));
        this.registerPart(newPart);
        if (insertIndex !== undefined || (newPart.options && newPart.options.order !== undefined)) {
            const index = insertIndex ?? this.getParts().findIndex(part => part.options.order === undefined || part.options.order > newPart.options.order);
            if (index >= 0) {
                this.containerLayout.insertWidget(index, newPart);
            }
            else {
                this.containerLayout.addWidget(newPart);
            }
        }
        else {
            this.containerLayout.addWidget(newPart);
        }
        this.refreshMenu(newPart);
        this.updateTitle();
        this.updateCurrentPart();
        this.update();
        this.fireDidChangeTrackableWidgets();
        toRemoveWidget.pushAll([
            Disposable.create(() => {
                if (newPart.currentViewContainerId === this.id) {
                    newPart.dispose();
                }
                this.unregisterPart(newPart);
                if (!newPart.isDisposed && this.getPartIndex(newPart.id) > -1) {
                    this.containerLayout.removeWidget(newPart);
                }
                if (!this.isDisposed) {
                    this.update();
                    this.updateTitle();
                    this.updateCurrentPart();
                    this.fireDidChangeTrackableWidgets();
                }
            }),
            this.registerDND(newPart),
            newPart.onDidChangeVisibility(() => {
                this.updateTitle();
                this.updateCurrentPart();
            }),
            newPart.onCollapsed(() => {
                this.containerLayout.updateCollapsed(newPart, this.enableAnimation);
                this.updateCurrentPart();
            }),
            newPart.onContextMenu(event => {
                if (event.button === 2) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.contextMenuRenderer.render({ menuPath: this.contextMenuPath, anchor: event });
                }
            }),
            newPart.onTitleChanged(() => this.refreshMenu(newPart)),
            newPart.onDidFocus(() => this.updateCurrentPart(newPart))
        ]);
        newPart.disposed.connect(() => toRemoveWidget.dispose());
        return toRemoveWidget;
    }
    createPart(widget, partId, originalContainerId, originalContainerTitle, options) {
        return new ViewContainerPart(widget, partId, this.id, originalContainerId, originalContainerTitle, this.toolbarRegistry, this.toolbarFactory, options);
    }
    getPartIndex(partId) {
        if (partId) {
            return this.getParts().findIndex(part => part.id === partId);
        }
        return -1;
    }
    doStoreState() {
        const parts = this.getParts();
        const availableSize = this.containerLayout.getAvailableSize();
        const orientation = this.orientation;
        const partStates = parts.map(part => {
            let size = this.containerLayout.getPartSize(part);
            if (size && size > ViewContainerPart.HEADER_HEIGHT && orientation === 'vertical') {
                size -= ViewContainerPart.HEADER_HEIGHT;
            }
            return {
                widget: part.wrapped,
                partId: part.partId,
                collapsed: part.collapsed,
                hidden: part.isHidden,
                relativeSize: size && availableSize ? size / availableSize : undefined,
                originalContainerId: part.originalContainerId,
                originalContainerTitle: part.originalContainerTitle
            };
        });
        return { parts: partStates, title: this.titleOptions };
    }
    doRestoreState(state) {
        this.setTitleOptions(state.title);
        // restore widgets
        for (const part of state.parts) {
            if (part.widget) {
                this.addWidget(part.widget, undefined, part.originalContainerId, part.originalContainerTitle || {});
            }
        }
        const partStates = state.parts.filter(partState => some(this.containerLayout.iter(), p => p.partId === partState.partId));
        // Reorder the parts according to the stored state
        for (let index = 0; index < partStates.length; index++) {
            const partState = partStates[index];
            const currentIndex = this.getParts().findIndex(part => part.partId === partState.partId);
            if (currentIndex > index) {
                this.containerLayout.moveWidget(currentIndex, index, this.getParts()[currentIndex]);
            }
        }
        // Restore visibility and collapsed state
        const parts = this.getParts();
        for (let index = 0; index < parts.length; index++) {
            const part = parts[index];
            const partState = partStates.find(s => part.partId === s.partId);
            if (partState) {
                part.setHidden(partState.hidden);
                part.collapsed = partState.collapsed || !partState.relativeSize;
            }
            else if (part.canHide) {
                part.hide();
            }
            this.refreshMenu(part);
        }
        // Restore part sizes
        waitForRevealed(this).then(() => {
            this.containerLayout.setPartSizes(partStates.map(partState => partState.relativeSize));
        });
    }
    /**
     * Register a command to toggle the visibility of the new part.
     */
    registerPart(toRegister) {
        const commandId = this.toggleVisibilityCommandId(toRegister);
        this.commandRegistry.registerCommand({ id: commandId }, {
            execute: () => {
                const toHide = find(this.containerLayout.iter(), part => part.id === toRegister.id);
                if (toHide) {
                    toHide.setHidden(!toHide.isHidden);
                }
            },
            isToggled: () => {
                if (!toRegister.canHide) {
                    return true;
                }
                const widgetToToggle = find(this.containerLayout.iter(), part => part.id === toRegister.id);
                if (widgetToToggle) {
                    return !widgetToToggle.isHidden;
                }
                return false;
            },
            isEnabled: arg => toRegister.canHide && (!this.titleOptions || !(arg instanceof Widget) || (arg instanceof ViewContainer_1 && arg.id === this.id)),
            isVisible: arg => !this.titleOptions || !(arg instanceof Widget) || (arg instanceof ViewContainer_1 && arg.id === this.id)
        });
    }
    /**
     * Register a menu action to toggle the visibility of the new part.
     * The menu action is unregistered first to enable refreshing the order of menu actions.
     */
    refreshMenu(part) {
        const commandId = this.toggleVisibilityCommandId(part);
        this.menuRegistry.unregisterMenuAction(commandId);
        if (!part.wrapped.title.label) {
            return;
        }
        const { dataset: { visibilityCommandLabel }, caption, label } = part.wrapped.title;
        const action = {
            commandId: commandId,
            label: visibilityCommandLabel || caption || label,
            order: this.getParts().indexOf(part).toString()
        };
        this.menuRegistry.registerMenuAction([...this.contextMenuPath, '1_widgets'], action);
        if (this.titleOptions) {
            this.menuRegistry.registerMenuAction([...SIDE_PANEL_TOOLBAR_CONTEXT_MENU, 'navigation'], action);
        }
    }
    unregisterPart(part) {
        const commandId = this.toggleVisibilityCommandId(part);
        this.commandRegistry.unregisterCommand(commandId);
        this.menuRegistry.unregisterMenuAction(commandId);
    }
    toggleVisibilityCommandId(part) {
        return `${this.id}:toggle-visibility-${part.id}`;
    }
    moveBefore(toMovedId, moveBeforeThisId) {
        const parts = this.getParts();
        const toMoveIndex = parts.findIndex(part => part.id === toMovedId);
        const moveBeforeThisIndex = parts.findIndex(part => part.id === moveBeforeThisId);
        if (toMoveIndex >= 0 && moveBeforeThisIndex >= 0) {
            this.containerLayout.moveWidget(toMoveIndex, moveBeforeThisIndex, parts[toMoveIndex]);
            for (let index = Math.min(toMoveIndex, moveBeforeThisIndex); index < parts.length; index++) {
                this.refreshMenu(parts[index]);
                this.activate();
            }
        }
    }
    fireDidChangeTrackableWidgets() {
        this.onDidChangeTrackableWidgetsEmitter.fire(this.getTrackableWidgets());
    }
    revealPart(id) {
        const part = this.getParts().find(p => p.wrapped.id === id);
        if (!part) {
            return undefined;
        }
        part.setHidden(false);
        return part;
    }
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        if (this.currentPart) {
            this.currentPart.activate();
        }
        else {
            this.panel.node.focus({ preventScroll: true });
        }
    }
    onAfterAttach(msg) {
        const orientation = this.orientation;
        this.containerLayout.orientation = orientation;
        if (orientation === 'horizontal') {
            for (const part of this.getParts()) {
                part.collapsed = false;
            }
        }
        super.onAfterAttach(msg);
    }
    onBeforeHide(msg) {
        super.onBeforeHide(msg);
        this.lastVisibleState = this.storeState();
    }
    onAfterShow(msg) {
        super.onAfterShow(msg);
        this.updateTitle();
        this.lastVisibleState = undefined;
    }
    onBeforeAttach(msg) {
        super.onBeforeAttach(msg);
        this.node.addEventListener('p-dragenter', this, true);
        this.node.addEventListener('p-dragover', this, true);
        this.node.addEventListener('p-dragleave', this, true);
        this.node.addEventListener('p-drop', this, true);
    }
    onAfterDetach(msg) {
        super.onAfterDetach(msg);
        this.node.removeEventListener('p-dragenter', this, true);
        this.node.removeEventListener('p-dragover', this, true);
        this.node.removeEventListener('p-dragleave', this, true);
        this.node.removeEventListener('p-drop', this, true);
    }
    registerDND(part) {
        part.headerElement.draggable = true;
        return new DisposableCollection(addEventListener(part.headerElement, 'dragstart', event => {
            event.preventDefault();
            const mimeData = new MimeData();
            mimeData.setData('application/vnd.phosphor.view-container-factory', () => part);
            const clonedHeader = part.headerElement.cloneNode(true);
            clonedHeader.style.width = part.node.style.width;
            clonedHeader.style.opacity = '0.6';
            const drag = new Drag({
                mimeData,
                dragImage: clonedHeader,
                proposedAction: 'move',
                supportedActions: 'move'
            });
            part.node.classList.add('p-mod-hidden');
            drag.start(event.clientX, event.clientY).then(dropAction => {
                // The promise is resolved when the drag has ended
                if (dropAction === 'move' && part.currentViewContainerId !== this.id) {
                    this.removeWidget(part.wrapped);
                    this.lastVisibleState = this.doStoreState();
                }
            });
            setTimeout(() => {
                part.node.classList.remove('p-mod-hidden');
            }, 0);
        }, false));
    }
    getDockPanel() {
        let panel;
        let parent = this.parent;
        while (!panel && parent) {
            if (this.isSideDockPanel(parent)) {
                panel = parent;
            }
            else {
                parent = parent.parent;
            }
        }
        return panel;
    }
    isSideDockPanel(widget) {
        // @ts-ignore
        const { leftPanelHandler, rightPanelHandler } = this.shell;
        if (widget instanceof DockPanel && (widget.id === rightPanelHandler.dockPanel.id || widget.id === leftPanelHandler.dockPanel.id)) {
            return true;
        }
        return false;
    }
};
__decorate([
    inject(ViewContainerIdentifier)
], ViewContainer.prototype, "options", void 0);
__decorate([
    inject(FrontendApplicationStateService)
], ViewContainer.prototype, "applicationStateService", void 0);
__decorate([
    inject(ContextMenuRenderer)
], ViewContainer.prototype, "contextMenuRenderer", void 0);
__decorate([
    inject(CommandRegistry)
], ViewContainer.prototype, "commandRegistry", void 0);
__decorate([
    inject(MenuModelRegistry)
], ViewContainer.prototype, "menuRegistry", void 0);
__decorate([
    inject(WidgetManager)
], ViewContainer.prototype, "widgetManager", void 0);
__decorate([
    inject(SplitPositionHandler)
], ViewContainer.prototype, "splitPositionHandler", void 0);
__decorate([
    inject(TabBarToolbarRegistry)
], ViewContainer.prototype, "toolbarRegistry", void 0);
__decorate([
    inject(TabBarToolbarFactory)
], ViewContainer.prototype, "toolbarFactory", void 0);
__decorate([
    inject(ProgressBarFactory)
], ViewContainer.prototype, "progressBarFactory", void 0);
__decorate([
    inject(ApplicationShell)
], ViewContainer.prototype, "shell", void 0);
__decorate([
    inject(TabBarDecoratorService)
], ViewContainer.prototype, "decoratorService", void 0);
__decorate([
    postConstruct()
], ViewContainer.prototype, "init", null);
ViewContainer = ViewContainer_1 = __decorate([
    injectable()
], ViewContainer);
export { ViewContainer };
(function (ViewContainer) {
    ViewContainer.Factory = Symbol('ViewContainerFactory');
    function getOrientation(node) {
        if (node.closest(`#${MAIN_AREA_ID}`) || node.closest(`#${BOTTOM_AREA_ID}`)) {
            return 'horizontal';
        }
        return 'vertical';
    }
    ViewContainer.getOrientation = getOrientation;
})(ViewContainer || (ViewContainer = {}));
/**
 * Wrapper around a widget held by a view container. Adds a header to display the
 * title, toolbar, and collapse / expand handle.
 */
export class ViewContainerPart extends BaseWidget {
    wrapped;
    partId;
    currentContainerId;
    originalContainerId;
    originalContainerTitle;
    toolbarRegistry;
    toolbarFactory;
    options;
    /**
     * @deprecated since 0.11.0, use `onDidChangeVisibility` instead
     */
    onVisibilityChanged = this.onDidChangeVisibility;
    uncollapsedSize;
    animatedSize;
    header;
    body;
    collapsedEmitter = new Emitter();
    contextMenuEmitter = new Emitter();
    onTitleChangedEmitter = new Emitter();
    onTitleChanged = this.onTitleChangedEmitter.event;
    onDidFocusEmitter = new Emitter();
    onDidFocus = this.onDidFocusEmitter.event;
    onPartMovedEmitter = new Emitter();
    onDidMove = this.onPartMovedEmitter.event;
    onDidChangeDescriptionEmitter = new Emitter();
    onDidChangeDescription = this.onDidChangeDescriptionEmitter.event;
    toolbar;
    toNoDisposeWrapped;
    toShowHeader = new DisposableCollection();
    constructor(wrapped, partId, currentContainerId, originalContainerId, originalContainerTitle, toolbarRegistry, toolbarFactory, options = {}) {
        super();
        this.wrapped = wrapped;
        this.partId = partId;
        this.currentContainerId = currentContainerId;
        this.originalContainerId = originalContainerId;
        this.originalContainerTitle = originalContainerTitle;
        this.toolbarRegistry = toolbarRegistry;
        this.toolbarFactory = toolbarFactory;
        this.options = options;
        wrapped.parent = this;
        wrapped.disposed.connect(() => this.dispose());
        this.id = `${originalContainerId}--${wrapped.id}`;
        this.addClass('part');
        const fireTitleChanged = () => this.onTitleChangedEmitter.fire(undefined);
        this.wrapped.title.changed.connect(fireTitleChanged);
        this.toDispose.push(Disposable.create(() => this.wrapped.title.changed.disconnect(fireTitleChanged)));
        if (DescriptionWidget.is(this.wrapped)) {
            const fireDescriptionChanged = () => this.onDidChangeDescriptionEmitter.fire(undefined);
            this.toDispose.push(this.wrapped?.onDidChangeDescription.event(fireDescriptionChanged));
        }
        const { header, body, disposable } = this.createContent();
        this.header = header;
        this.body = body;
        this.toNoDisposeWrapped = this.toDispose.push(wrapped);
        this.toolbar = this.toolbarFactory();
        this.toolbar.addClass('tart-view-container-part-title');
        this.toolbar.updateTarget(this.wrapped);
        this.toDispose.pushAll([
            disposable,
            this.toolbar,
            this.toolbar.onExecuteCommand(() => this.toolbar.updateTarget(this.wrapped)),
            this.toolbarRegistry.onDidChange(() => this.toolbar.updateTarget(this.wrapped)),
            this.collapsedEmitter,
            this.contextMenuEmitter,
            this.onTitleChangedEmitter,
            this.onDidChangeDescriptionEmitter,
            this.registerContextMenu(),
            this.onDidFocusEmitter,
            // focus event does not bubble, capture it
            addEventListener(this.node, 'focus', () => this.onDidFocusEmitter.fire(this), true)
        ]);
        this.scrollOptions = {
            suppressScrollX: true,
            minScrollbarLength: 35
        };
        this.collapsed = !!options.initiallyCollapsed;
        if (options.initiallyHidden && this.canHide) {
            this.hide();
        }
    }
    _collapsed;
    get collapsed() {
        return this._collapsed;
    }
    set collapsed(collapsed) {
        // Cannot collapse/expand if the orientation of the container is `horizontal`.
        const orientation = ViewContainer.getOrientation(this.node);
        if (this._collapsed === collapsed || orientation === 'horizontal' && collapsed) {
            return;
        }
        this._collapsed = collapsed;
        this.node.classList.toggle('collapsed', collapsed);
        if (collapsed && this.wrapped.node.contains(document.activeElement)) {
            this.header.focus();
        }
        this.wrapped.setHidden(collapsed);
        const toggleIcon = this.header.querySelector(`span.${EXPANSION_TOGGLE_CLASS}`);
        if (toggleIcon) {
            if (collapsed) {
                toggleIcon.classList.add(COLLAPSED_CLASS);
            }
            else {
                toggleIcon.classList.remove(COLLAPSED_CLASS);
            }
        }
        this.update();
        this.collapsedEmitter.fire(collapsed);
    }
    get viewContainer() {
        return this.parent ? this.parent.parent : undefined;
    }
    get currentViewContainerId() {
        return this.currentContainerId;
    }
    get headerElement() {
        return this.header;
    }
    get canHide() {
        return this.options.canHide === undefined || this.options.canHide;
    }
    get onCollapsed() {
        return this.collapsedEmitter.event;
    }
    get onContextMenu() {
        return this.contextMenuEmitter.event;
    }
    get minSize() {
        const style = getComputedStyle(this.body);
        if (ViewContainer.getOrientation(this.node) === 'horizontal') {
            return parseCssMagnitude(style.minWidth, 0);
        }
        else {
            return parseCssMagnitude(style.minHeight, 0);
        }
    }
    get titleHidden() {
        return !this.toShowHeader.disposed || this.collapsed;
    }
    onPartMoved(newContainer) {
        this.currentContainerId = newContainer.id;
        this.onPartMovedEmitter.fire(newContainer);
    }
    setHidden(hidden) {
        if (!this.canHide) {
            return;
        }
        super.setHidden(hidden);
    }
    showTitle() {
        this.toShowHeader.dispose();
    }
    hideTitle() {
        if (this.titleHidden) {
            return;
        }
        const display = this.header.style.display;
        const height = this.body.style.height;
        this.body.style.height = '100%';
        this.header.style.display = 'none';
        this.toShowHeader.push(Disposable.create(() => {
            this.header.style.display = display;
            this.body.style.height = height;
        }));
    }
    getScrollContainer() {
        return this.body;
    }
    registerContextMenu() {
        return new DisposableCollection(addEventListener(this.header, 'contextmenu', event => {
            this.contextMenuEmitter.fire(event);
        }));
    }
    createContent() {
        const disposable = new DisposableCollection();
        const { header, disposable: headerDisposable } = this.createHeader();
        const body = document.createElement('div');
        body.classList.add('body');
        this.node.appendChild(header);
        this.node.appendChild(body);
        disposable.push(headerDisposable);
        return {
            header,
            body,
            disposable,
        };
    }
    createHeader() {
        const disposable = new DisposableCollection();
        const header = document.createElement('div');
        header.tabIndex = 0;
        header.classList.add('tart-header', 'header', 'tart-view-container-part-header');
        disposable.push(addEventListener(header, 'click', event => {
            if (this.toolbar && this.toolbar.shouldHandleMouseEvent(event)) {
                return;
            }
            this.collapsed = !this.collapsed;
        }));
        disposable.push(addKeyListener(header, Key.ARROW_LEFT, () => this.collapsed = true));
        disposable.push(addKeyListener(header, Key.ARROW_RIGHT, () => this.collapsed = false));
        disposable.push(addKeyListener(header, Key.ENTER, () => this.collapsed = !this.collapsed));
        const toggleIcon = document.createElement('span');
        toggleIcon.classList.add(EXPANSION_TOGGLE_CLASS, ...CODICON_TREE_ITEM_CLASSES);
        if (this.collapsed) {
            toggleIcon.classList.add(COLLAPSED_CLASS);
        }
        header.appendChild(toggleIcon);
        const title = document.createElement('span');
        title.classList.add('label', 'noselect');
        const description = document.createElement('span');
        description.classList.add('description');
        const updateTitle = () => {
            if (this.currentContainerId !== this.originalContainerId && this.originalContainerTitle?.label) {
                // Creating a title in format: <original_container_title>: <part_title>.
                title.innerText = this.originalContainerTitle.label + ': ' + this.wrapped.title.label;
            }
            else {
                title.innerText = this.wrapped.title.label;
            }
        };
        const updateCaption = () => title.title = this.wrapped.title.caption || this.wrapped.title.label;
        const updateDescription = () => {
            description.innerText = DescriptionWidget.is(this.wrapped) && !this.collapsed && this.wrapped.description || '';
        };
        updateTitle();
        updateCaption();
        updateDescription();
        disposable.pushAll([
            this.onTitleChanged(updateTitle),
            this.onTitleChanged(updateCaption),
            this.onDidMove(updateTitle),
            this.onDidChangeDescription(updateDescription),
            this.onCollapsed(updateDescription)
        ]);
        header.appendChild(title);
        header.appendChild(description);
        return {
            header,
            disposable
        };
    }
    onResize(msg) {
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, Widget.ResizeMessage.UnknownSize);
        }
        super.onResize(msg);
    }
    onUpdateRequest(msg) {
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, msg);
        }
        super.onUpdateRequest(msg);
    }
    onAfterAttach(msg) {
        if (!this.wrapped.isAttached) {
            UnsafeWidgetUtilities.attach(this.wrapped, this.body);
        }
        UnsafeWidgetUtilities.attach(this.toolbar, this.header);
        super.onAfterAttach(msg);
    }
    onBeforeDetach(msg) {
        super.onBeforeDetach(msg);
        if (this.toolbar.isAttached) {
            Widget.detach(this.toolbar);
        }
        if (this.wrapped.isAttached) {
            UnsafeWidgetUtilities.detach(this.wrapped);
        }
    }
    onBeforeShow(msg) {
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, msg);
        }
        super.onBeforeShow(msg);
    }
    onAfterShow(msg) {
        super.onAfterShow(msg);
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, msg);
        }
    }
    onBeforeHide(msg) {
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, msg);
        }
        super.onBeforeShow(msg);
    }
    onAfterHide(msg) {
        super.onAfterHide(msg);
        if (this.wrapped.isAttached && !this.collapsed) {
            MessageLoop.sendMessage(this.wrapped, msg);
        }
    }
    onChildRemoved(msg) {
        super.onChildRemoved(msg);
        // if wrapped is not disposed, but detached then we should not dispose it, but only get rid of this part
        this.toNoDisposeWrapped.dispose();
        this.dispose();
    }
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        if (this.collapsed) {
            this.header.focus();
        }
        else {
            this.wrapped.activate();
        }
    }
}
(function (ViewContainerPart) {
    /**
     * Make sure to adjust the `line-height` of the `.tart-view-container .part > .header` CSS class when modifying this, and vice versa.
     */
    ViewContainerPart.HEADER_HEIGHT = 22;
    function closestPart(element, selector = 'div.part') {
        if (element instanceof Element) {
            const part = element.closest(selector);
            if (part instanceof Element) {
                return part;
            }
        }
        return undefined;
    }
    ViewContainerPart.closestPart = closestPart;
})(ViewContainerPart || (ViewContainerPart = {}));
export class ViewContainerLayout extends SplitLayout {
    options;
    splitPositionHandler;
    constructor(options, splitPositionHandler) {
        super(options);
        this.options = options;
        this.splitPositionHandler = splitPositionHandler;
    }
    get widget() {
        return toArray(this.iter());
    }
    get items() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this._items;
    }
    iter() {
        return map(this.items, item => item.widget);
    }
    attachWidget(index, widget) {
        super.attachWidget(index, widget);
        if (index > -1 && this.parent && this.parent.node.contains(this.widget[index + 1]?.node)) {
            // Set the correct attach index to the DOM elements.
            const ref = this.widget[index + 1].node;
            this.parent.node.insertBefore(widget.node, ref);
            this.parent.node.insertBefore(this.handles[index], ref);
            this.parent.fit();
        }
    }
    moveWidget(fromIndex, toIndex, widget) {
        const ref = this.widget[toIndex < fromIndex ? toIndex : toIndex + 1];
        super.moveWidget(fromIndex, toIndex, widget);
        // Keep the order of `_widget` array just as done before (by `super`) for the `_items` array -
        // to prevent later bugs relying on index.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ArrayExt.move(this._widget, fromIndex, toIndex);
        if (ref) {
            this.parent.node.insertBefore(this.handles[toIndex], ref.node);
        }
        else {
            this.parent.node.appendChild(this.handles[toIndex]);
        }
        UnsafeWidgetUtilities.detach(widget);
        UnsafeWidgetUtilities.attach(widget, this.parent.node, this.handles[toIndex]);
    }
    getPartSize(part) {
        if (part.collapsed || part.isHidden) {
            return part.uncollapsedSize;
        }
        if (this.orientation === 'horizontal') {
            return part.node.offsetWidth;
        }
        else {
            return part.node.offsetHeight;
        }
    }
    /**
     * Set the sizes of the view container parts according to the given weights
     * by moving the split handles. This is similar to `setRelativeSizes` defined
     * in `SplitLayout`, but here we properly consider the collapsed / expanded state.
     */
    setPartSizes(weights) {
        const parts = this.widget;
        const availableSize = this.getAvailableSize();
        // Sum up the weights of visible parts
        let totalWeight = 0;
        let weightCount = 0;
        for (let index = 0; index < weights.length && index < parts.length; index++) {
            const part = parts[index];
            const weight = weights[index];
            if (weight && !part.isHidden && !part.collapsed) {
                totalWeight += weight;
                weightCount++;
            }
        }
        if (weightCount === 0 || availableSize === 0) {
            return;
        }
        // Add the average weight for visible parts without weight
        const averageWeight = totalWeight / weightCount;
        for (let index = 0; index < weights.length && index < parts.length; index++) {
            const part = parts[index];
            const weight = weights[index];
            if (!weight && !part.isHidden && !part.collapsed) {
                totalWeight += averageWeight;
            }
        }
        // Apply the weights to compute actual sizes
        let position = 0;
        for (let index = 0; index < weights.length && index < parts.length - 1; index++) {
            const part = parts[index];
            if (!part.isHidden) {
                if (this.orientation === 'vertical') {
                    position += this.options.headerSize;
                }
                const weight = weights[index];
                if (part.collapsed) {
                    if (weight) {
                        part.uncollapsedSize = weight / totalWeight * availableSize;
                    }
                }
                else {
                    let contentSize = (weight || averageWeight) / totalWeight * availableSize;
                    const minSize = part.minSize;
                    if (contentSize < minSize) {
                        contentSize = minSize;
                    }
                    position += contentSize;
                }
                this.setHandlePosition(index, position);
                position += this.spacing;
            }
        }
    }
    /**
     * Determine the size of the split panel area that is available for widget content,
     * i.e. excluding part headers and split handles.
     */
    getAvailableSize() {
        if (!this.parent || !this.parent.isAttached) {
            return 0;
        }
        const parts = this.widget;
        const visiblePartCount = parts.filter(part => !part.isHidden).length;
        let availableSize;
        if (this.orientation === 'horizontal') {
            availableSize = this.parent.node.offsetWidth;
        }
        else {
            availableSize = this.parent.node.offsetHeight;
            availableSize -= visiblePartCount * this.options.headerSize;
        }
        availableSize -= (visiblePartCount - 1) * this.spacing;
        if (availableSize < 0) {
            return 0;
        }
        return availableSize;
    }
    /**
     * Update a view container part that has been collapsed or expanded. The transition
     * to the new state is animated.
     */
    updateCollapsed(part, enableAnimation) {
        const index = this.items.findIndex(item => item.widget === part);
        if (index < 0 || !this.parent || part.isHidden) {
            return;
        }
        // Do not store the height of the "stretched item". Otherwise, we mess up the "hint height".
        // Store the height only if there are other expanded items.
        const currentSize = this.orientation === 'horizontal' ? part.node.offsetWidth : part.node.offsetHeight;
        if (part.collapsed && this.items.some(item => !item.widget.collapsed && !item.widget.isHidden)) {
            part.uncollapsedSize = currentSize;
        }
        if (!enableAnimation || this.options.animationDuration <= 0) {
            MessageLoop.postMessage(this.parent, Widget.Msg.FitRequest);
            return;
        }
        let startTime = undefined;
        const duration = this.options.animationDuration;
        const direction = part.collapsed ? 'collapse' : 'expand';
        let fullSize;
        if (direction === 'collapse') {
            fullSize = currentSize - this.options.headerSize;
        }
        else {
            fullSize = Math.max((part.uncollapsedSize || 0) - this.options.headerSize, part.minSize);
            if (this.items.filter(item => !item.widget.collapsed && !item.widget.isHidden).length === 1) {
                // Expand to full available size
                fullSize = Math.max(fullSize, this.getAvailableSize());
            }
        }
        // The update function is called on every animation frame until the predefined duration has elapsed.
        const updateFunc = (time) => {
            if (!this.parent) {
                part.animatedSize = undefined;
                return;
            }
            if (startTime === undefined) {
                startTime = time;
            }
            if (time - startTime < duration) {
                // Render an intermediate state for the animation
                const t = this.tween((time - startTime) / duration);
                if (direction === 'collapse') {
                    part.animatedSize = (1 - t) * fullSize;
                }
                else {
                    part.animatedSize = t * fullSize;
                }
                requestAnimationFrame(updateFunc);
            }
            else {
                // The animation is finished
                if (direction === 'collapse') {
                    part.animatedSize = undefined;
                }
                else {
                    part.animatedSize = fullSize;
                    // Request another frame to reset the part to variable size
                    requestAnimationFrame(() => {
                        part.animatedSize = undefined;
                        if (this.parent) {
                            MessageLoop.sendMessage(this.parent, Widget.Msg.FitRequest);
                        }
                    });
                }
            }
            MessageLoop.sendMessage(this.parent, Widget.Msg.FitRequest);
        };
        requestAnimationFrame(updateFunc);
    }
    setHandlePosition(index, position) {
        const options = {
            referenceWidget: this.widget[index],
            duration: 0
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.splitPositionHandler.setSplitHandlePosition(this.parent, index, position, options);
    }
    onFitRequest(msg) {
        for (const part of this.widget) {
            const style = part.node.style;
            if (part.animatedSize !== undefined) {
                // The part size has been fixed for animating the transition to collapsed / expanded state
                const fixedSize = `${this.options.headerSize + part.animatedSize}px`;
                style.minHeight = fixedSize;
                style.maxHeight = fixedSize;
            }
            else if (part.collapsed) {
                // The part size is fixed to the header size
                const fixedSize = `${this.options.headerSize}px`;
                style.minHeight = fixedSize;
                style.maxHeight = fixedSize;
            }
            else {
                const minSize = `${this.options.headerSize + part.minSize}px`;
                style.minHeight = minSize;
                style.maxHeight = '';
            }
        }
        super.onFitRequest(msg);
    }
    /**
     * Sinusoidal tween function for smooth animation.
     */
    tween(t) {
        return 0.5 * (1 - Math.cos(Math.PI * t));
    }
}

//# sourceMappingURL=../../lib/browser/view-container.js.map
