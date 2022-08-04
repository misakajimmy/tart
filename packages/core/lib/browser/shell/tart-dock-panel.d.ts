/**
 * This specialization of DockPanel adds various events that are used for implementing the
 * side panels of the application shell.
 */
import { DockPanel, TabBar, Title, Widget } from '@lumino/widgets';
import { DisposableCollection, Emitter } from '../../common';
import { Signal } from '@lumino/signaling';
export declare const MAXIMIZED_CLASS = "tart-maximized";
export declare const MAIN_AREA_ID = "tart-main-content-panel";
export declare const BOTTOM_AREA_ID = "tart-bottom-content-panel";
export declare class TartDockPanel extends DockPanel {
    /**
     * Emitted when a widget is added to the panel.
     */
    readonly widgetAdded: Signal<this, Widget>;
    /**
     * Emitted when a widget is activated by calling `activateWidget`.
     */
    readonly widgetActivated: Signal<this, Widget>;
    /**
     * Emitted when a widget is removed from the panel.
     */
    readonly widgetRemoved: Signal<this, Widget>;
    protected readonly onDidToggleMaximizedEmitter: Emitter<Widget>;
    readonly onDidToggleMaximized: import("../../common").Event<Widget>;
    protected readonly toDisposeOnMarkAsCurrent: DisposableCollection;
    protected readonly toDisposeOnToggleMaximized: DisposableCollection;
    protected maximizedElement: HTMLElement | undefined;
    constructor(options?: DockPanel.IOptions);
    get currentTabBar(): TabBar<Widget> | undefined;
    protected _currentTitle: Title<Widget> | undefined;
    get currentTitle(): Title<Widget> | undefined;
    findTabBar(title: Title<Widget>): TabBar<Widget> | undefined;
    previousTabBarWidget(widget: Widget): Widget | undefined;
    previousTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined;
    nextTabBarWidget(widget: Widget): Widget | undefined;
    nextTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined;
    addWidget(widget: Widget, options?: DockPanel.IAddOptions): void;
    markAsCurrent(title: Title<Widget> | undefined): void;
    toggleMaximized(): void;
    protected onChildRemoved(msg: Widget.ChildMessage): void;
    protected getMaximizedElement(): HTMLElement;
}
