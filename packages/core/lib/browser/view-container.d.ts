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
import { interfaces } from 'inversify';
import { IIterator } from '@lumino/algorithm';
import { BaseWidget, LayoutItem, Message, PanelLayout, SplitLayout, SplitPanel, Widget } from './widgets';
import { Emitter, Event as CommonEvent } from '../common';
import { Disposable, DisposableCollection } from '../common/disposable';
import { CommandRegistry } from '../common/command';
import { MenuModelRegistry, MenuPath } from '../common/menu';
import { ApplicationShell, SplitPositionHandler, StatefulWidget } from './shell';
import { FrontendApplicationStateService } from './frontend-application-state';
import { Anchor, ContextMenuRenderer } from './context-menu-renderer';
import { WidgetManager } from './widget-manager';
import { TabBarDelegator, TabBarToolbar, TabBarToolbarFactory, TabBarToolbarItem, TabBarToolbarRegistry } from './shell/tab-bar-toolbar';
import { ProgressBarFactory } from './progress-bar-factory';
import { TabBarDecoratorService } from './shell/tab-bar-decorator';
import { IDragEvent } from '@lumino/dragdrop';
import { DockPanel } from '@lumino/widgets';
export interface ViewContainerTitleOptions {
    label: string;
    caption?: string;
    iconClass?: string;
    closeable?: boolean;
}
export declare class ViewContainerIdentifier {
    id: string;
    progressLocationId?: string;
}
export interface DescriptionWidget {
    description: string;
    onDidChangeDescription: Emitter<void>;
}
export declare namespace DescriptionWidget {
    function is(arg: Object | undefined): arg is DescriptionWidget;
}
/**
 * A view container holds an arbitrary number of widgets inside a split panel.
 * Each widget is wrapped in a _part_ that displays the widget title and toolbar
 * and allows to collapse / expand the widget content.
 */
export declare class ViewContainer extends BaseWidget implements StatefulWidget, ApplicationShell.TrackableWidgetProvider, TabBarDelegator {
    /**
     * Disable dragging parts from/to this view container.
     */
    disableDNDBetweenContainers: boolean;
    readonly options: ViewContainerIdentifier;
    toDisposeOnDragEnd: DisposableCollection;
    protected panel: SplitPanel;
    protected currentPart: ViewContainerPart | undefined;
    protected readonly applicationStateService: FrontendApplicationStateService;
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly menuRegistry: MenuModelRegistry;
    protected readonly widgetManager: WidgetManager;
    protected readonly splitPositionHandler: SplitPositionHandler;
    protected readonly toolbarRegistry: TabBarToolbarRegistry;
    protected readonly toolbarFactory: TabBarToolbarFactory;
    protected readonly onDidChangeTrackableWidgetsEmitter: Emitter<Widget[]>;
    readonly onDidChangeTrackableWidgets: CommonEvent<Widget[]>;
    protected readonly progressBarFactory: ProgressBarFactory;
    protected readonly shell: ApplicationShell;
    protected readonly decoratorService: TabBarDecoratorService;
    protected readonly toDisposeOnCurrentPart: DisposableCollection;
    protected titleOptions: ViewContainerTitleOptions | undefined;
    protected readonly toDisposeOnUpdateTitle: DisposableCollection;
    protected _tabBarDelegate: Widget;
    protected readonly toRemoveWidgets: Map<string, DisposableCollection>;
    protected lastVisibleState: ViewContainer.State | undefined;
    get containerLayout(): ViewContainerLayout;
    protected get orientation(): SplitLayout.Orientation;
    protected get enableAnimation(): boolean;
    protected get contextMenuPath(): MenuPath;
    protected get globalHideCommandId(): string;
    setTitleOptions(titleOptions: ViewContainerTitleOptions | undefined): void;
    updateTabBarDelegate(): void;
    getTabBarDelegate(): Widget | undefined;
    addWidget(widget: Widget, options?: ViewContainer.Factory.WidgetOptions, originalContainerId?: string, originalContainerTitle?: ViewContainerTitleOptions): Disposable;
    removeWidget(widget: Widget): boolean;
    getParts(): ViewContainerPart[];
    getPartFor(widget: Widget): ViewContainerPart | undefined;
    storeState(): ViewContainer.State;
    restoreState(state: ViewContainer.State): void;
    getTrackableWidgets(): Widget[];
    activateWidget(id: string): Widget | undefined;
    revealWidget(id: string): Widget | undefined;
    handleEvent(event: Event): void;
    handleDragEnter(event: IDragEvent): void;
    handleDragOver(event: IDragEvent): void;
    handleDragLeave(event: IDragEvent): void;
    handleDrop(event: IDragEvent): void;
    protected init(): void;
    protected configureLayout(layout: PanelLayout): void;
    protected updateCurrentPart(part?: ViewContainerPart): void;
    protected updateTitle(): void;
    protected updateToolbarItems(allParts: ViewContainerPart[]): void;
    protected getToggleVisibilityGroupLabel(): string;
    protected registerToolbarItem(commandId: string, options?: Partial<Omit<TabBarToolbarItem, 'id' | 'command'>>): void;
    protected findOriginalPart(): ViewContainerPart | undefined;
    protected isCurrentTitle(titleOptions: ViewContainerTitleOptions | undefined): boolean;
    protected findPartForAnchor(anchor: Anchor): ViewContainerPart | undefined;
    protected createPartId(widget: Widget): string;
    protected attachNewPart(newPart: ViewContainerPart, insertIndex?: number): Disposable;
    protected createPart(widget: Widget, partId: string, originalContainerId: string, originalContainerTitle?: ViewContainerTitleOptions, options?: ViewContainer.Factory.WidgetOptions): ViewContainerPart;
    protected getPartIndex(partId: string | undefined): number;
    protected doStoreState(): ViewContainer.State;
    protected doRestoreState(state: ViewContainer.State): void;
    /**
     * Register a command to toggle the visibility of the new part.
     */
    protected registerPart(toRegister: ViewContainerPart): void;
    /**
     * Register a menu action to toggle the visibility of the new part.
     * The menu action is unregistered first to enable refreshing the order of menu actions.
     */
    protected refreshMenu(part: ViewContainerPart): void;
    protected unregisterPart(part: ViewContainerPart): void;
    protected toggleVisibilityCommandId(part: ViewContainerPart): string;
    protected moveBefore(toMovedId: string, moveBeforeThisId: string): void;
    protected fireDidChangeTrackableWidgets(): void;
    protected revealPart(id: string): ViewContainerPart | undefined;
    protected onActivateRequest(msg: Message): void;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeHide(msg: Message): void;
    protected onAfterShow(msg: Message): void;
    protected onBeforeAttach(msg: Message): void;
    protected onAfterDetach(msg: Message): void;
    protected registerDND(part: ViewContainerPart): Disposable;
    protected getDockPanel(): DockPanel | undefined;
    protected isSideDockPanel(widget: Widget): boolean;
}
export declare namespace ViewContainer {
    const Factory: unique symbol;
    interface Factory {
        (options: ViewContainerIdentifier): ViewContainer;
    }
    namespace Factory {
        interface WidgetOptions {
            readonly order?: number;
            readonly weight?: number;
            readonly initiallyCollapsed?: boolean;
            readonly canHide?: boolean;
            readonly initiallyHidden?: boolean;
            /**
             * Disable dragging this part from its original container to other containers,
             * But allow dropping parts from other containers on it,
             * This option only applies to the `ViewContainerPart` and has no effect on the ViewContainer.
             */
            readonly disableDraggingToOtherContainers?: boolean;
        }
        interface WidgetDescriptor {
            readonly widget: Widget | interfaces.ServiceIdentifier<Widget>;
            readonly options?: WidgetOptions;
        }
    }
    interface State {
        title?: ViewContainerTitleOptions;
        parts: ViewContainerPart.State[];
    }
    function getOrientation(node: HTMLElement): 'horizontal' | 'vertical';
}
/**
 * Wrapper around a widget held by a view container. Adds a header to display the
 * title, toolbar, and collapse / expand handle.
 */
export declare class ViewContainerPart extends BaseWidget {
    readonly wrapped: Widget;
    readonly partId: string;
    protected currentContainerId: string;
    readonly originalContainerId: string;
    readonly originalContainerTitle: ViewContainerTitleOptions | undefined;
    protected readonly toolbarRegistry: TabBarToolbarRegistry;
    protected readonly toolbarFactory: TabBarToolbarFactory;
    readonly options: ViewContainer.Factory.WidgetOptions;
    /**
     * @deprecated since 0.11.0, use `onDidChangeVisibility` instead
     */
    readonly onVisibilityChanged: CommonEvent<boolean>;
    uncollapsedSize: number | undefined;
    animatedSize: number | undefined;
    protected readonly header: HTMLElement;
    protected readonly body: HTMLElement;
    protected readonly collapsedEmitter: Emitter<boolean>;
    protected readonly contextMenuEmitter: Emitter<MouseEvent>;
    protected readonly onTitleChangedEmitter: Emitter<void>;
    readonly onTitleChanged: CommonEvent<void>;
    protected readonly onDidFocusEmitter: Emitter<this>;
    readonly onDidFocus: CommonEvent<this>;
    protected readonly onPartMovedEmitter: Emitter<ViewContainer>;
    readonly onDidMove: CommonEvent<ViewContainer>;
    protected readonly onDidChangeDescriptionEmitter: Emitter<void>;
    readonly onDidChangeDescription: CommonEvent<void>;
    protected readonly toolbar: TabBarToolbar;
    protected readonly toNoDisposeWrapped: Disposable;
    protected readonly toShowHeader: DisposableCollection;
    constructor(wrapped: Widget, partId: string, currentContainerId: string, originalContainerId: string, originalContainerTitle: ViewContainerTitleOptions | undefined, toolbarRegistry: TabBarToolbarRegistry, toolbarFactory: TabBarToolbarFactory, options?: ViewContainer.Factory.WidgetOptions);
    protected _collapsed: boolean;
    get collapsed(): boolean;
    set collapsed(collapsed: boolean);
    get viewContainer(): ViewContainer | undefined;
    get currentViewContainerId(): string;
    get headerElement(): HTMLElement;
    get canHide(): boolean;
    get onCollapsed(): CommonEvent<boolean>;
    get onContextMenu(): CommonEvent<MouseEvent>;
    get minSize(): number;
    get titleHidden(): boolean;
    onPartMoved(newContainer: ViewContainer): void;
    setHidden(hidden: boolean): void;
    showTitle(): void;
    hideTitle(): void;
    protected getScrollContainer(): HTMLElement;
    protected registerContextMenu(): Disposable;
    protected createContent(): {
        header: HTMLElement;
        body: HTMLElement;
        disposable: Disposable;
    };
    protected createHeader(): {
        header: HTMLElement;
        disposable: Disposable;
    };
    protected onResize(msg: Widget.ResizeMessage): void;
    protected onUpdateRequest(msg: Message): void;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    protected onBeforeShow(msg: Message): void;
    protected onAfterShow(msg: Message): void;
    protected onBeforeHide(msg: Message): void;
    protected onAfterHide(msg: Message): void;
    protected onChildRemoved(msg: Widget.ChildMessage): void;
    protected onActivateRequest(msg: Message): void;
}
export declare namespace ViewContainerPart {
    /**
     * Make sure to adjust the `line-height` of the `.tart-view-container .part > .header` CSS class when modifying this, and vice versa.
     */
    const HEADER_HEIGHT = 22;
    interface State {
        widget?: Widget;
        partId: string;
        collapsed: boolean;
        hidden: boolean;
        relativeSize?: number;
        description?: string;
        /** The original container to which this part belongs */
        originalContainerId: string;
        originalContainerTitle?: ViewContainerTitleOptions;
    }
    function closestPart(element: Element | EventTarget | null, selector?: string): Element | undefined;
}
export declare class ViewContainerLayout extends SplitLayout {
    protected options: ViewContainerLayout.Options;
    protected readonly splitPositionHandler: SplitPositionHandler;
    constructor(options: ViewContainerLayout.Options, splitPositionHandler: SplitPositionHandler);
    get widget(): ViewContainerPart[];
    protected get items(): ReadonlyArray<LayoutItem & ViewContainerLayout.Item>;
    iter(): IIterator<ViewContainerPart>;
    attachWidget(index: number, widget: ViewContainerPart): void;
    moveWidget(fromIndex: number, toIndex: number, widget: Widget): void;
    getPartSize(part: ViewContainerPart): number | undefined;
    /**
     * Set the sizes of the view container parts according to the given weights
     * by moving the split handles. This is similar to `setRelativeSizes` defined
     * in `SplitLayout`, but here we properly consider the collapsed / expanded state.
     */
    setPartSizes(weights: (number | undefined)[]): void;
    /**
     * Determine the size of the split panel area that is available for widget content,
     * i.e. excluding part headers and split handles.
     */
    getAvailableSize(): number;
    /**
     * Update a view container part that has been collapsed or expanded. The transition
     * to the new state is animated.
     */
    updateCollapsed(part: ViewContainerPart, enableAnimation: boolean): void;
    setHandlePosition(index: number, position: number): Promise<void>;
    protected onFitRequest(msg: Message): void;
    /**
     * Sinusoidal tween function for smooth animation.
     */
    protected tween(t: number): number;
}
export declare namespace ViewContainerLayout {
    interface Options extends SplitLayout.IOptions {
        headerSize: number;
        animationDuration: number;
    }
    interface Item {
        readonly widget: ViewContainerPart;
    }
}
