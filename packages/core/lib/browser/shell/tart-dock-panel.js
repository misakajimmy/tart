/**
 * This specialization of DockPanel adds various events that are used for implementing the
 * side panels of the application shell.
 */
import { DockLayout, DockPanel, Widget } from '@lumino/widgets';
import { Disposable, DisposableCollection, Emitter } from '../../common';
import { UnsafeWidgetUtilities } from '../widgets';
import { Signal } from '@lumino/signaling';
import { ArrayExt, find, toArray } from '@lumino/algorithm';
export const MAXIMIZED_CLASS = 'tart-maximized';
export const MAIN_AREA_ID = 'tart-main-content-panel';
export const BOTTOM_AREA_ID = 'tart-bottom-content-panel';
export class TartDockPanel extends DockPanel {
    /**
     * Emitted when a widget is added to the panel.
     */
    widgetAdded = new Signal(this);
    /**
     * Emitted when a widget is activated by calling `activateWidget`.
     */
    widgetActivated = new Signal(this);
    /**
     * Emitted when a widget is removed from the panel.
     */
    widgetRemoved = new Signal(this);
    onDidToggleMaximizedEmitter = new Emitter();
    onDidToggleMaximized = this.onDidToggleMaximizedEmitter.event;
    toDisposeOnMarkAsCurrent = new DisposableCollection();
    toDisposeOnToggleMaximized = new DisposableCollection();
    maximizedElement;
    constructor(options) {
        super(options);
        this['_onCurrentChanged'] = (sender, args) => {
            this.markAsCurrent(args.currentTitle || undefined);
            super['_onCurrentChanged'](sender, args);
        };
        this['_onTabActivateRequested'] = (sender, args) => {
            this.markAsCurrent(args.title);
            super['_onTabActivateRequested'](sender, args);
        };
    }
    get currentTabBar() {
        return this._currentTitle && this.findTabBar(this._currentTitle);
    }
    _currentTitle;
    get currentTitle() {
        return this._currentTitle;
    }
    findTabBar(title) {
        return find(this.tabBars(), bar => ArrayExt.firstIndexOf(bar.titles, title) > -1);
    }
    previousTabBarWidget(widget) {
        const current = this.findTabBar(widget.title);
        const previous = current && this.previousTabBarInPanel(current);
        return previous && previous.currentTitle && previous.currentTitle.owner || undefined;
    }
    previousTabBarInPanel(tabBar) {
        const tabBars = toArray(this.tabBars());
        const index = tabBars.indexOf(tabBar);
        if (index !== -1) {
            return tabBars[index - 1];
        }
        return undefined;
    }
    nextTabBarWidget(widget) {
        const current = this.findTabBar(widget.title);
        const next = current && this.nextTabBarInPanel(current);
        return next && next.currentTitle && next.currentTitle.owner || undefined;
    }
    nextTabBarInPanel(tabBar) {
        const tabBars = toArray(this.tabBars());
        const index = tabBars.indexOf(tabBar);
        if (index !== -1) {
            return tabBars[index + 1];
        }
        return undefined;
    }
    addWidget(widget, options) {
        if (this.mode === 'single-document' && widget.parent === this) {
            return;
        }
        super.addWidget(widget, options);
        this.widgetAdded.emit(widget);
    }
    markAsCurrent(title) {
        this.toDisposeOnMarkAsCurrent.dispose();
        this._currentTitle = title;
        if (title) {
            const resetCurrent = () => this.markAsCurrent(undefined);
            title.owner.disposed.connect(resetCurrent);
            this.toDisposeOnMarkAsCurrent.push(Disposable.create(() => title.owner.disposed.disconnect(resetCurrent)));
        }
    }
    toggleMaximized() {
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
    onChildRemoved(msg) {
        super.onChildRemoved(msg);
        this.widgetRemoved.emit(msg.child);
    }
    getMaximizedElement() {
        if (!this.maximizedElement) {
            this.maximizedElement = document.createElement('div');
            this.maximizedElement.style.display = 'none';
            document.body.appendChild(this.maximizedElement);
        }
        return this.maximizedElement;
    }
}

//# sourceMappingURL=../../../lib/browser/shell/tart-dock-panel.js.map
