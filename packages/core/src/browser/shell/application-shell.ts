import {inject, injectable, optional, postConstruct} from 'inversify';
import {
  BoxLayout,
  BoxPanel,
  DockLayout,
  DockPanel,
  FocusTracker,
  Layout,
  Panel,
  SplitLayout,
  SplitPanel,
  TabBar,
  Title,
  Widget
} from '@lumino/widgets';
import {BOTTOM_AREA_ID, MAIN_AREA_ID, TartDockPanel} from './tart-dock-panel';
import {Disposable, DisposableCollection, Emitter, Event as CommonEvent, RecursivePartial} from '../../common';
import {SidePanel, SidePanelHandler, SidePanelHandlerFactory} from './side-panel-handler';
import {StatusBarAlignment, StatusBarEntry, StatusBarImpl} from '../status-bar';
import {ArrayExt, each, find, toArray} from '@lumino/algorithm';
import {Saveable, SaveableWidget, SaveOptions} from '../saveable';
import {Message} from '@lumino/messaging';
import {waitForClosed, waitForRevealed} from '../widgets';
import {FrontendApplicationStateService} from '../frontend-application-state';
import {SplitPositionHandler, SplitPositionOptions} from './split-panels';
import {animationFrame} from '../browser';
import {Signal} from '@lumino/signaling';
import {ContextKeyService} from '../context-key-service';
import {ScrollableTabBar} from './tab-bars';
// import {TabBarRenderer, TabBarRendererFactory} from './tab-bars';
// import {TabBarToolbar, TabBarToolbarFactory, TabBarToolbarRegistry} from './tab-bar-toolbar';

export type ApplicationShellLayoutVersion =
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
export const applicationShellLayoutVersion: ApplicationShellLayoutVersion = 5.0;

/** The class name added to ApplicationShell instances. */
const APPLICATION_SHELL_CLASS = 'tart-ApplicationShell';
/** The class name added to the main and bottom area panels. */
const MAIN_BOTTOM_AREA_CLASS = 'tart-app-centers';
/** Status bar entry identifier for the bottom panel toggle button. */
const BOTTOM_PANEL_TOGGLE_ID = 'bottom-panel-toggle';
/** The class name added to the main area panel. */
const MAIN_AREA_CLASS = 'tart-app-main';
/** The class name added to the bottom area panel. */
const BOTTOM_AREA_CLASS = 'tart-app-bottom';

export const ApplicationShellOptions = Symbol('ApplicationShellOptions');
export const DockPanelRendererFactory = Symbol('DockPanelRendererFactory');


/**
 * A renderer for dock panels that supports context menus on tabs.
 */
// @injectable()
// export class DockPanelRenderer implements DockLayout.IRenderer {
//
//     readonly tabBarClasses: string[] = [];
//
//     constructor(
//         @inject(TabBarRendererFactory) protected readonly tabBarRendererFactory: () => TabBarRenderer,
//         @inject(TabBarToolbarRegistry) protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
//         @inject(TabBarToolbarFactory) protected readonly tabBarToolbarFactory: () => TabBarToolbar,
//         @inject(BreadcrumbsRendererFactory) protected readonly breadcrumbsRendererFactory: BreadcrumbsRendererFactory,
//     ) { }
//
//     createTabBar(): TabBar<Widget> {
//         const renderer = this.tabBarRendererFactory();
//         const tabBar = new ToolbarAwareTabBar(
//             this.tabBarToolbarRegistry,
//             this.tabBarToolbarFactory,
//             this.breadcrumbsRendererFactory,
//             {
//                 renderer,
//                 // Scroll bar options
//                 handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
//                 useBothWheelAxes: true,
//                 scrollXMarginOffset: 4,
//                 suppressScrollY: true
//             });
//         this.tabBarClasses.forEach(c => tabBar.addClass(c));
//         renderer.tabBar = tabBar;
//         tabBar.disposed.connect(() => renderer.dispose());
//         renderer.contextMenuPath = SHELL_TABBAR_CONTEXT_MENU;
//         tabBar.currentChanged.connect(this.onCurrentTabChanged, this);
//         return tabBar;
//     }
//
//     createHandle(): HTMLDivElement {
//         return DockPanel.defaultRenderer.createHandle();
//     }
//
//     protected onCurrentTabChanged(sender: ToolbarAwareTabBar, { currentIndex }: TabBar.ICurrentChangedArgs<Widget>): void {
//         if (currentIndex >= 0) {
//             sender.revealTab(currentIndex);
//         }
//     }
// }

@injectable()
export class ApplicationShell extends Widget {
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
  readonly currentChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);
  /**
   * A signal emitted whenever the `activeWidget` property is changed.
   *
   * @deprecated since 0.11.0, use `onDidChangeActiveWidget` instead
   */
  readonly activeChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);
  /**
   * General options for the application shell.
   */
  protected options: ApplicationShell.Options;
  /**
   * The current state of the bottom panel.
   */
  protected readonly bottomPanelState: SidePanel.State = {
    empty: true,
    expansion: SidePanel.ExpansionState.collapsed,
    pendingUpdate: Promise.resolve()
  };
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;
  protected readonly onDidAddWidgetEmitter = new Emitter<Widget>();
  readonly onDidAddWidget = this.onDidAddWidgetEmitter.event;
  protected readonly onDidChangeActiveWidgetEmitter = new Emitter<FocusTracker.IChangedArgs<Widget>>();
  readonly onDidChangeActiveWidget = this.onDidChangeActiveWidgetEmitter.event;

  protected readonly onDidChangeCurrentWidgetEmitter = new Emitter<FocusTracker.IChangedArgs<Widget>>();
  readonly onDidChangeCurrentWidget = this.onDidChangeCurrentWidgetEmitter.event;

  protected readonly onDidRemoveWidgetEmitter = new Emitter<Widget>();
  readonly onDidRemoveWidget = this.onDidRemoveWidgetEmitter.event;
  protected readonly toDisposeOnActiveChanged = new DisposableCollection();
  private readonly tracker = new FocusTracker<Widget>();
  private readonly activationTimeout = 2000;
  private readonly toDisposeOnActivationCheck = new DisposableCollection();

  /**
   * Construct a new application shell.
   */
  constructor(
      // @inject(DockPanelRendererFactory) protected dockPanelRendererFactory: () => DockPanelRenderer,
      @inject(StatusBarImpl) protected readonly statusBar: StatusBarImpl,
      @inject(SidePanelHandlerFactory) sidePanelHandlerFactory: () => SidePanelHandler,
      @inject(FrontendApplicationStateService) protected readonly applicationStateService: FrontendApplicationStateService,
      @inject(SplitPositionHandler) protected splitPositionHandler: SplitPositionHandler,
      @inject(ApplicationShellOptions) @optional() options: RecursivePartial<ApplicationShell.Options> = {},
  ) {
    super();
    this.addClass(APPLICATION_SHELL_CLASS);
    this.id = 'tart-app-shell';

    // Merge the user-defined application options with the default options
    this.options = {
      bottomPanel: {
        ...ApplicationShell.DEFAULT_OPTIONS.bottomPanel,
        ...options?.bottomPanel || {}
      },
      leftPanel: {
        ...ApplicationShell.DEFAULT_OPTIONS.leftPanel,
        ...options?.leftPanel
      },
      rightPanel: {
        ...ApplicationShell.DEFAULT_OPTIONS.rightPanel,
        ...options?.rightPanel || {}
      }
    };

    this.mainPanel = this.createMainPanel();
    this.topPanel = this.createTopPanel();
    this.bottomPanel = this.createBottomPanel();

    this.leftPanelHandler = sidePanelHandlerFactory();
    this.leftPanelHandler.create('left', this.options.leftPanel);
    this.leftPanelHandler.dockPanel.widgetAdded.connect((_, widget) => this.fireDidAddWidget(widget));
    this.leftPanelHandler.dockPanel.widgetRemoved.connect((_, widget) => this.fireDidRemoveWidget(widget));

    this.rightPanelHandler = sidePanelHandlerFactory();
    this.rightPanelHandler.create('right', this.options.rightPanel);
    this.rightPanelHandler.dockPanel.widgetAdded.connect((_, widget) => this.fireDidAddWidget(widget));
    this.rightPanelHandler.dockPanel.widgetRemoved.connect((_, widget) => this.fireDidRemoveWidget(widget));

    this.layout = this.createLayout();
    this.tracker.currentChanged.connect(this.onCurrentChanged, this);
    this.tracker.activeChanged.connect(this.onActiveChanged, this);
  }

  /**
   * The tab bars contained in the main shell area. If there is no widget in the main area, the
   * returned array is empty.
   */
  get mainAreaTabBars(): TabBar<Widget>[] {
    return toArray(this.mainPanel.tabBars());
  }

  /**
   * The tab bars contained in the bottom shell area. If there is no widget in the bottom area,
   * the returned array is empty.
   */
  get bottomAreaTabBars(): TabBar<Widget>[] {
    return toArray(this.bottomPanel.tabBars());
  }

  /**
   * The tab bars contained in all shell areas.
   */
  get allTabBars(): TabBar<Widget>[] {
    return [...this.mainAreaTabBars, ...this.bottomAreaTabBars, this.leftPanelHandler.tabBar, this.rightPanelHandler.tabBar];
  }

  /**
   * The shell area name of the currently active tab, or undefined.
   */
  get currentTabArea(): ApplicationShell.Area | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
      return this.getAreaFor(currentWidget);
    }
  }

  /**
   * Returns a snapshot of all tracked widgets to allow async modifications.
   */
  get widgets(): ReadonlyArray<Widget> {
    return [...this.tracker.widgets];
  }

  /**
   * A promise that is resolved when all currently pending updates are done.
   */
  get pendingUpdates(): Promise<void> {
    return Promise.all([
      this.bottomPanelState.pendingUpdate,
      this.leftPanelHandler.state.pendingUpdate,
      this.rightPanelHandler.state.pendingUpdate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as Promise<any>;
  }

  /**
   * The current widget in the application shell. The current widget is the last widget that
   * was active and not yet closed. See the remarks to `activeWidget` on what _active_ means.
   */
  get currentWidget(): Widget | undefined {
    return this.tracker.currentWidget || undefined;
  }

  /**
   * Return the tab bar that has the currently active widget, or undefined.
   */
  get currentTabBar(): TabBar<Widget> | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
      return this.getTabBarFor(currentWidget);
    }
  }

  /**
   * The active widget in the application shell. The active widget is the one that has focus
   * (either the widget itself or any of its contents).
   *
   * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * does not take any focus; in that case the widget is never returned by this property.
   */
  get activeWidget(): Widget | undefined {
    return this.tracker.activeWidget || undefined;
  }

  /**
   * Save the current widget if it is dirty.
   */
  async save(options?: SaveOptions): Promise<void> {
    await Saveable.save(this.currentWidget, options);
  }

  /**
   * The widgets contained in the given shell area.
   */
  getWidgets(area: ApplicationShell.Area): Widget[] {
    switch (area) {
      case 'main':
        return toArray(this.mainPanel.widgets());
      case 'top':
        return toArray(this.topPanel.widgets);
      case 'bottom':
        return toArray(this.bottomPanel.widgets());
      case 'left':
        return toArray(this.leftPanelHandler.dockPanel.widgets());
      case 'right':
        return toArray(this.rightPanelHandler.dockPanel.widgets());
      default:
        throw new Error('Illegal argument: ' + area);
    }
  }

  /**
   * Find the widget that contains the given HTML element. The returned widget may be one
   * that is managed by the application shell, or one that is embedded in another widget and
   * not directly managed by the shell, or a tab bar.
   */
  findWidgetForElement(element: HTMLElement): Widget | undefined {
    let widgetNode: HTMLElement | null = element;
    while (widgetNode && !widgetNode.classList.contains('p-Widget')) {
      widgetNode = widgetNode.parentElement;
    }
    if (widgetNode) {
      return this.findWidgetForNode(widgetNode, this);
    }
    return undefined;
  }

  /**
   * Finds the title widget from the tab-bar.
   * @param tabBar used for providing an array of titles.
   * @returns the selected title widget, else returns the currentTitle or undefined.
   */
  findTitle(tabBar: TabBar<Widget>, event?: Event): Title<Widget> | undefined {
    if (event?.target instanceof HTMLElement) {
      let tabNode: HTMLElement | null = event.target;
      while (tabNode && !tabNode.classList.contains('p-TabBar-tab')) {
        tabNode = tabNode.parentElement;
      }
      if (tabNode && tabNode.title) {
        let title = tabBar.titles.find(t => t.caption === tabNode!.title);
        if (title) {
          return title;
        }
        title = tabBar.titles.find(t => t.label === tabNode!.title);
        if (title) {
          return title;
        }
      }
    }
    return tabBar.currentTitle || undefined;
  }

  /**
   * Finds the tab-bar widget.
   * @returns the selected tab-bar, else returns the currentTabBar.
   */
  findTabBar(event?: Event): TabBar<Widget> | undefined {
    if (event?.target instanceof HTMLElement) {
      const tabBar = this.findWidgetForElement(event.target);
      if (tabBar instanceof TabBar) {
        return tabBar;
      }
    }
    return this.currentTabBar;
  }

  /**
   *  @returns the widget whose title has been targeted by a DOM event on a tabbar, or undefined if none can be found.
   */
  findTargetedWidget(event?: Event): Widget | undefined {
    if (event) {
      const tab = this.findTabBar(event);
      const title = tab && this.findTitle(tab, event);
      return title && title.owner;
    }
  }

  /**
   * Add a widget to the application shell. The given widget must have a unique `id` property,
   * which will be used as the DOM id.
   *
   * Widgets are removed from the shell by calling their `close` or `dispose` methods.
   *
   * Widgets added to the top area are not tracked regarding the _current_ and _active_ states.
   */
  async addWidget(widget: Widget, options: Readonly<ApplicationShell.WidgetOptions> = {}): Promise<void> {
    if (!widget.id) {
      console.error('Widgets added to the application shell must have a unique id property.');
      return;
    }
    let ref: Widget | undefined = options.ref;
    let area: ApplicationShell.Area = options.area || 'main';
    if (!ref && (area === 'main' || area === 'bottom')) {
      const tabBar = this.getTabBarFor(area);
      ref = tabBar && tabBar.currentTitle && tabBar.currentTitle.owner || undefined;
    }
    // make sure that ref belongs to area
    area = ref && this.getAreaFor(ref) || area;
    const addOptions: DockPanel.IAddOptions = {};
    if (ApplicationShell.isOpenToSideMode(options.mode)) {
      const areaPanel = area === 'main' ? this.mainPanel : area === 'bottom' ? this.bottomPanel : undefined;
      const sideRef = areaPanel && ref && (options.mode === 'open-to-left' ?
          areaPanel.previousTabBarWidget(ref) :
          areaPanel.nextTabBarWidget(ref));
      if (sideRef) {
        addOptions.ref = sideRef;
      } else {
        addOptions.ref = ref;
        addOptions.mode = options.mode === 'open-to-left' ? 'split-left' : 'split-right';
      }
    } else {
      addOptions.ref = ref;
      addOptions.mode = options.mode;
    }
    const sidePanelOptions: SidePanel.WidgetOptions = {rank: options.rank};
    switch (area) {
      case 'main':
        this.mainPanel.addWidget(widget, addOptions);
        break;
      case 'top':
        this.topPanel.addWidget(widget);
        break;
      case 'bottom':
        this.bottomPanel.addWidget(widget, addOptions);
        break;
      case 'left':
        this.leftPanelHandler.addWidget(widget, sidePanelOptions);
        break;
      case 'right':
        this.rightPanelHandler.addWidget(widget, sidePanelOptions);
        break;
      default:
        throw new Error('Unexpected area: ' + options.area);
    }
    if (area !== 'top') {
      this.track(widget);
    }
  }

  /**
   * Return the tab bar in the given shell area, or the tab bar that has the given widget, or undefined.
   */
  getTabBarFor(widgetOrArea: Widget | ApplicationShell.Area): TabBar<Widget> | undefined {
    if (typeof widgetOrArea === 'string') {
      switch (widgetOrArea) {
        case 'main':
          return this.mainPanel.currentTabBar;
        case 'bottom':
          return this.bottomPanel.currentTabBar;
        case 'left':
          return this.leftPanelHandler.tabBar;
        case 'right':
          return this.rightPanelHandler.tabBar;
        default:
          throw new Error('Illegal argument: ' + widgetOrArea);
      }
    }
    const widget = this.toTrackedStack(widgetOrArea.id).pop();
    if (!widget) {
      return undefined;
    }
    const widgetTitle = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(widgetTitle);
    if (mainPanelTabBar) {
      return mainPanelTabBar;
    }
    const bottomPanelTabBar = this.bottomPanel.findTabBar(widgetTitle);
    if (bottomPanelTabBar) {
      return bottomPanelTabBar;
    }
    const leftPanelTabBar = this.leftPanelHandler.tabBar;
    if (ArrayExt.firstIndexOf(leftPanelTabBar.titles, widgetTitle) > -1) {
      return leftPanelTabBar;
    }
    const rightPanelTabBar = this.rightPanelHandler.tabBar;
    if (ArrayExt.firstIndexOf(rightPanelTabBar.titles, widgetTitle) > -1) {
      return rightPanelTabBar;
    }
    return undefined;
  }

  /**
   * Determine the name of the shell area where the given widget resides. The result is
   * undefined if the widget does not reside directly in the shell.
   */
  getAreaFor(input: TabBar<Widget> | Widget): ApplicationShell.Area | undefined {
    if (input instanceof TabBar) {
      if (find(this.mainPanel.tabBars(), tb => tb === input)) {
        return 'main';
      }
      if (find(this.bottomPanel.tabBars(), tb => tb === input)) {
        return 'bottom';
      }
      if (this.leftPanelHandler.tabBar === input) {
        return 'left';
      }
      if (this.rightPanelHandler.tabBar === input) {
        return 'right';
      }
    }
    const widget = this.toTrackedStack(input.id).pop();
    if (!widget) {
      return undefined;
    }
    const title = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(title);
    if (mainPanelTabBar) {
      return 'main';
    }
    const bottomPanelTabBar = this.bottomPanel.findTabBar(title);
    if (bottomPanelTabBar) {
      return 'bottom';
    }
    if (ArrayExt.firstIndexOf(this.leftPanelHandler.tabBar.titles, title) > -1) {
      return 'left';
    }
    if (ArrayExt.firstIndexOf(this.rightPanelHandler.tabBar.titles, title) > -1) {
      return 'right';
    }
    return undefined;
  }

  /**
   * Create an object that describes the current shell layout. This object may contain references
   * to widgets; these need to be transformed before the layout can be serialized.
   */
  getLayoutData(): ApplicationShell.LayoutData {
    return {
      version: applicationShellLayoutVersion,
      mainPanel: this.mainPanel.saveLayout(),
      bottomPanel: {
        config: this.bottomPanel.saveLayout(),
        size: this.bottomPanel.isVisible ? this.getBottomPanelSize() : this.bottomPanelState.lastPanelSize,
        expanded: this.isExpanded('bottom')
      },
      leftPanel: this.leftPanelHandler.getLayoutData(),
      rightPanel: this.rightPanelHandler.getLayoutData(),
      activeWidgetId: this.activeWidget ? this.activeWidget.id : undefined
    };
  }

  /**
   * Collapse the named side panel area. This makes sure that the panel is hidden,
   * increasing the space that is available for other shell areas.
   */
  collapsePanel(area: ApplicationShell.Area): Promise<void> {
    switch (area) {
      case 'bottom':
        return this.collapseBottomPanel();
      case 'left':
        return this.leftPanelHandler.collapse();
      case 'right':
        return this.rightPanelHandler.collapse();
      default:
        throw new Error('Area cannot be collapsed: ' + area);
    }
  }

  /**
   * Reveal a widget in the application shell. This makes the widget visible,
   * but does not activate it.
   *
   * @returns the revealed widget if it was found
   */
  async revealWidget(id: string): Promise<Widget | undefined> {
    const stack = this.toTrackedStack(id);
    let current = stack.pop();
    if (current && !this.doRevealWidget(current.id)) {
      return undefined;
    }
    while (current && stack.length) {
      const child = stack.pop()!;
      if (ApplicationShell.TrackableWidgetProvider.is(current) && current.revealWidget) {
        current = current.revealWidget(child.id);
      } else {
        current = child;
      }
    }
    if (!current) {
      return undefined;
    }
    await Promise.all([
      waitForRevealed(current),
      this.pendingUpdates
    ]);
    return current;
  }

  /**
   * Expand the named side panel area. This makes sure that the panel is visible, even if there
   * are no widgets in it. If the panel is already visible, nothing happens. If the panel is currently
   * collapsed (see `collapsePanel`) and it contains widgets, the widgets are revealed that were
   * visible before it was collapsed.
   */
  expandPanel(area: ApplicationShell.Area): void {
    switch (area) {
      case 'bottom':
        this.expandBottomPanel();
        break;
      case 'left':
        this.leftPanelHandler.expand();
        break;
      case 'right':
        this.rightPanelHandler.expand();
        break;
      default:
        throw new Error('Area cannot be expanded: ' + area);
    }
  }

  /**
   * Adjusts the size of the given area in the application shell.
   *
   * @param size the desired size of the panel in pixels.
   * @param area the area to resize.
   */
  resize(size: number, area: ApplicationShell.Area): void {
    switch (area) {
      case 'bottom':
        if (this.bottomPanel.isHidden) {
          this.bottomPanelState.lastPanelSize = size;
        } else {
          this.setBottomPanelSize(size);
        }
        break;
      case 'left':
        this.leftPanelHandler.resize(size);
        break;
      case 'right':
        this.rightPanelHandler.resize(size);
        break;
      default:
        throw new Error('Area cannot be resized: ' + area);
    }
  }

  /**
   * Apply a shell layout that has been previously created with `getLayoutData`.
   */
  async setLayoutData(layoutData: ApplicationShell.LayoutData): Promise<void> {
    const {mainPanel, bottomPanel, leftPanel, rightPanel, activeWidgetId} = layoutData;
    if (leftPanel) {
      this.leftPanelHandler.setLayoutData(leftPanel);
      this.registerWithFocusTracker(leftPanel);
    }
    if (rightPanel) {
      this.rightPanelHandler.setLayoutData(rightPanel);
      this.registerWithFocusTracker(rightPanel);
    }
    // Proceed with the bottom panel once the side panels are set up
    await Promise.all([this.leftPanelHandler.state.pendingUpdate, this.rightPanelHandler.state.pendingUpdate]);
    if (bottomPanel) {
      if (bottomPanel.config) {
        this.bottomPanel.restoreLayout(bottomPanel.config);
        this.registerWithFocusTracker(bottomPanel.config.main);
      }
      if (bottomPanel.size) {
        this.bottomPanelState.lastPanelSize = bottomPanel.size;
      }
      if (bottomPanel.expanded) {
        this.expandBottomPanel();
      } else {
        this.collapseBottomPanel();
      }
      this.refreshBottomPanelToggleButton();
    }
    // Proceed with the main panel once all others are set up
    await this.bottomPanelState.pendingUpdate;
    if (mainPanel) {
      this.mainPanel.restoreLayout(mainPanel);
      this.registerWithFocusTracker(mainPanel.main);
    }
    if (activeWidgetId) {
      this.activateWidget(activeWidgetId);
    }
  }

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
  async activateWidget(id: string): Promise<Widget | undefined> {
    const stack = this.toTrackedStack(id);
    let current = stack.pop();
    if (current && !this.doActivateWidget(current.id)) {
      return undefined;
    }
    while (current && stack.length) {
      const child = stack.pop()!;
      if (ApplicationShell.TrackableWidgetProvider.is(current) && current.activateWidget) {
        current = current.activateWidget(child.id);
      } else {
        child.activate();
        current = child;
      }
    }
    if (!current) {
      return undefined;
    }
    await Promise.all([
      this.waitForActivation(current.id),
      waitForRevealed(current),
      this.pendingUpdates
    ]);
    return current;
  }

  async closeWidget(id: string, options?: ApplicationShell.CloseOptions): Promise<Widget | undefined> {
    // TODO handle save for composite widgets, i.e. the preference widget has 2 editors
    const stack = this.toTrackedStack(id);
    const current = stack.pop();
    if (!current) {
      return undefined;
    }
    let pendingClose;
    if (SaveableWidget.is(current)) {
      let shouldSave;
      if (options && 'save' in options) {
        shouldSave = () => options.save;
      }
      pendingClose = current.closeWithSaving({shouldSave});
    } else {
      current.close();
      pendingClose = waitForClosed(current);
    }
    await Promise.all([
      pendingClose,
      this.pendingUpdates
    ]);
    return stack[0] || current;
  }

  /**
   * Save all dirty widgets.
   */
  async saveAll(options?: SaveOptions): Promise<void> {
    await Promise.all(this.tracker.widgets.map(widget => {
      if (Saveable.isDirty(widget)) {
        Saveable.save(widget, options);
      }
    }));
  }

  getWidgetById(id: string): Widget | undefined {
    for (const widget of this.tracker.widgets) {
      if (widget.id === id) {
        return widget;
      }
    }
    return undefined;
  }

  canToggleMaximized(): boolean {
    const area = this.currentWidget && this.getAreaFor(this.currentWidget);
    return area === 'main' || area === 'bottom';
  }

  toggleMaximized(): void {
    const area = this.currentWidget && this.getAreaPanelFor(this.currentWidget);
    if (area instanceof TartDockPanel && (area === this.mainPanel || area === this.bottomPanel)) {
      area.toggleMaximized();
    }
  }

  waitForActivation(id: string): Promise<void> {
    if (this.activeWidget && this.activeWidget.id === id) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const toDispose = this.onDidChangeActiveWidget(() => {
        if (this.activeWidget && this.activeWidget.id === id) {
          toDispose.dispose();
          resolve();
        }
      });
    });
  }

  activateNextTab(): boolean {
    const current = this.currentTabBar;
    if (current) {
      const ci = current.currentIndex;
      if (ci !== -1) {
        if (ci < current.titles.length - 1) {
          current.currentIndex += 1;
          if (current.currentTitle) {
            this.activateWidget(current.currentTitle.owner.id);
          }
          return true;
        } else if (ci === current.titles.length - 1) {
          return this.activateNextTabBar(current);
        }
      }
    }
    return false;
  }

  activateNextTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): boolean {
    const nextBar = this.nextTabBar(current);
    if (nextBar) {
      nextBar.currentIndex = 0;
      if (nextBar.currentTitle) {
        this.activateWidget(nextBar.currentTitle.owner.id);
      }
      return true;
    }
    return false;
  }

  activatePreviousTab(): boolean {
    const current = this.currentTabBar;
    if (current) {
      const ci = current.currentIndex;
      if (ci !== -1) {
        if (ci > 0) {
          current.currentIndex -= 1;
          if (current.currentTitle) {
            this.activateWidget(current.currentTitle.owner.id);
          }
          return true;
        } else if (ci === 0) {
          return this.activatePreviousTabBar(current);
        }
      }
    }
    return false;
  }

  /**
   * Return the tab bar next to the given tab bar; return the given tab bar if there is no adjacent one.
   */
  nextTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): TabBar<Widget> | undefined {
    let bars = toArray(this.bottomPanel.tabBars());
    let len = bars.length;
    let ci = ArrayExt.firstIndexOf(bars, current);
    if (ci < 0) {
      bars = toArray(this.mainPanel.tabBars());
      len = bars.length;
      ci = ArrayExt.firstIndexOf(bars, current);
    }
    if (ci >= 0 && ci < len - 1) {
      return bars[ci + 1];
    } else if (ci >= 0 && ci === len - 1) {
      return bars[0];
    } else {
      return current;
    }
  }

  /*
* Activate the previous tab in the current tab bar.
*/
  activatePreviousTabInTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): boolean {
    const index = this.previousTabIndexInTabBar(current);
    if (!current || index === -1) {
      return false;
    }
    current.currentIndex = index;
    if (current.currentTitle) {
      this.activateWidget(current.currentTitle.owner.id);
    }
    return true;
  }

  previousTabIndexInTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): number {
    if (!current || current.titles.length <= 1) {
      return -1;
    }
    const index = current.currentIndex;
    if (index === -1) {
      return -1;
    }
    if (index > 0) {
      return index - 1;
    }
    return current.titles.length - 1;
  }

  activatePreviousTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): boolean {
    const prevBar = this.previousTabBar(current);
    if (!prevBar) {
      return false;
    }
    const len = prevBar.titles.length;
    prevBar.currentIndex = len - 1;
    if (prevBar.currentTitle) {
      this.activateWidget(prevBar.currentTitle.owner.id);
    }
    return true;
  }

  /**
   * Return the tab bar previous to the given tab bar; return the given tab bar if there is no adjacent one.
   */
  previousTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): TabBar<Widget> | undefined {
    const bars = toArray(this.mainPanel.tabBars());
    const len = bars.length;
    const ci = ArrayExt.firstIndexOf(bars, current);
    if (ci > 0) {
      return bars[ci - 1];
    } else if (ci === 0) {
      return bars[len - 1];
    } else {
      return current;
    }
  }

  /*
   * Activate the next tab in the current tab bar.
   */
  activateNextTabInTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): boolean {
    const index = this.nextTabIndexInTabBar(current);
    if (!current || index === -1) {
      return false;
    }
    current.currentIndex = index;
    if (current.currentTitle) {
      this.activateWidget(current.currentTitle.owner.id);
    }
    return true;
  }

  nextTabIndexInTabBar(current: TabBar<Widget> | undefined = this.currentTabBar): number {
    if (!current || current.titles.length <= 1) {
      return -1;
    }
    const index = current.currentIndex;
    if (index === -1) {
      return -1;
    }
    if (index < current.titles.length - 1) {
      return index + 1;
    }
    return 0;
  }

  /**
   * Check whether the named side panel area is expanded (returns `true`) or collapsed (returns `false`).
   */
  isExpanded(area: ApplicationShell.Area): boolean {
    switch (area) {
      case 'bottom':
        return this.bottomPanelState.expansion === SidePanel.ExpansionState.expanded;
      case 'left':
        return this.leftPanelHandler.state.expansion === SidePanel.ExpansionState.expanded;
      case 'right':
        return this.rightPanelHandler.state.expansion === SidePanel.ExpansionState.expanded;
      default:
        return true;
    }
  }

  /**
   * Close all tabs or a selection of tabs in a specific part of the application shell.
   *
   * @param tabBarOrArea
   *      Either the name of a shell area or a `TabBar` that is contained in such an area.
   * @param filter
   *      If undefined, all tabs are closed; otherwise only those tabs that match the filter are closed.
   */
  closeTabs(tabBarOrArea: TabBar<Widget> | ApplicationShell.Area,
            filter?: (title: Title<Widget>, index: number) => boolean): void {
    if (tabBarOrArea === 'main') {
      this.mainAreaTabBars.forEach(tb => this.closeTabs(tb, filter));
    } else if (tabBarOrArea === 'bottom') {
      this.bottomAreaTabBars.forEach(tb => this.closeTabs(tb, filter));
    } else if (typeof tabBarOrArea === 'string') {
      const tabBar = this.getTabBarFor(tabBarOrArea);
      if (tabBar) {
        this.closeTabs(tabBar, filter);
      }
    } else if (tabBarOrArea) {
      const titles = toArray(tabBarOrArea.titles);
      for (let i = 0; i < titles.length; i++) {
        if (filter === undefined || filter(titles[i], i)) {
          titles[i].owner.close();
        }
      }
    }
  }

  saveTabs(tabBarOrArea: TabBar<Widget> | ApplicationShell.Area,
           filter?: (title: Title<Widget>, index: number) => boolean): void {
    if (tabBarOrArea === 'main') {
      this.mainAreaTabBars.forEach(tb => this.saveTabs(tb, filter));
    } else if (tabBarOrArea === 'bottom') {
      this.bottomAreaTabBars.forEach(tb => this.saveTabs(tb, filter));
    } else if (typeof tabBarOrArea === 'string') {
      const tabBar = this.getTabBarFor(tabBarOrArea);
      if (tabBar) {
        this.saveTabs(tabBar, filter);
      }
    } else if (tabBarOrArea) {
      const titles = toArray(tabBarOrArea.titles);
      for (let i = 0; i < titles.length; i++) {
        if (filter === undefined || filter(titles[i], i)) {
          const widget = titles[i].owner;
          const saveable = Saveable.get(widget);
          saveable?.save();
        }
      }
    }
  }

  /**
   * Returns the last active widget in the given shell area.
   */
  getCurrentWidget(area: ApplicationShell.Area): Widget | undefined {
    let title: Title<Widget> | null | undefined;
    switch (area) {
      case 'main':
        title = this.mainPanel.currentTitle;
        break;
      case 'bottom':
        title = this.bottomPanel.currentTitle;
        break;
      case 'left':
        title = this.leftPanelHandler.tabBar.currentTitle;
        break;
      case 'right':
        title = this.rightPanelHandler.tabBar.currentTitle;
        break;
      default:
        throw new Error('Illegal argument: ' + area);
    }
    return title ? title.owner : undefined;
  }

  protected fireDidAddWidget(widget: Widget): void {
    this.onDidAddWidgetEmitter.fire(widget);
  }

  protected fireDidRemoveWidget(widget: Widget): void {
    this.onDidRemoveWidgetEmitter.fire(widget);
  }

  @postConstruct()
  protected init(): void {
    // this.initSidebarVisibleKeyContext();
    this.initFocusKeyContexts();
    this.setTopPanelVisibility('');
  }

  /**
   * Create the dock panel in the main shell area.
   */
  protected createMainPanel(): TartDockPanel {
    // const renderer = this.dockPanelRendererFactory();
    // renderer.tabBarClasses.push(MAIN_BOTTOM_AREA_CLASS);
    // renderer.tabBarClasses.push(MAIN_AREA_CLASS);
    const dockPanel = new TartDockPanel({
      mode: 'multiple-document',
      spacing: 0,
      tabsConstrained: true
    });
    dockPanel.id = MAIN_AREA_ID;
    return dockPanel;
  }

  /**
   * Create the dock panel in the bottom shell area.
   */
  protected createBottomPanel(): TartDockPanel {
    const dockPanel = new TartDockPanel({
      mode: 'multiple-document',
      spacing: 0,
    });
    dockPanel.id = BOTTOM_AREA_ID;
    dockPanel.widgetAdded.connect((sender, widget) => {
      this.refreshBottomPanelToggleButton();
    });
    dockPanel.widgetRemoved.connect((sender, widget) => {
      if (sender.isEmpty) {
        this.collapseBottomPanel();
      }
      this.refreshBottomPanelToggleButton();
    }, this);
    dockPanel.node.addEventListener('p-dragenter', event => {
      // Make sure that the main panel hides its overlay when the bottom panel is expanded
      this.mainPanel.overlay.hide(0);
    });
    dockPanel.hide();
    dockPanel.widgetAdded.connect((_, widget) => this.fireDidAddWidget(widget));
    dockPanel.widgetRemoved.connect((_, widget) => this.fireDidRemoveWidget(widget));
    return dockPanel;
  }

  /**
   * Create the top panel, which is used to hold the main menu.
   */
  protected createTopPanel(): Panel {
    const topPanel = new Panel();
    topPanel.id = 'tart-top-panel';
    topPanel.hide();
    return topPanel;
  }

  /**
   * Create a box layout to assemble the application shell layout.
   */
  protected createBoxLayout(widgets: Widget[], stretch?: number[], options?: BoxPanel.IOptions): BoxLayout {
    const boxLayout = new BoxLayout(options);
    for (let i = 0; i < widgets.length; i++) {
      if (stretch !== undefined && i < stretch.length) {
        BoxPanel.setStretch(widgets[i], stretch[i]);
      }
      boxLayout.addWidget(widgets[i]);
    }
    return boxLayout;
  }

  /**
   * Create a split layout to assemble the application shell layout.
   */
  protected createSplitLayout(widgets: Widget[], stretch?: number[], options?: Partial<SplitLayout.IOptions>): SplitLayout {
    let optParam: SplitLayout.IOptions = {renderer: SplitPanel.defaultRenderer,};
    if (options) {
      optParam = {...optParam, ...options};
    }
    const splitLayout = new SplitLayout(optParam);
    for (let i = 0; i < widgets.length; i++) {
      if (stretch !== undefined && i < stretch.length) {
        SplitPanel.setStretch(widgets[i], stretch[i]);
      }
      splitLayout.addWidget(widgets[i]);
    }
    return splitLayout;
  }

  /**
   * Track the given widget so it is considered in the `current` and `active` state of the shell.
   */
  protected track(widget: Widget): void {
    if (this.tracker.widgets.indexOf(widget) !== -1) {
      return;
    }
    this.tracker.add(widget);
    this.checkActivation(widget);
    Saveable.apply(widget);
    if (ApplicationShell.TrackableWidgetProvider.is(widget)) {
      for (const toTrack of widget.getTrackableWidgets()) {
        this.track(toTrack);
      }
      if (widget.onDidChangeTrackableWidgets) {
        widget.onDidChangeTrackableWidgets(widgets => widgets.forEach(w => this.track(w)));
      }
    }
  }

  protected initFocusKeyContexts(): void {
    const sideBarFocus = this.contextKeyService.createKey('sideBarFocus', false);
    const panelFocus = this.contextKeyService.createKey('panelFocus', false);
    const updateFocusContextKeys = () => {
      const area = this.activeWidget && this.getAreaFor(this.activeWidget);
      sideBarFocus.set(area === 'left');
      panelFocus.set(area === 'main');
    };
    updateFocusContextKeys();
    this.activeChanged.connect(updateFocusContextKeys);
  }

  protected toTrackedStack(id: string): Widget[] {
    const tracked = new Map<string, Widget>(this.tracker.widgets.map(w => [w.id, w] as [string, Widget]));
    let current = tracked.get(id);
    const stack: Widget[] = [];
    while (current) {
      if (tracked.has(current.id)) {
        stack.push(current);
      }
      current = current.parent || undefined;
    }
    return stack;
  }

  protected setTopPanelVisibility(preference: string): void {
    const hiddenPreferences = ['compact', 'hidden'];
    this.topPanel.setHidden(hiddenPreferences.includes(preference));
  }

  /**
   * Track all widgets that are referenced by the given layout data.
   */
  protected registerWithFocusTracker(data: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig | SidePanel.LayoutData | null): void {
    if (data) {
      if (data.type === 'tab-area') {
        for (const widget of data.widgets) {
          if (widget) {
            this.track(widget);
          }
        }
      } else if (data.type === 'split-area') {
        for (const child of data.children) {
          this.registerWithFocusTracker(child);
        }
      } else if (data.type === 'sidepanel' && data.items) {
        for (const item of data.items) {
          if (item.widget) {
            this.track(item.widget);
          }
        }
      }
    }
  }

  /**
   * Expand the bottom panel. See `expandPanel` regarding the exact behavior.
   */
  protected expandBottomPanel(): void {
    const bottomPanel = this.bottomPanel;
    if (bottomPanel.isHidden) {
      let relativeSizes: number[] | undefined;
      const parent = bottomPanel.parent;
      if (parent instanceof SplitPanel) {
        relativeSizes = parent.relativeSizes();
      }
      bottomPanel.show();
      if (relativeSizes && parent instanceof SplitPanel) {
        // Make sure that the expansion animation starts at the smallest possible size
        parent.setRelativeSizes(relativeSizes);
      }

      let size: number | undefined;
      if (bottomPanel.isEmpty) {
        bottomPanel.node.style.minHeight = '0';
        size = this.options.bottomPanel.emptySize;
      } else if (this.bottomPanelState.lastPanelSize) {
        size = this.bottomPanelState.lastPanelSize;
      } else {
        size = this.getDefaultBottomPanelSize();
      }
      if (size) {
        this.bottomPanelState.expansion = SidePanel.ExpansionState.expanding;
        this.setBottomPanelSize(size).then(() => {
          if (this.bottomPanelState.expansion === SidePanel.ExpansionState.expanding) {
            this.bottomPanelState.expansion = SidePanel.ExpansionState.expanded;
          }
        });
      } else {
        this.bottomPanelState.expansion = SidePanel.ExpansionState.expanded;
      }
    }
  }

  /**
   * Determine the default size to apply when the bottom panel is expanded for the first time.
   */
  protected getDefaultBottomPanelSize(): number | undefined {
    const parent = this.bottomPanel.parent;
    if (parent && parent.isVisible) {
      return parent.node.clientHeight * this.options.bottomPanel.initialSizeRatio;
    }
  }

  /**
   * Modify the height of the bottom panel. This implementation assumes that the container of the
   * bottom panel is a `SplitPanel`.
   */
  protected setBottomPanelSize(size: number): Promise<void> {
    const enableAnimation = this.applicationStateService.state === 'ready';
    const options: SplitPositionOptions = {
      side: 'bottom',
      duration: enableAnimation ? this.options.bottomPanel.expandDuration : 0,
      referenceWidget: this.bottomPanel
    };
    const promise = this.splitPositionHandler.setSidePanelSize(this.bottomPanel, size, options);
    const result = new Promise<void>(resolve => {
      // Resolve the resulting promise in any case, regardless of whether resizing was successful
      promise.then(() => resolve(), () => resolve());
    });
    this.bottomPanelState.pendingUpdate = this.bottomPanelState.pendingUpdate.then(() => result);
    return result;
  }

  /**
   * Reveal top-level area widget.
   */
  protected doRevealWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), w => w.id === id);
    if (!widget) {
      widget = find(this.bottomPanel.widgets(), w => w.id === id);
      if (widget) {
        this.expandBottomPanel();
      }
    }
    if (widget) {
      const tabBar = this.getTabBarFor(widget);
      if (tabBar) {
        tabBar.currentTitle = widget.title;
      }
      return widget;
    }
    widget = this.leftPanelHandler.expand(id);
    if (widget) {
      return widget;
    }
    return this.rightPanelHandler.expand(id);
  }

  /**
   * Collapse the bottom panel. All contained widgets are hidden, but not closed.
   * They can be restored by calling `expandBottomPanel`.
   */
  protected collapseBottomPanel(): Promise<void> {
    const bottomPanel = this.bottomPanel;
    if (bottomPanel.isHidden) {
      return Promise.resolve();
    }
    if (this.bottomPanelState.expansion === SidePanel.ExpansionState.expanded) {
      const size = this.getBottomPanelSize();
      if (size) {
        this.bottomPanelState.lastPanelSize = size;
      }
    }
    this.bottomPanelState.expansion = SidePanel.ExpansionState.collapsed;
    bottomPanel.hide();
    return animationFrame();
  }

  /**
   * Refresh the toggle button for the bottom panel. This implementation creates a status bar entry
   * and refers to the command `core.toggle.bottom.panel`.
   */
  protected refreshBottomPanelToggleButton(): void {
    if (this.bottomPanel.isEmpty) {
      this.statusBar.removeElement(BOTTOM_PANEL_TOGGLE_ID);
    } else {
      const element: StatusBarEntry = {
        text: '$(codicon-window)',
        alignment: StatusBarAlignment.RIGHT,
        tooltip: 'Toggle Bottom Panel',
        command: 'core.toggle.bottom.panel',
        priority: -1000
      };
      this.statusBar.setElement(BOTTOM_PANEL_TOGGLE_ID, element);
    }
  }

  /**
   * Activate top-level area widget.
   */
  protected doActivateWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), w => w.id === id);
    if (widget) {
      this.mainPanel.activateWidget(widget);
      return widget;
    }
    widget = find(this.bottomPanel.widgets(), w => w.id === id);
    if (widget) {
      this.expandBottomPanel();
      this.bottomPanel.activateWidget(widget);
      return widget;
    }
    widget = this.leftPanelHandler.activate(id);
    if (widget) {
      return widget;
    }
    widget = this.rightPanelHandler.activate(id);
    if (widget) {
      return widget;
    }
  }

  protected getAreaPanelFor(input: Widget): DockPanel | undefined {
    const widget = this.toTrackedStack(input.id).pop();
    if (!widget) {
      return undefined;
    }
    const title = widget.title;
    const mainPanelTabBar = this.mainPanel.findTabBar(title);
    if (mainPanelTabBar) {
      return this.mainPanel;
    }
    const bottomPanelTabBar = this.bottomPanel.findTabBar(title);
    if (bottomPanelTabBar) {
      return this.bottomPanel;
    }
    if (ArrayExt.firstIndexOf(this.leftPanelHandler.tabBar.titles, title) > -1) {
      return this.leftPanelHandler.dockPanel;
    }
    if (ArrayExt.firstIndexOf(this.rightPanelHandler.tabBar.titles, title) > -1) {
      return this.rightPanelHandler.dockPanel;
    }
    return undefined;
  }

  /**
   * Compute the current height of the bottom panel. This implementation assumes that the container
   * of the bottom panel is a `SplitPanel`.
   */
  protected getBottomPanelSize(): number | undefined {
    const parent = this.bottomPanel.parent;
    if (parent instanceof SplitPanel && parent.isVisible) {
      const index = parent.widgets.indexOf(this.bottomPanel) - 1;
      if (index >= 0) {
        const handle = parent.handles[index];
        if (!handle.classList.contains('p-mod-hidden')) {
          const parentHeight = parent.node.clientHeight;
          return parentHeight - handle.offsetTop;
        }
      }
    }
  }

  /**
   * Assemble the application shell layout. Override this method in order to change the arrangement
   * of the main area and the side panels.
   */
  protected createLayout(): Layout {
    const bottomSplitLayout = this.createSplitLayout(
        [this.mainPanel, this.bottomPanel],
        [1, 0],
        {orientation: 'vertical', spacing: 0}
    );
    const panelForBottomArea = new SplitPanel({layout: bottomSplitLayout});
    panelForBottomArea.id = 'tart-bottom-split-panel';

    const leftRightSplitLayout = this.createSplitLayout(
        [this.leftPanelHandler.container, panelForBottomArea, this.rightPanelHandler.container],
        [0, 1, 0],
        {orientation: 'horizontal', spacing: 0}
    );
    const panelForSideAreas = new SplitPanel({layout: leftRightSplitLayout});
    panelForSideAreas.id = 'tart-left-right-split-panel';

    return this.createBoxLayout(
        [this.topPanel, panelForSideAreas, this.statusBar],
        [0, 1, 0],
        {direction: 'top-to-bottom', spacing: 0}
    );
  }

  private findWidgetForNode(widgetNode: HTMLElement, widget: Widget): Widget | undefined {
    if (widget.node === widgetNode) {
      return widget;
    }
    let result: Widget | undefined;
    each(widget.children(), child => {
      result = this.findWidgetForNode(widgetNode, child);
      return !result;
    });
    return result;
  }

  /**
   * Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * of Widget does not take any focus. This method can help finding such problems by logging
   * a warning in case a widget was explicitly activated, but did not trigger a change of the
   * `activeWidget` property.
   */
  private checkActivation(widget: Widget): Widget {
    const onActivateRequest = widget['onActivateRequest'].bind(widget);
    widget['onActivateRequest'] = (msg: Message) => {
      onActivateRequest(msg);
      this.assertActivated(widget);
    };
    return widget;
  }

  private assertActivated(widget: Widget): void {
    this.toDisposeOnActivationCheck.dispose();

    const onDispose = () => this.toDisposeOnActivationCheck.dispose();
    widget.disposed.connect(onDispose);
    this.toDisposeOnActivationCheck.push(Disposable.create(() => widget.disposed.disconnect(onDispose)));

    let start = 0;
    const step: FrameRequestCallback = timestamp => {
      if (document.activeElement && widget.node.contains(document.activeElement)) {
        return;
      }
      if (!start) {
        start = timestamp;
      }
      const delta = timestamp - start;
      if (delta < this.activationTimeout) {
        request = window.requestAnimationFrame(step);
      } else {
        console.warn(`Widget was activated, but did not accept focus after ${this.activationTimeout}ms: ${widget.id}`);
      }
    };
    let request = window.requestAnimationFrame(step);
    this.toDisposeOnActivationCheck.push(Disposable.create(() => window.cancelAnimationFrame(request)));
  }

  /**
   * Handle a change to the current widget.
   */
  private onCurrentChanged(sender: FocusTracker<Widget>, args: FocusTracker.IChangedArgs<Widget>): void {
    this.currentChanged.emit(args);
    this.onDidChangeCurrentWidgetEmitter.fire(args);
  }

  /**
   * Set the z-index of the given element and its ancestors to the value `z`.
   */
  private setZIndex(element: HTMLElement, z: string | null): void {
    element.style.zIndex = z || '';
    const parent = element.parentElement;
    if (parent && parent !== this.node) {
      this.setZIndex(parent, z);
    }
  }

  /**
   * Handle a change to the active widget.
   */
  private onActiveChanged(sender: FocusTracker<Widget>, args: FocusTracker.IChangedArgs<Widget>): void {
    this.toDisposeOnActiveChanged.dispose();
    const {newValue, oldValue} = args;
    if (oldValue) {
      let w: Widget | null = oldValue;
      while (w) {
        // Remove the mark of the previously active widget
        w.title.className = w.title.className.replace(' tart-mod-active', '');
        w = w.parent;
      }
      // Reset the z-index to the default
      // eslint-disable-next-line no-null/no-null
      this.setZIndex(oldValue.node, null);
    }
    if (newValue) {
      let w: Widget | null = newValue;
      while (w) {
        // Mark the tab of the active widget
        w.title.className += ' tart-mod-active';
        w = w.parent;
      }
      // Reveal the title of the active widget in its tab bar
      const tabBar = this.getTabBarFor(newValue);
      if (tabBar instanceof ScrollableTabBar) {
        const index = tabBar.titles.indexOf(newValue.title);
        if (index >= 0) {
          tabBar.revealTab(index);
        }
      }
      const panel = this.getAreaPanelFor(newValue);
      if (panel instanceof TartDockPanel) {
        panel.markAsCurrent(newValue.title);
      }
      // Set the z-index so elements with `position: fixed` contained in the active widget are displayed correctly
      this.setZIndex(newValue.node, '1');

      // activate another widget if an active widget will be closed
      const onCloseRequest = newValue['onCloseRequest'];
      newValue['onCloseRequest'] = msg => {
        const currentTabBar = this.currentTabBar;
        if (currentTabBar) {
          const recentlyUsedInTabBar = currentTabBar['_previousTitle'] as TabBar<Widget>['currentTitle'];
          if (recentlyUsedInTabBar && recentlyUsedInTabBar.owner !== newValue) {
            currentTabBar.currentIndex = ArrayExt.firstIndexOf(currentTabBar.titles, recentlyUsedInTabBar);
            if (currentTabBar.currentTitle) {
              this.activateWidget(currentTabBar.currentTitle.owner.id);
            }
          } else if (!this.activateNextTabInTabBar(currentTabBar)) {
            if (!this.activatePreviousTabBar(currentTabBar)) {
              this.activateNextTabBar(currentTabBar);
            }
          }
        }
        newValue['onCloseRequest'] = onCloseRequest;
        newValue['onCloseRequest'](msg);
      };
      this.toDisposeOnActiveChanged.push(Disposable.create(() => newValue['onCloseRequest'] = onCloseRequest));
    }
    this.activeChanged.emit(args);
    this.onDidChangeActiveWidgetEmitter.fire(args);
  }

}

/**
 * The namespace for `ApplicationShell` class statics.
 */
export namespace ApplicationShell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'left' | 'right' | 'bottom';

  /**
   * The _side areas_ are those shell areas that can be collapsed and expanded,
   * i.e. `left`, `right`, and `bottom`.
   */
  export function isSideArea(area?: string): area is 'left' | 'right' | 'bottom' {
    return area === 'left' || area === 'right' || area === 'bottom';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function isValidArea(area?: any): area is ApplicationShell.Area {
    const areas = ['main', 'top', 'left', 'right', 'bottom'];
    return (area !== undefined && typeof area === 'string' && areas.includes(area));
  }

  export interface Options extends Widget.IOptions {
    bottomPanel: BottomPanelOptions;
    leftPanel: SidePanel.Options;
    rightPanel: SidePanel.Options;
  }

  export interface BottomPanelOptions extends SidePanel.Options {
  }

  /**
   * The default values for application shell options.
   */
  export const DEFAULT_OPTIONS = Object.freeze(<Options>{
    bottomPanel: Object.freeze(<BottomPanelOptions>{
      emptySize: 140,
      expandThreshold: 160,
      expandDuration: 0,
      initialSizeRatio: 0.382
    }),
    leftPanel: Object.freeze(<SidePanel.Options>{
      emptySize: 140,
      expandThreshold: 140,
      expandDuration: 0,
      initialSizeRatio: 0.191
    }),
    rightPanel: Object.freeze(<SidePanel.Options>{
      emptySize: 140,
      expandThreshold: 140,
      expandDuration: 0,
      initialSizeRatio: 0.191
    })
  });

  /**
   * Whether a widget should be opened to the side tab bar relatively to the reference widget.
   */
  export type OpenToSideMode = 'open-to-left' | 'open-to-right';


  export function isOpenToSideMode(mode: OpenToSideMode | any): mode is OpenToSideMode {
    return mode === 'open-to-left' || mode === 'open-to-right';
  }

  /**
   * Data to save and load the application shell layout.
   */
  export interface LayoutData {
    version?: string | ApplicationShellLayoutVersion,
    mainPanel?: DockPanel.ILayoutConfig;
    bottomPanel?: BottomPanelLayoutData;
    leftPanel?: SidePanel.LayoutData;
    rightPanel?: SidePanel.LayoutData;
    activeWidgetId?: string;
  }


  export interface CloseOptions {
    /**
     * if optional then a user will be prompted
     * if undefined then close will be canceled
     * if true then will be saved on close
     * if false then won't be saved on close
     */
    save?: boolean | undefined
  }

  /**
   * Data to save and load the bottom panel layout.
   */
  export interface BottomPanelLayoutData {
    config?: DockPanel.ILayoutConfig;
    size?: number;
    expanded?: boolean;
  }


  /**
   * Options for adding a widget to the application shell.
   */
  export interface WidgetOptions extends SidePanel.WidgetOptions {
    /**
     * The area of the application shell where the widget will reside.
     */
    area?: Area;
    /**
     * The insertion mode for adding the widget.
     *
     * The default is `'tab-after'`.
     */
    mode?: DockLayout.InsertMode | OpenToSideMode
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
  export interface TrackableWidgetProvider {
    readonly onDidChangeTrackableWidgets?: CommonEvent<Widget[]>

    getTrackableWidgets(): Widget[]

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

  export namespace TrackableWidgetProvider {
    export function is(widget: object | undefined): widget is TrackableWidgetProvider {
      return !!widget && 'getTrackableWidgets' in widget;
    }
  }

}
