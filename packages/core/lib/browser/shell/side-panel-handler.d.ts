import { DockPanel, Panel, TabBar, Widget } from '@lumino/widgets';
import { SideTabBar, TabBarRenderer } from './tab-bars';
import { AttachedProperty } from '@lumino/properties';
import { SidebarMenuWidget } from './sidebar-menu-widget';
import { SidePanelToolbar } from './side-panel-toolbar';
import { TartDockPanel } from './tart-dock-panel';
import { SidebarTopMenuWidget } from './sidebar-top-menu-widget';
import { MenuPath } from '../../common/menu';
import { FrontendApplicationStateService } from '../frontend-application-state';
import { DisposableCollection } from '../../common';
import { SplitPositionHandler } from './split-panels';
import { SidebarBottomMenuWidget } from './sidebar-bottom-menu-widget';
import { TabBarToolbar, TabBarToolbarRegistry } from './tab-bar-toolbar';
import { ContextMenuRenderer } from '../context-menu-renderer';
/** The class name added to the left and right area panels. */
export declare const LEFT_RIGHT_AREA_CLASS = "tart-app-sides";
/** Menu path for tab bars used throughout the application shell. */
export declare const SHELL_TABBAR_CONTEXT_MENU: MenuPath;
export declare const SidePanelHandlerFactory: unique symbol;
export declare const SIDE_PANEL_TOOLBAR_CONTEXT_MENU: MenuPath;
export declare class SidePanelHandler {
    /**
     * A property that can be attached to widgets in order to determine the insertion index
     * of their title in the tab bar.
     */
    protected static readonly rankProperty: AttachedProperty<Widget, number>;
    /**
     * The tab bar displays the titles of the widgets in the side panel. Visibility of the widgets
     * is controlled entirely through tab selection: a widget is revealed by setting the `currentTitle`
     * accordingly in the tab bar, and the panel is hidden by setting that property to `null`. The
     * tab bar itself remains visible as long as there is at least one widget.
     */
    tabBar: SideTabBar;
    /**
     * The menu placed on the sidebar top.
     * Displayed as icons.
     * Open menus when on clicks.
     */
    topMenu: SidebarMenuWidget;
    /**
     * The menu placed on the sidebar bottom.
     * Displayed as icons.
     * Open menus when on clicks.
     */
    bottomMenu: SidebarMenuWidget;
    /**
     * A tool bar, which displays a title and widget specific command buttons.
     */
    toolBar: SidePanelToolbar;
    /**
     * The widget container is a dock panel in `single-document` mode, which means that the panel
     * cannot be split.
     */
    dockPanel: TartDockPanel;
    /**
     * The panel that contains the tab bar and the dock panel. This one is hidden whenever the dock
     * panel is empty.
     */
    container: Panel;
    /**
     * The current state of the side panel.
     */
    readonly state: SidePanel.State;
    /**
     * The shell area where the panel is placed. This property should not be modified directly, but
     * only by calling `create`.
     */
    protected side: 'left' | 'right';
    /**
     * Options that control the behavior of the side panel.
     */
    protected options: SidePanel.Options;
    protected tabBarToolBarRegistry: TabBarToolbarRegistry;
    protected sidebarTopWidgetFactory: () => SidebarTopMenuWidget;
    protected tabBarToolBarFactory: () => TabBarToolbar;
    protected tabBarRendererFactory: () => TabBarRenderer;
    protected sidebarBottomWidgetFactory: () => SidebarBottomMenuWidget;
    protected splitPositionHandler: SplitPositionHandler;
    protected readonly applicationStateService: FrontendApplicationStateService;
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    protected readonly toDisposeOnCurrentTabChanged: DisposableCollection;
    /**
     * Create the side bar and dock panel widgets.
     */
    create(side: 'left' | 'right', options: SidePanel.Options): void;
    /**
     * Sets the size of the side panel.
     *
     * @param size the desired size (width) of the panel in pixels.
     */
    resize(size: number): void;
    /**
     * Add a widget and its title to the dock panel and side bar.
     *
     * If the widget is already added, it will be moved.
     */
    addWidget(widget: Widget, options: SidePanel.WidgetOptions): void;
    /**
     * Collapse the sidebar so no items are expanded.
     */
    collapse(): Promise<void>;
    /**
     * Refresh the visibility of the side bar and dock panel.
     */
    refresh(): void;
    /**
     * Create an object that describes the current side panel layout. This object may contain references
     * to widgets; these need to be transformed before the layout can be serialized.
     */
    getLayoutData(): SidePanel.LayoutData;
    /**
     * Apply a side panel layout that has been previously created with `getLayoutData`.
     */
    setLayoutData(layoutData: SidePanel.LayoutData): void;
    /**
     * Activate a widget residing in the side panel by ID.
     *
     * @returns the activated widget if it was found
     */
    activate(id: string): Widget | undefined;
    /**
     * Expand a widget residing in the side panel by ID. If no ID is given and the panel is
     * currently collapsed, the last active tab of this side panel is expanded. If no tab
     * was expanded previously, the first one is taken.
     *
     * @returns the expanded widget if it was found
     */
    expand(id?: string): Widget | undefined;
    protected createSideBar(): SideTabBar;
    protected createSidebarTopMenu(): SidebarTopMenuWidget;
    protected createSidebarMenu<T extends SidebarMenuWidget>(factory: () => T): T;
    protected createSidebarBottomMenu(): SidebarBottomMenuWidget;
    protected createToolbar(): SidePanelToolbar;
    protected showContextMenu(e: MouseEvent): void;
    protected createContainer(): Panel;
    protected createSidePanel(): TartDockPanel;
    protected onWidgetAdded(sender: DockPanel, widget: Widget): void;
    protected onWidgetRemoved(sender: DockPanel, widget: Widget): void;
    /**
     * Determine the default size to apply when the panel is expanded for the first time.
     */
    protected getDefaultPanelSize(): number | undefined;
    /**
     * Modify the width of the panel. This implementation assumes that the parent of the panel
     * container is a `SplitPanel`.
     */
    protected setPanelSize(size: number): Promise<void>;
    /**
     * Compute the current width of the panel. This implementation assumes that the parent of
     * the panel container is a `SplitPanel`.
     */
    protected getPanelSize(): number | undefined;
    protected updateToolbarTitle: () => void;
    /**
     * Handle a `currentChanged` signal from the sidebar. The side panel is refreshed so it displays
     * the new selected widget.
     */
    protected onCurrentTabChanged(sender: SideTabBar, { currentTitle, currentIndex }: TabBar.ICurrentChangedArgs<Widget>): void;
    /**
     * Handle a `tabDetachRequested` signal from the sidebar. A drag is started so the widget can be
     * moved to another application shell area.
     */
    protected onTabDetachRequested(sender: SideTabBar, { title, tab, clientX, clientY }: TabBar.ITabDetachRequestedArgs<Widget>): void;
}
export declare namespace SidePanel {
    /**
     * Options that control the behavior of side panels.
     */
    interface Options {
        /**
         * When a widget is being dragged and the distance of the mouse cursor to the shell border
         * is below this threshold, the respective side panel is expanded so the widget can be dropped
         * into that panel. Set this to `-1` to disable expanding the side panel while dragging.
         */
        expandThreshold: number;
        /**
         * The duration in milliseconds of the animation shown when a side panel is expanded.
         * Set this to `0` to disable expansion animation.
         */
        expandDuration: number;
        /**
         * The ratio of the available shell size to use as initial size for the side panel.
         */
        initialSizeRatio: number;
        /**
         * How large the panel should be when it's expanded and empty.
         */
        emptySize: number;
    }
    /**
     * The options for adding a widget to a side panel
     */
    interface WidgetOptions {
        /**
         * The rank order of the widget among its siblings
         */
        rank?: number;
    }
    /**
     * Data structure used to save and restore the side panel layout.
     */
    interface WidgetItem extends WidgetOptions {
        /** Can be undefined in case the widget could not be restored. */
        widget?: Widget;
        expanded?: boolean;
    }
    interface State {
        /**
         * Indicates whether the panel is empty.
         */
        empty: boolean;
        /**
         * Indicates whether the panel is expanded, collapsed, or in a transition between the two.
         */
        expansion: ExpansionState;
        /**
         * A promise that is resolved when the currently pending side panel updates are done.
         */
        pendingUpdate: Promise<void>;
        /**
         * The index of the last tab that was selected. When the panel is expanded, it tries to restore
         * the tab selection to the previous state.
         */
        lastActiveTabIndex?: number;
        /**
         * The width or height of the panel before it was collapsed. When the panel is expanded, it tries
         * to restore its size to this value.
         */
        lastPanelSize?: number;
    }
    /**
     * Data to save and load the layout of a side panel.
     */
    interface LayoutData {
        type: 'sidepanel';
        items?: WidgetItem[];
        size?: number;
    }
    enum ExpansionState {
        collapsed = "collapsed",
        expanding = "expanding",
        expanded = "expanded",
        collapsing = "collapsing"
    }
}
