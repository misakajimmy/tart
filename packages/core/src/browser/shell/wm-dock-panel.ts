/**
 * This specialization of DockPanel adds various events that are used for implementing the
 * side panels of the application shell.
 */
import {DockLayout, DockPanel, TabBar, Title, Widget} from '@lumino/widgets';
import {Disposable, DisposableCollection, Emitter} from '../../common';
import {UnsafeWidgetUtilities} from '../widgets';
import {Signal} from '@lumino/signaling';
import {ArrayExt, find, toArray} from '@lumino/algorithm';

export const MAXIMIZED_CLASS = 'wm-maximized';

export const MAIN_AREA_ID = 'wm-main-content-panel';
export const BOTTOM_AREA_ID = 'wm-bottom-content-panel';

export class WmDockPanel extends DockPanel {
  /**
   * Emitted when a widget is added to the panel.
   */
  readonly widgetAdded = new Signal<this, Widget>(this);
  /**
   * Emitted when a widget is activated by calling `activateWidget`.
   */
  readonly widgetActivated = new Signal<this, Widget>(this);
  /**
   * Emitted when a widget is removed from the panel.
   */
  readonly widgetRemoved = new Signal<this, Widget>(this);

  protected readonly onDidToggleMaximizedEmitter = new Emitter<Widget>();
  readonly onDidToggleMaximized = this.onDidToggleMaximizedEmitter.event;
  protected readonly toDisposeOnMarkAsCurrent = new DisposableCollection();
  protected readonly toDisposeOnToggleMaximized = new DisposableCollection();
  protected maximizedElement: HTMLElement | undefined;

  constructor(
      options?: DockPanel.IOptions,
  ) {
    super(options);
    this['_onCurrentChanged'] = (sender: TabBar<Widget>, args: TabBar.ICurrentChangedArgs<Widget>) => {
      this.markAsCurrent(args.currentTitle || undefined);
      super['_onCurrentChanged'](sender, args);
    };
    this['_onTabActivateRequested'] = (sender: TabBar<Widget>, args: TabBar.ITabActivateRequestedArgs<Widget>) => {
      this.markAsCurrent(args.title);
      super['_onTabActivateRequested'](sender, args);
    };
  }

  get currentTabBar(): TabBar<Widget> | undefined {
    return this._currentTitle && this.findTabBar(this._currentTitle);
  }

  protected _currentTitle: Title<Widget> | undefined;

  get currentTitle(): Title<Widget> | undefined {
    return this._currentTitle;
  }

  findTabBar(title: Title<Widget>): TabBar<Widget> | undefined {
    return find(this.tabBars(), bar => ArrayExt.firstIndexOf(bar.titles, title) > -1);
  }

  previousTabBarWidget(widget: Widget): Widget | undefined {
    const current = this.findTabBar(widget.title);
    const previous = current && this.previousTabBarInPanel(current);
    return previous && previous.currentTitle && previous.currentTitle.owner || undefined;
  }

  previousTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined {
    const tabBars = toArray(this.tabBars());
    const index = tabBars.indexOf(tabBar);
    if (index !== -1) {
      return tabBars[index - 1];
    }
    return undefined;
  }

  nextTabBarWidget(widget: Widget): Widget | undefined {
    const current = this.findTabBar(widget.title);
    const next = current && this.nextTabBarInPanel(current);
    return next && next.currentTitle && next.currentTitle.owner || undefined;
  }

  nextTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined {
    const tabBars = toArray(this.tabBars());
    const index = tabBars.indexOf(tabBar);
    if (index !== -1) {
      return tabBars[index + 1];
    }
    return undefined;
  }

  addWidget(widget: Widget, options?: DockPanel.IAddOptions): void {
    if (this.mode === 'single-document' && widget.parent === this) {
      return;
    }
    super.addWidget(widget, options);
    this.widgetAdded.emit(widget);
  }

  markAsCurrent(title: Title<Widget> | undefined): void {
    this.toDisposeOnMarkAsCurrent.dispose();
    this._currentTitle = title;
    if (title) {
      const resetCurrent = () => this.markAsCurrent(undefined);
      title.owner.disposed.connect(resetCurrent);
      this.toDisposeOnMarkAsCurrent.push(Disposable.create(() =>
          title.owner.disposed.disconnect(resetCurrent)
      ));
    }
  }

  toggleMaximized(): void {
    const areaContainer = this.node.parentElement;
    if (!areaContainer) {
      return;
    }
    const maximizedElement = this.getMaximizedElement();
    if (areaContainer === maximizedElement) {
      this.toDisposeOnToggleMaximized.dispose();
      return;
    }
    if (this.isAttached) {
      UnsafeWidgetUtilities.detach(this);
    }
    maximizedElement.style.display = 'block';
    this.addClass(MAXIMIZED_CLASS);
    UnsafeWidgetUtilities.attach(this, maximizedElement);
    this.fit();
    this.onDidToggleMaximizedEmitter.fire(this);
    this.toDisposeOnToggleMaximized.push(Disposable.create(() => {
      maximizedElement.style.display = 'none';
      this.removeClass(MAXIMIZED_CLASS);
      this.onDidToggleMaximizedEmitter.fire(this);
      if (this.isAttached) {
        UnsafeWidgetUtilities.detach(this);
      }
      UnsafeWidgetUtilities.attach(this, areaContainer);
      this.fit();
    }));

    const layout = this.layout;
    if (layout instanceof DockLayout) {
      const onResize = layout['onResize'];
      layout['onResize'] = () => onResize.bind(layout)(Widget.ResizeMessage.UnknownSize);
      this.toDisposeOnToggleMaximized.push(Disposable.create(() => layout['onResize'] = onResize));
    }

    const removedListener = () => {
      if (!this.widgets().next()) {
        this.toDisposeOnToggleMaximized.dispose();
      }
    };
    this.widgetRemoved.connect(removedListener);
    this.toDisposeOnToggleMaximized.push(Disposable.create(() => this.widgetRemoved.disconnect(removedListener)));
  }

  protected onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.widgetRemoved.emit(msg.child);
  }

  protected getMaximizedElement(): HTMLElement {
    if (!this.maximizedElement) {
      this.maximizedElement = document.createElement('div');
      this.maximizedElement.style.display = 'none';
      document.body.appendChild(this.maximizedElement);
    }
    return this.maximizedElement;
  }
}
