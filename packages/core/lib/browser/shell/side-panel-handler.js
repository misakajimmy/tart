var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SidePanelHandler_1;
import { BoxLayout, BoxPanel, Panel, PanelLayout, SplitPanel } from '@lumino/widgets';
import { SideTabBar, TabBarRendererFactory } from './tab-bars';
import { AttachedProperty } from '@lumino/properties';
import { SidebarBottomMenuWidgetFactory, SidebarTopMenuWidgetFactory } from './sidebar-menu-widget';
import { SidePanelToolbar } from './side-panel-toolbar';
import { TartDockPanel } from './tart-dock-panel';
import { inject, injectable } from 'inversify';
import { find, map, some, toArray } from '@lumino/algorithm';
import { FrontendApplicationStateService } from '../frontend-application-state';
import { Disposable, DisposableCollection } from '../../common';
import { MimeData } from '@lumino/coreutils';
import { Drag } from '@lumino/dragdrop';
import { animationFrame } from '../browser';
import { SplitPositionHandler } from './split-panels';
import { TabBarToolbarFactory, TabBarToolbarRegistry } from './tab-bar-toolbar';
import { ContextMenuRenderer } from '../context-menu-renderer';
/** The class name added to the left and right area panels. */
export const LEFT_RIGHT_AREA_CLASS = 'tart-app-sides';
/** The class name added to collapsed side panels. */
const COLLAPSED_CLASS = 'tart-mod-collapsed';
/** Menu path for tab bars used throughout the application shell. */
export const SHELL_TABBAR_CONTEXT_MENU = ['shell-tabbar-context-menu'];
export const SidePanelHandlerFactory = Symbol('SidePanelHandlerFactory');
export const SIDE_PANEL_TOOLBAR_CONTEXT_MENU = ['SIDE_PANEL_TOOLBAR_CONTEXT_MENU'];
let SidePanelHandler = SidePanelHandler_1 = class SidePanelHandler {
    /**
     * A property that can be attached to widgets in order to determine the insertion index
     * of their title in the tab bar.
     */
    static rankProperty = new AttachedProperty({
        name: 'sidePanelRank',
        create: () => undefined
    });
    /**
     * The tab bar displays the titles of the widgets in the side panel. Visibility of the widgets
     * is controlled entirely through tab selection: a widget is revealed by setting the `currentTitle`
     * accordingly in the tab bar, and the panel is hidden by setting that property to `null`. The
     * tab bar itself remains visible as long as there is at least one widget.
     */
    tabBar;
    /**
     * The menu placed on the sidebar top.
     * Displayed as icons.
     * Open menus when on clicks.
     */
    topMenu;
    /**
     * The menu placed on the sidebar bottom.
     * Displayed as icons.
     * Open menus when on clicks.
     */
    bottomMenu;
    /**
     * A tool bar, which displays a title and widget specific command buttons.
     */
    toolBar;
    /**
     * The widget container is a dock panel in `single-document` mode, which means that the panel
     * cannot be split.
     */
    dockPanel;
    /**
     * The panel that contains the tab bar and the dock panel. This one is hidden whenever the dock
     * panel is empty.
     */
    container;
    /**
     * The current state of the side panel.
     */
    state = {
        empty: true,
        expansion: SidePanel.ExpansionState.collapsed,
        pendingUpdate: Promise.resolve()
    };
    /**
     * The shell area where the panel is placed. This property should not be modified directly, but
     * only by calling `create`.
     */
    side;
    /**
     * Options that control the behavior of the side panel.
     */
    options;
    tabBarToolBarRegistry;
    sidebarTopWidgetFactory;
    tabBarToolBarFactory;
    tabBarRendererFactory;
    sidebarBottomWidgetFactory;
    splitPositionHandler;
    applicationStateService;
    contextMenuRenderer;
    toDisposeOnCurrentTabChanged = new DisposableCollection();
    /**
     * Create the side bar and dock panel widgets.
     */
    create(side, options) {
        this.side = side;
        this.options = options;
        this.topMenu = this.createSidebarTopMenu();
        this.tabBar = this.createSideBar();
        this.bottomMenu = this.createSidebarBottomMenu();
        this.toolBar = this.createToolbar();
        this.dockPanel = this.createSidePanel();
        this.container = this.createContainer();
        this.refresh();
    }
    /**
     * Sets the size of the side panel.
     *
     * @param size the desired size (width) of the panel in pixels.
     */
    resize(size) {
        if (this.dockPanel.isHidden) {
            this.state.lastPanelSize = size;
        }
        else {
            this.setPanelSize(size);
        }
    }
    /**
     * Add a widget and its title to the dock panel and side bar.
     *
     * If the widget is already added, it will be moved.
     */
    addWidget(widget, options) {
        if (options.rank) {
            SidePanelHandler_1.rankProperty.set(widget, options.rank);
        }
        this.dockPanel.addWidget(widget);
    }
    /**
     * Collapse the sidebar so no items are expanded.
     */
    collapse() {
        if (this.tabBar.currentTitle) {
            // eslint-disable-next-line no-null/no-null
            this.tabBar.currentTitle = null;
        }
        else {
            this.refresh();
        }
        return animationFrame();
    }
    /**
     * Refresh the visibility of the side bar and dock panel.
     */
    refresh() {
        const container = this.container;
        const parent = container.parent;
        const tabBar = this.tabBar;
        const dockPanel = this.dockPanel;
        const isEmpty = tabBar.titles.length === 0;
        const currentTitle = tabBar.currentTitle;
        // eslint-disable-next-line no-null/no-null
        const hideDockPanel = currentTitle === null;
        let relativeSizes;
        if (hideDockPanel) {
            container.addClass(COLLAPSED_CLASS);
            if (this.state.expansion === SidePanel.ExpansionState.expanded && !this.state.empty) {
                // Update the lastPanelSize property
                const size = this.getPanelSize();
                if (size) {
                    this.state.lastPanelSize = size;
                }
            }
            this.state.expansion = SidePanel.ExpansionState.collapsed;
        }
        else {
            container.removeClass(COLLAPSED_CLASS);
            let size;
            if (this.state.expansion !== SidePanel.ExpansionState.expanded) {
                if (this.state.lastPanelSize) {
                    size = this.state.lastPanelSize;
                }
                else {
                    size = this.getDefaultPanelSize();
                }
            }
            if (size) {
                // Restore the panel size to the last known size or the default size
                this.state.expansion = SidePanel.ExpansionState.expanding;
                if (parent instanceof SplitPanel) {
                    relativeSizes = parent.relativeSizes();
                }
                this.setPanelSize(size).then(() => {
                    if (this.state.expansion === SidePanel.ExpansionState.expanding) {
                        this.state.expansion = SidePanel.ExpansionState.expanded;
                    }
                });
            }
            else {
                this.state.expansion = SidePanel.ExpansionState.expanded;
            }
        }
        container.setHidden(isEmpty && hideDockPanel);
        tabBar.setHidden(isEmpty);
        dockPanel.setHidden(hideDockPanel);
        this.state.empty = isEmpty;
        if (currentTitle) {
            dockPanel.selectWidget(currentTitle.owner);
        }
        if (relativeSizes && parent instanceof SplitPanel) {
            // Make sure that the expansion animation starts at the smallest possible size
            parent.setRelativeSizes(relativeSizes);
        }
    }
    /**
     * Create an object that describes the current side panel layout. This object may contain references
     * to widgets; these need to be transformed before the layout can be serialized.
     */
    getLayoutData() {
        const currentTitle = this.tabBar.currentTitle;
        const items = toArray(map(this.tabBar.titles, title => ({
            widget: title.owner,
            rank: SidePanelHandler_1.rankProperty.get(title.owner),
            expanded: title === currentTitle
        })));
        // eslint-disable-next-line no-null/no-null
        const size = currentTitle !== null ? this.getPanelSize() : this.state.lastPanelSize;
        return { type: 'sidepanel', items, size };
    }
    /**
     * Apply a side panel layout that has been previously created with `getLayoutData`.
     */
    setLayoutData(layoutData) {
        // eslint-disable-next-line no-null/no-null
        this.tabBar.currentTitle = null;
        let currentTitle;
        if (layoutData.items) {
            for (const { widget, rank, expanded } of layoutData.items) {
                if (widget) {
                    if (rank) {
                        SidePanelHandler_1.rankProperty.set(widget, rank);
                    }
                    if (expanded) {
                        currentTitle = widget.title;
                    }
                    // Add the widgets directly to the tab bar in the same order as they are stored
                    this.tabBar.addTab(widget.title);
                }
            }
        }
        if (layoutData.size) {
            this.state.lastPanelSize = layoutData.size;
        }
        // If the layout data contains an expanded item, update the currentTitle property
        // This implies a refresh through the `currentChanged` signal
        if (currentTitle) {
            this.tabBar.currentTitle = currentTitle;
        }
        else {
            this.refresh();
        }
    }
    /**
     * Activate a widget residing in the side panel by ID.
     *
     * @returns the activated widget if it was found
     */
    activate(id) {
        const widget = this.expand(id);
        if (widget) {
            widget.activate();
        }
        return widget;
    }
    /**
     * Expand a widget residing in the side panel by ID. If no ID is given and the panel is
     * currently collapsed, the last active tab of this side panel is expanded. If no tab
     * was expanded previously, the first one is taken.
     *
     * @returns the expanded widget if it was found
     */
    expand(id) {
        if (id) {
            const widget = find(this.dockPanel.widgets(), w => w.id === id);
            if (widget) {
                this.tabBar.currentTitle = widget.title;
            }
            return widget;
        }
        else if (this.tabBar.currentTitle) {
            return this.tabBar.currentTitle.owner;
        }
        else if (this.tabBar.titles.length > 0) {
            let index = this.state.lastActiveTabIndex;
            if (!index) {
                index = 0;
            }
            else if (index >= this.tabBar.titles.length) {
                index = this.tabBar.titles.length - 1;
            }
            const title = this.tabBar.titles[index];
            this.tabBar.currentTitle = title;
            return title.owner;
        }
        else {
            // Reveal the tab bar and dock panel even if there is no widget
            // The next call to `refreshVisibility` will collapse them again
            this.state.expansion = SidePanel.ExpansionState.expanding;
            let relativeSizes;
            const parent = this.container.parent;
            if (parent instanceof SplitPanel) {
                relativeSizes = parent.relativeSizes();
            }
            this.container.removeClass(COLLAPSED_CLASS);
            this.container.show();
            this.tabBar.show();
            this.dockPanel.node.style.minWidth = '0';
            this.dockPanel.show();
            if (relativeSizes && parent instanceof SplitPanel) {
                // Make sure that the expansion animation starts at zero size
                parent.setRelativeSizes(relativeSizes);
            }
            this.setPanelSize(this.options.emptySize).then(() => {
                if (this.state.expansion === SidePanel.ExpansionState.expanding) {
                    this.state.expansion = SidePanel.ExpansionState.expanded;
                }
            });
        }
    }
    createSideBar() {
        const side = this.side;
        const tabBarRenderer = this.tabBarRendererFactory();
        const sideBar = new SideTabBar({
            // Tab bar options
            orientation: side === 'left' || side === 'right' ? 'vertical' : 'horizontal',
            insertBehavior: 'none',
            removeBehavior: 'select-previous-tab',
            allowDeselect: false,
            tabsMovable: true,
            renderer: tabBarRenderer,
            // Scroll bar options
            handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
            useBothWheelAxes: true,
            scrollYMarginOffset: 8,
            suppressScrollX: true
        });
        tabBarRenderer.tabBar = sideBar;
        sideBar.disposed.connect(() => tabBarRenderer.dispose());
        tabBarRenderer.contextMenuPath = SHELL_TABBAR_CONTEXT_MENU;
        sideBar.addClass('tart-app-' + side);
        sideBar.addClass(LEFT_RIGHT_AREA_CLASS);
        sideBar.tabAdded.connect((sender, { title }) => {
            const widget = title.owner;
            if (!some(this.dockPanel.widgets(), w => w === widget)) {
                this.dockPanel.addWidget(widget);
            }
        }, this);
        sideBar.tabActivateRequested.connect((sender, { title }) => title.owner.activate());
        sideBar.tabCloseRequested.connect((sender, { title }) => title.owner.close());
        sideBar.collapseRequested.connect(() => this.collapse(), this);
        sideBar.currentChanged.connect(this.onCurrentTabChanged, this);
        sideBar.tabDetachRequested.connect(this.onTabDetachRequested, this);
        return sideBar;
    }
    createSidebarTopMenu() {
        return this.createSidebarMenu(this.sidebarTopWidgetFactory);
    }
    createSidebarMenu(factory) {
        const menu = factory();
        menu.addClass('tart-sidebar-menu');
        return menu;
    }
    createSidebarBottomMenu() {
        return this.createSidebarMenu(this.sidebarBottomWidgetFactory);
    }
    createToolbar() {
        const toolbar = new SidePanelToolbar(this.tabBarToolBarRegistry, this.tabBarToolBarFactory, this.side);
        toolbar.onContextMenu(e => this.showContextMenu(e));
        return toolbar;
    }
    showContextMenu(e) {
        const title = this.tabBar.currentTitle;
        if (!title) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        this.contextMenuRenderer.render({
            args: [title.owner],
            menuPath: SIDE_PANEL_TOOLBAR_CONTEXT_MENU,
            anchor: e
        });
    }
    createContainer() {
        const contentBox = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
        BoxPanel.setStretch(this.toolBar, 0);
        contentBox.addWidget(this.toolBar);
        BoxPanel.setStretch(this.dockPanel, 1);
        contentBox.addWidget(this.dockPanel);
        const contentPanel = new BoxPanel({ layout: contentBox });
        const side = this.side;
        let direction;
        switch (side) {
            case 'left':
                direction = 'left-to-right';
                break;
            case 'right':
                direction = 'right-to-left';
                break;
            default:
                throw new Error('Illegal argument: ' + side);
        }
        const containerLayout = new BoxLayout({ direction, spacing: 0 });
        const sidebarContainerLayout = new PanelLayout();
        const sidebarContainer = new Panel({ layout: sidebarContainerLayout });
        sidebarContainer.addClass('tart-app-sidebar-container');
        sidebarContainerLayout.addWidget(this.topMenu);
        sidebarContainerLayout.addWidget(this.tabBar);
        sidebarContainerLayout.addWidget(this.bottomMenu);
        BoxPanel.setStretch(sidebarContainer, 0);
        BoxPanel.setStretch(contentPanel, 1);
        containerLayout.addWidget(sidebarContainer);
        containerLayout.addWidget(contentPanel);
        const boxPanel = new BoxPanel({ layout: containerLayout });
        boxPanel.id = 'tart-' + side + '-content-panel';
        return boxPanel;
    }
    createSidePanel() {
        const sidePanel = new TartDockPanel({
            mode: 'single-document'
        });
        sidePanel.id = 'tart-' + this.side + '-side-panel';
        sidePanel.addClass('tart-side-panel');
        sidePanel.widgetActivated.connect((sender, widget) => {
            this.tabBar.currentTitle = widget.title;
        }, this);
        sidePanel.widgetAdded.connect(this.onWidgetAdded, this);
        sidePanel.widgetRemoved.connect(this.onWidgetRemoved, this);
        return sidePanel;
    }
    /*
     * Handle the `widgetAdded` signal from the dock panel. The widget's title is inserted into the
     * tab bar according to the `rankProperty` value that may be attached to the widget.
     */
    onWidgetAdded(sender, widget) {
        const titles = this.tabBar.titles;
        if (!find(titles, t => t.owner === widget)) {
            const rank = SidePanelHandler_1.rankProperty.get(widget);
            let index = titles.length;
            if (rank !== undefined) {
                for (let i = index - 1; i >= 0; i--) {
                    const r = SidePanelHandler_1.rankProperty.get(titles[i].owner);
                    if (r !== undefined && r > rank) {
                        index = i;
                    }
                }
            }
            this.tabBar.insertTab(index, widget.title);
            this.refresh();
        }
    }
    /*
     * Handle the `widgetRemoved` signal from the dock panel. The widget's title is also removed
     * from the tab bar.
     */
    onWidgetRemoved(sender, widget) {
        this.tabBar.removeTab(widget.title);
        this.refresh();
    }
    /**
     * Determine the default size to apply when the panel is expanded for the first time.
     */
    getDefaultPanelSize() {
        const parent = this.container.parent;
        if (parent && parent.isVisible) {
            return parent.node.clientWidth * this.options.initialSizeRatio;
        }
    }
    /**
     * Modify the width of the panel. This implementation assumes that the parent of the panel
     * container is a `SplitPanel`.
     */
    setPanelSize(size) {
        const enableAnimation = this.applicationStateService.state === 'ready';
        const options = {
            side: this.side,
            duration: enableAnimation ? this.options.expandDuration : 0,
            referenceWidget: this.dockPanel
        };
        const promise = this.splitPositionHandler.setSidePanelSize(this.container, size, options);
        const result = new Promise(resolve => {
            // Resolve the resulting promise in any case, regardless of whether resizing was successful
            promise.then(() => resolve(), () => resolve());
        });
        this.state.pendingUpdate = this.state.pendingUpdate.then(() => result);
        return result;
    }
    /**
     * Compute the current width of the panel. This implementation assumes that the parent of
     * the panel container is a `SplitPanel`.
     */
    getPanelSize() {
        const parent = this.container.parent;
        if (parent instanceof SplitPanel && parent.isVisible) {
            const index = parent.widgets.indexOf(this.container);
            if (this.side === 'left') {
                const handle = parent.handles[index];
                if (!handle.classList.contains('p-mod-hidden')) {
                    return handle.offsetLeft;
                }
            }
            else if (this.side === 'right') {
                const handle = parent.handles[index - 1];
                if (!handle.classList.contains('p-mod-hidden')) {
                    const parentWidth = parent.node.clientWidth;
                    return parentWidth - handle.offsetLeft;
                }
            }
        }
    }
    // should be a property to preserve fn identity
    updateToolbarTitle = () => {
        const currentTitle = this.tabBar && this.tabBar.currentTitle;
        this.toolBar.toolbarTitle = currentTitle || undefined;
    };
    /**
     * Handle a `currentChanged` signal from the sidebar. The side panel is refreshed so it displays
     * the new selected widget.
     */
    onCurrentTabChanged(sender, { currentTitle, currentIndex }) {
        this.toDisposeOnCurrentTabChanged.dispose();
        if (currentTitle) {
            this.updateToolbarTitle();
            currentTitle.changed.connect(this.updateToolbarTitle);
            this.toDisposeOnCurrentTabChanged.push(Disposable.create(() => currentTitle.changed.disconnect(this.updateToolbarTitle)));
        }
        if (currentIndex >= 0) {
            this.state.lastActiveTabIndex = currentIndex;
            sender.revealTab(currentIndex);
        }
        this.refresh();
    }
    /**
     * Handle a `tabDetachRequested` signal from the sidebar. A drag is started so the widget can be
     * moved to another application shell area.
     */
    onTabDetachRequested(sender, { title, tab, clientX, clientY }) {
        // Release the tab bar's hold on the mouse
        sender.releaseMouse();
        // Clone the selected tab and use that as drag image
        const clonedTab = tab.cloneNode(true);
        clonedTab.style.width = '';
        clonedTab.style.height = '';
        const label = clonedTab.getElementsByClassName('p-TabBar-tabLabel')[0];
        label.style.width = '';
        label.style.height = '';
        // Create and start a drag to move the selected tab to another panel
        const mimeData = new MimeData();
        mimeData.setData('application/vnd.phosphor.widget-factory', () => title.owner);
        const drag = new Drag({
            mimeData,
            dragImage: clonedTab,
            proposedAction: 'move',
            supportedActions: 'move',
        });
        tab.classList.add('p-mod-hidden');
        drag.start(clientX, clientY).then(() => {
            // The promise is resolved when the drag has ended
            tab.classList.remove('p-mod-hidden');
        });
    }
};
__decorate([
    inject(TabBarToolbarRegistry)
], SidePanelHandler.prototype, "tabBarToolBarRegistry", void 0);
__decorate([
    inject(SidebarTopMenuWidgetFactory)
], SidePanelHandler.prototype, "sidebarTopWidgetFactory", void 0);
__decorate([
    inject(TabBarToolbarFactory)
], SidePanelHandler.prototype, "tabBarToolBarFactory", void 0);
__decorate([
    inject(TabBarRendererFactory)
], SidePanelHandler.prototype, "tabBarRendererFactory", void 0);
__decorate([
    inject(SidebarBottomMenuWidgetFactory)
], SidePanelHandler.prototype, "sidebarBottomWidgetFactory", void 0);
__decorate([
    inject(SplitPositionHandler)
], SidePanelHandler.prototype, "splitPositionHandler", void 0);
__decorate([
    inject(FrontendApplicationStateService)
], SidePanelHandler.prototype, "applicationStateService", void 0);
__decorate([
    inject(ContextMenuRenderer)
], SidePanelHandler.prototype, "contextMenuRenderer", void 0);
SidePanelHandler = SidePanelHandler_1 = __decorate([
    injectable()
], SidePanelHandler);
export { SidePanelHandler };
export var SidePanel;
(function (SidePanel) {
    let ExpansionState;
    (function (ExpansionState) {
        ExpansionState["collapsed"] = "collapsed";
        ExpansionState["expanding"] = "expanding";
        ExpansionState["expanded"] = "expanded";
        ExpansionState["collapsing"] = "collapsing";
    })(ExpansionState = SidePanel.ExpansionState || (SidePanel.ExpansionState = {}));
})(SidePanel || (SidePanel = {}));

//# sourceMappingURL=../../../lib/browser/shell/side-panel-handler.js.map
