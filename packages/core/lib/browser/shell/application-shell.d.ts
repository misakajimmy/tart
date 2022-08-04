import { BoxLayout, BoxPanel, DockLayout, DockPanel, FocusTracker, Layout, Panel, SplitLayout, TabBar, Title, Widget } from '@lumino/widgets';
import { TartDockPanel } from './tart-dock-panel';
import { DisposableCollection, Emitter, Event as CommonEvent, RecursivePartial } from '../../common';
import { SidePanel, SidePanelHandler } from './side-panel-handler';
import { StatusBarImpl } from '../status-bar';
import { SaveOptions } from '../saveable';
import { FrontendApplicationStateService } from '../frontend-application-state';
import { SplitPositionHandler } from './split-panels';
import { Signal } from '@lumino/signaling';
import { ContextKeyService } from '../context-key-service';
export declare type ApplicationShellLayoutVersion = 
/** layout versioning is introduced, unversioned layout are not compatible */
2.0 | 
/** view containers are introduced, backward compatible to 2.0 */
3.0 | 
/** git history view is replaced by a more generic scm history view, backward compatible to 3.0 */
4.0 | 
/** Replace custom/font-awesome icons with codicons */
5.0 | 
/** added the ability to drag and drop view parts between view containers */
6.0;
/**
 * When a version is increased, make sure to introduce a migration (ApplicationShellLayoutMigration) to this version.
 */
export declare const applicationShellLayoutVersion: ApplicationShellLayoutVersion;
export declare const ApplicationShellOptions: unique symbol;
export declare const DockPanelRendererFactory: unique symbol;
/**
 * A renderer for dock panels that supports context menus on tabs.
 */
export declare class ApplicationShell extends Widget {
    protected readonly statusBar: StatusBarImpl;
    protected readonly applicationStateService: FrontendApplicationStateService;
    protected splitPositionHandler: SplitPositionHandler;
    /**
     * The dock panel in the main shell area. This is where editors usually go to.
     */
    mainPanel: TartDockPanel;
    /**
     * The dock panel in the bottom shell area. In contrast to the main panel, the bottom panel
     * can be collapsed and expanded.
     */
    bottomPanel: TartDockPanel;
    /**
     * Handler for the left side panel. The primary application views go here, such as the
     * file explorer and the git view.
     */
    leftPanelHandler: SidePanelHandler;
    /**
     * Handler for the right side panel. The secondary application views go here, such as the
     * outline view.
     */
    rightPanelHandler: SidePanelHandler;
    /**
     * The fixed-size panel shown on top. This one usually holds the main menu.
     */
    readonly topPanel: Panel;
    /**
     * A signal emitted whenever the `currentWidget` property is changed.
     *
     * @deprecated since 0.11.0, use `onDidChangeCurrentWidget` instead
     */
    readonly currentChanged: Signal<this, FocusTracker.IChangedArgs<Widget>>;
    /**
     * A signal emitted whenever the `activeWidget` property is changed.
     *
     * @deprecated since 0.11.0, use `onDidChangeActiveWidget` instead
     */
    readonly activeChanged: Signal<this, FocusTracker.IChangedArgs<Widget>>;
    /**
     * General options for the application shell.
     */
    protected options: ApplicationShell.Options;
    /**
     * The current state of the bottom panel.
     */
    protected readonly bottomPanelState: SidePanel.State;
    protected readonly contextKeyService: ContextKeyService;
    protected readonly onDidAddWidgetEmitter: Emitter<Widget>;
    readonly onDidAddWidget: CommonEvent<Widget>;
    protected readonly onDidChangeActiveWidgetEmitter: Emitter<FocusTracker.IChangedArgs<Widget>>;
    readonly onDidChangeActiveWidget: CommonEvent<FocusTracker.IChangedArgs<Widget>>;
    protected readonly onDidChangeCurrentWidgetEmitter: Emitter<FocusTracker.IChangedArgs<Widget>>;
    readonly onDidChangeCurrentWidget: CommonEvent<FocusTracker.IChangedArgs<Widget>>;
    protected readonly onDidRemoveWidgetEmitter: Emitter<Widget>;
    readonly onDidRemoveWidget: CommonEvent<Widget>;
    protected readonly toDisposeOnActiveChanged: DisposableCollection;
    private readonly tracker;
    private readonly activationTimeout;
    private readonly toDisposeOnActivationCheck;
    /**
     * Construct a new application shell.
     */
    constructor(statusBar: StatusBarImpl, sidePanelHandlerFactory: () => SidePanelHandler, applicationStateService: FrontendApplicationStateService, splitPositionHandler: SplitPositionHandler, options?: RecursivePartial<ApplicationShell.Options>);
    /**
     * The tab bars contained in the main shell area. If there is no widget in the main area, the
     * returned array is empty.
     */
    get mainAreaTabBars(): TabBar<Widget>[];
    /**
     * The tab bars contained in the bottom shell area. If there is no widget in the bottom area,
     * the returned array is empty.
     */
    get bottomAreaTabBars(): TabBar<Widget>[];
    /**
     * The tab bars contained in all shell areas.
     */
    get allTabBars(): TabBar<Widget>[];
    /**
     * The shell area name of the currently active tab, or undefined.
     */
    get currentTabArea(): ApplicationShell.Area | undefined;
    /**
     * Returns a snapshot of all tracked widgets to allow async modifications.
     */
    get widgets(): ReadonlyArray<Widget>;
    /**
     * A promise that is resolved when all currently pending updates are done.
     */
    get pendingUpdates(): Promise<void>;
    /**
     * The current widget in the application shell. The current widget is the last widget that
     * was active and not yet closed. See the remarks to `activeWidget` on what _active_ means.
     */
    get currentWidget(): Widget | undefined;
    /**
     * Return the tab bar that has the currently active widget, or undefined.
     */
    get currentTabBar(): TabBar<Widget> | undefined;
    /**
     * The active widget in the application shell. The active widget is the one that has focus
     * (either the widget itself or any of its contents).
     *
     * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
     * widget implementation which DOM element will get the focus. The default implementation
     * does not take any focus; in that case the widget is never returned by this property.
     */
    get activeWidget(): Widget | undefined;
    /**
     * Save the current widget if it is dirty.
     */
    save(options?: SaveOptions): Promise<void>;
    /**
     * The widgets contained in the given shell area.
     */
    getWidgets(area: ApplicationShell.Area): Widget[];
    /**
     * Find the widget that contains the given HTML element. The returned widget may be one
     * that is managed by the application shell, or one that is embedded in another widget and
     * not directly managed by the shell, or a tab bar.
     */
    findWidgetForElement(element: HTMLElement): Widget | undefined;
    /**
     * Finds the title widget from the tab-bar.
     * @param tabBar used for providing an array of titles.
     * @returns the selected title widget, else returns the currentTitle or undefined.
     */
    findTitle(tabBar: TabBar<Widget>, event?: Event): Title<Widget> | undefined;
    /**
     * Finds the tab-bar widget.
     * @returns the selected tab-bar, else returns the currentTabBar.
     */
    findTabBar(event?: Event): TabBar<Widget> | undefined;
    /**
     *  @returns the widget whose title has been targeted by a DOM event on a tabbar, or undefined if none can be found.
     */
    findTargetedWidget(event?: Event): Widget | undefined;
    /**
     * Add a widget to the application shell. The given widget must have a unique `id` property,
     * which will be used as the DOM id.
     *
     * Widgets are removed from the shell by calling their `close` or `dispose` methods.
     *
     * Widgets added to the top area are not tracked regarding the _current_ and _active_ states.
     */
    addWidget(widget: Widget, options?: Readonly<ApplicationShell.WidgetOptions>): Promise<void>;
    /**
     * Return the tab bar in the given shell area, or the tab bar that has the given widget, or undefined.
     */
    getTabBarFor(widgetOrArea: Widget | ApplicationShell.Area): TabBar<Widget> | undefined;
    /**
     * Determine the name of the shell area where the given widget resides. The result is
     * undefined if the widget does not reside directly in the shell.
     */
    getAreaFor(input: TabBar<Widget> | Widget): ApplicationShell.Area | undefined;
    /**
     * Create an object that describes the current shell layout. This object may contain references
     * to widgets; these need to be transformed before the layout can be serialized.
     */
    getLayoutData(): ApplicationShell.LayoutData;
    /**
     * Collapse the named side panel area. This makes sure that the panel is hidden,
     * increasing the space that is available for other shell areas.
     */
    collapsePanel(area: ApplicationShell.Area): Promise<void>;
    /**
     * Reveal a widget in the application shell. This makes the widget visible,
     * but does not activate it.
     *
     * @returns the revealed widget if it was found
     */
    revealWidget(id: string): Promise<Widget | undefined>;
    /**
     * Expand the named side panel area. This makes sure that the panel is visible, even if there
     * are no widgets in it. If the panel is already visible, nothing happens. If the panel is currently
     * collapsed (see `collapsePanel`) and it contains widgets, the widgets are revealed that were
     * visible before it was collapsed.
     */
    expandPanel(area: ApplicationShell.Area): void;
    /**
     * Adjusts the size of the given area in the application shell.
     *
     * @param size the desired size of the panel in pixels.
     * @param area the area to resize.
     */
    resize(size: number, area: ApplicationShell.Area): void;
    /**
     * Apply a shell layout that has been previously created with `getLayoutData`.
     */
    setLayoutData(layoutData: ApplicationShell.LayoutData): Promise<void>;
    /**
     * Activate a widget in the application shell. This makes the widget visible and usually
     * also assigns focus to it.
     *
     * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
     * widget implementation which DOM element will get the focus. The default implementation
     * does not take any focus.
     *
     * @returns the activated widget if it was found
     */
    activateWidget(id: string): Promise<Widget | undefined>;
    closeWidget(id: string, options?: ApplicationShell.CloseOptions): Promise<Widget | undefined>;
    /**
     * Save all dirty widgets.
     */
    saveAll(options?: SaveOptions): Promise<void>;
    getWidgetById(id: string): Widget | undefined;
    canToggleMaximized(): boolean;
    toggleMaximized(): void;
    waitForActivation(id: string): Promise<void>;
    activateNextTab(): boolean;
    activateNextTabBar(current?: TabBar<Widget> | undefined): boolean;
    activatePreviousTab(): boolean;
    /**
     * Return the tab bar next to the given tab bar; return the given tab bar if there is no adjacent one.
     */
    nextTabBar(current?: TabBar<Widget> | undefined): TabBar<Widget> | undefined;
    activatePreviousTabInTabBar(current?: TabBar<Widget> | undefined): boolean;
    previousTabIndexInTabBar(current?: TabBar<Widget> | undefined): number;
    activatePreviousTabBar(current?: TabBar<Widget> | undefined): boolean;
    /**
     * Return the tab bar previous to the given tab bar; return the given tab bar if there is no adjacent one.
     */
    previousTabBar(current?: TabBar<Widget> | undefined): TabBar<Widget> | undefined;
    activateNextTabInTabBar(current?: TabBar<Widget> | undefined): boolean;
    nextTabIndexInTabBar(current?: TabBar<Widget> | undefined): number;
    /**
     * Check whether the named side panel area is expanded (returns `true`) or collapsed (returns `false`).
     */
    isExpanded(area: ApplicationShell.Area): boolean;
    /**
     * Close all tabs or a selection of tabs in a specific part of the application shell.
     *
     * @param tabBarOrArea
     *      Either the name of a shell area or a `TabBar` that is contained in such an area.
     * @param filter
     *      If undefined, all tabs are closed; otherwise only those tabs that match the filter are closed.
     */
    closeTabs(tabBarOrArea: TabBar<Widget> | ApplicationShell.Area, filter?: (title: Title<Widget>, index: number) => boolean): void;
    saveTabs(tabBarOrArea: TabBar<Widget> | ApplicationShell.Area, filter?: (title: Title<Widget>, index: number) => boolean): void;
    /**
     * Returns the last active widget in the given shell area.
     */
    getCurrentWidget(area: ApplicationShell.Area): Widget | undefined;
    protected fireDidAddWidget(widget: Widget): void;
    protected fireDidRemoveWidget(widget: Widget): void;
    protected init(): void;
    /**
     * Create the dock panel in the main shell area.
     */
    protected createMainPanel(): TartDockPanel;
    /**
     * Create the dock panel in the bottom shell area.
     */
    protected createBottomPanel(): TartDockPanel;
    /**
     * Create the top panel, which is used to hold the main menu.
     */
    protected createTopPanel(): Panel;
    /**
     * Create a box layout to assemble the application shell layout.
     */
    protected createBoxLayout(widgets: Widget[], stretch?: number[], options?: BoxPanel.IOptions): BoxLayout;
    /**
     * Create a split layout to assemble the application shell layout.
     */
    protected createSplitLayout(widgets: Widget[], stretch?: number[], options?: Partial<SplitLayout.IOptions>): SplitLayout;
    /**
     * Track the given widget so it is considered in the `current` and `active` state of the shell.
     */
    protected track(widget: Widget): void;
    protected initFocusKeyContexts(): void;
    protected toTrackedStack(id: string): Widget[];
    protected setTopPanelVisibility(preference: string): void;
    /**
     * Track all widgets that are referenced by the given layout data.
     */
    protected registerWithFocusTracker(data: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig | SidePanel.LayoutData | null): void;
    /**
     * Expand the bottom panel. See `expandPanel` regarding the exact behavior.
     */
    protected expandBottomPanel(): void;
    /**
     * Determine the default size to apply when the bottom panel is expanded for the first time.
     */
    protected getDefaultBottomPanelSize(): number | undefined;
    /**
     * Modify the height of the bottom panel. This implementation assumes that the container of the
     * bottom panel is a `SplitPanel`.
     */
    protected setBottomPanelSize(size: number): Promise<void>;
    /**
     * Reveal top-level area widget.
     */
    protected doRevealWidget(id: string): Widget | undefined;
    /**
     * Collapse the bottom panel. All contained widgets are hidden, but not closed.
     * They can be restored by calling `expandBottomPanel`.
     */
    protected collapseBottomPanel(): Promise<void>;
    /**
     * Refresh the toggle button for the bottom panel. This implementation creates a status bar entry
     * and refers to the command `core.toggle.bottom.panel`.
     */
    protected refreshBottomPanelToggleButton(): void;
    /**
     * Activate top-level area widget.
     */
    protected doActivateWidget(id: string): Widget | undefined;
    protected getAreaPanelFor(input: Widget): DockPanel | undefined;
    /**
     * Compute the current height of the bottom panel. This implementation assumes that the container
     * of the bottom panel is a `SplitPanel`.
     */
    protected getBottomPanelSize(): number | undefined;
    /**
     * Assemble the application shell layout. Override this method in order to change the arrangement
     * of the main area and the side panels.
     */
    protected createLayout(): Layout;
    private findWidgetForNode;
    /**
     * Focus is taken by a widget through the `onActivateRequest` method. It is up to the
     * widget implementation which DOM element will get the focus. The default implementation
     * of Widget does not take any focus. This method can help finding such problems by logging
     * a warning in case a widget was explicitly activated, but did not trigger a change of the
     * `activeWidget` property.
     */
    private checkActivation;
    private assertActivated;
    /**
     * Handle a change to the current widget.
     */
    private onCurrentChanged;
    /**
     * Set the z-index of the given element and its ancestors to the value `z`.
     */
    private setZIndex;
    /**
     * Handle a change to the active widget.
     */
    private onActiveChanged;
}
/**
 * The namespace for `ApplicationShell` class statics.
 */
export declare namespace ApplicationShell {
    /**
     * The areas of the application shell where widgets can reside.
     */
    type Area = 'main' | 'top' | 'left' | 'right' | 'bottom';
    /**
     * The _side areas_ are those shell areas that can be collapsed and expanded,
     * i.e. `left`, `right`, and `bottom`.
     */
    function isSideArea(area?: string): area is 'left' | 'right' | 'bottom';
    function isValidArea(area?: any): area is ApplicationShell.Area;
    interface Options extends Widget.IOptions {
        bottomPanel: BottomPanelOptions;
        leftPanel: SidePanel.Options;
        rightPanel: SidePanel.Options;
    }
    interface BottomPanelOptions extends SidePanel.Options {
    }
    /**
     * The default values for application shell options.
     */
    const DEFAULT_OPTIONS: Readonly<Options>;
    /**
     * Whether a widget should be opened to the side tab bar relatively to the reference widget.
     */
    type OpenToSideMode = 'open-to-left' | 'open-to-right';
    function isOpenToSideMode(mode: OpenToSideMode | any): mode is OpenToSideMode;
    /**
     * Data to save and load the application shell layout.
     */
    interface LayoutData {
        version?: string | ApplicationShellLayoutVersion;
        mainPanel?: DockPanel.ILayoutConfig;
        bottomPanel?: BottomPanelLayoutData;
        leftPanel?: SidePanel.LayoutData;
        rightPanel?: SidePanel.LayoutData;
        activeWidgetId?: string;
    }
    interface CloseOptions {
        /**
         * if optional then a user will be prompted
         * if undefined then close will be canceled
         * if true then will be saved on close
         * if false then won't be saved on close
         */
        save?: boolean | undefined;
    }
    /**
     * Data to save and load the bottom panel layout.
     */
    interface BottomPanelLayoutData {
        config?: DockPanel.ILayoutConfig;
        size?: number;
        expanded?: boolean;
    }
    /**
     * Options for adding a widget to the application shell.
     */
    interface WidgetOptions extends SidePanel.WidgetOptions {
        /**
         * The area of the application shell where the widget will reside.
         */
        area?: Area;
        /**
         * The insertion mode for adding the widget.
         *
         * The default is `'tab-after'`.
         */
        mode?: DockLayout.InsertMode | OpenToSideMode;
        /**
         * The reference widget for the insert location.
         *
         * The default is `undefined`.
         */
        ref?: Widget;
    }
    /**
     * Exposes widgets which activation state should be tracked by shell.
     */
    interface TrackableWidgetProvider {
        readonly onDidChangeTrackableWidgets?: CommonEvent<Widget[]>;
        getTrackableWidgets(): Widget[];
        /**
         * Make visible and focus a trackable widget for the given id.
         * If not implemented then `activate` request will be sent to a child widget directly.
         */
        activateWidget?(id: string): Widget | undefined;
        /**
         * Make visible a trackable widget for the given id.
         * If not implemented then a widget should be always visible when an owner is visible.
         */
        revealWidget?(id: string): Widget | undefined;
    }
    namespace TrackableWidgetProvider {
        function is(widget: object | undefined): widget is TrackableWidgetProvider;
    }
}
