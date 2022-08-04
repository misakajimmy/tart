/**
 * A specialized tab bar for the main and bottom areas.
 */
import { TabBar } from '@lumino/widgets';
import PerfectScrollbar from 'perfect-scrollbar';
import { Disposable, DisposableCollection } from '../../common';
import { Signal } from '@lumino/signaling';
import { h, VirtualDOM } from '@lumino/virtualdom';
import { WidgetDecoration } from '../widget-decoration';
import { notEmpty } from '../../common/objects';
import { BOTTOM_AREA_ID, MAIN_AREA_ID, TartDockPanel } from './tart-dock-panel';
import { ArrayExt } from '@lumino/algorithm';
import { ElementExt } from '@lumino/domutils';
/** The class name added to hidden content nodes, which are required to render vertical side bars. */
const HIDDEN_CONTENT_CLASS = 'tart-TabBar-hidden-content';
export const TabBarRendererFactory = Symbol('TabBarRendererFactory');
/**
 * A tab bar renderer that offers a context menu. In addition, this renderer is able to
 * set an explicit position and size on the icon and label of each tab in a side bar.
 * This is necessary because the elements of side bar tabs are rotated using the CSS
 * `transform` property, disrupting the browser's ability to arrange those elements
 * automatically.
 */
export class TabBarRenderer extends TabBar.Renderer {
    contextMenuRenderer;
    decoratorService;
    iconThemeService;
    /**
     * The menu path used to render the context menu.
     */
    contextMenuPath;
    toDispose = new DisposableCollection();
    // TODO refactor shell, rendered should only receive props with event handlers
    // events should be handled by clients, like ApplicationShell
    toDisposeOnTabBar = new DisposableCollection();
    decorations = new Map();
    // right now it is mess: (1) client logic belong to renderer, (2) cyclic dependencies between renderers and clients
    constructor(contextMenuRenderer, decoratorService, iconThemeService) {
        super();
        this.contextMenuRenderer = contextMenuRenderer;
        this.decoratorService = decoratorService;
        this.iconThemeService = iconThemeService;
        if (this.decoratorService) {
            this.toDispose.push(Disposable.create(() => this.resetDecorations()));
            this.toDispose.push(this.decoratorService.onDidChangeDecorations(() => this.resetDecorations()));
        }
        if (this.iconThemeService) {
            this.toDispose.push(this.iconThemeService.onDidChangeCurrent(() => {
                if (this._tabBar) {
                    this._tabBar.update();
                }
            }));
        }
    }
    _tabBar;
    get tabBar() {
        return this._tabBar;
    }
    /**
     * A reference to the tab bar is required in order to activate it when a context menu
     * is requested.
     */
    set tabBar(tabBar) {
        if (this.toDispose.disposed) {
            throw new Error('disposed');
        }
        if (this._tabBar === tabBar) {
            return;
        }
        this.toDisposeOnTabBar.dispose();
        this.toDispose.push(this.toDisposeOnTabBar);
        this._tabBar = tabBar;
        if (tabBar) {
            const listener = (_, { title }) => this.resetDecorations(title);
            tabBar.tabCloseRequested.connect(listener);
            this.toDisposeOnTabBar.push(Disposable.create(() => tabBar.tabCloseRequested.disconnect(listener)));
        }
        this.resetDecorations();
    }
    dispose() {
        this.toDispose.dispose();
    }
    /**
     * Render tabs with the default DOM structure, but additionally register a context menu listener.
     * @param {SideBarRenderData} data Data used to render the tab.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     * @returns {VirtualElement} The virtual element of the rendered tab.
     */
    renderTab(data, isInSidePanel) {
        const title = data.title;
        const id = this.createTabId(data.title);
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        const className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);
        return h.li({
            key, className, id, title: title.caption, style, dataset,
            oncontextmenu: this.handleContextMenuEvent,
            ondblclick: this.handleDblClickEvent,
            onauxclick: (e) => {
                // If user closes the tab using mouse wheel, nothing should be pasted to an active editor
                e.preventDefault();
            }
        }, h.div({ className: 'tart-tab-icon-label' }, this.renderIcon(data, isInSidePanel), this.renderLabel(data, isInSidePanel), this.renderBadge(data, isInSidePanel)), this.renderCloseIcon(data));
    }
    createTabId(title) {
        return 'shell-tab-' + title.owner.id;
    }
    /**
     * If size information is available for the label and icon, set an explicit height on the tab.
     * The height value also considers padding, which should be derived from CSS settings.
     */
    createTabStyle(data) {
        const zIndex = `${data.zIndex}`;
        const labelSize = data.labelSize;
        const iconSize = data.iconSize;
        let height;
        if (labelSize || iconSize) {
            const labelHeight = labelSize ? (this.tabBar && this.tabBar.orientation === 'horizontal' ? labelSize.height : labelSize.width) : 0;
            const iconHeight = iconSize ? iconSize.height : 0;
            let paddingTop = data.paddingTop || 0;
            if (labelHeight > 0 && iconHeight > 0) {
                // Leave some extra space between icon and label
                paddingTop = paddingTop * 1.5;
            }
            const paddingBottom = data.paddingBottom || 0;
            height = `${labelHeight + iconHeight + paddingTop + paddingBottom}px`;
        }
        return { zIndex, height };
    }
    /**
     * If size information is available for the label, set it as inline style.
     * Tab padding and icon size are also considered in the `top` position.
     * @param {SideBarRenderData} data Data used to render the tab.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     * @returns {VirtualElement} The virtual element of the rendered label.
     */
    renderLabel(data, isInSidePanel) {
        const labelSize = data.labelSize;
        const iconSize = data.iconSize;
        let width;
        let height;
        let top;
        if (labelSize) {
            width = `${labelSize.width}px`;
            height = `${labelSize.height}px`;
        }
        if (data.paddingTop || iconSize) {
            const iconHeight = iconSize ? iconSize.height : 0;
            let paddingTop = data.paddingTop || 0;
            if (iconHeight > 0) {
                // Leave some extra space between icon and label
                paddingTop = paddingTop * 1.5;
            }
            top = `${paddingTop + iconHeight}px`;
        }
        const style = { width, height, top };
        // No need to check for duplicate labels if the tab is rendered in the side panel (title is not displayed),
        // or if there are less than two files in the tab bar.
        if (isInSidePanel || (this.tabBar && this.tabBar.titles.length < 2)) {
            return h.div({ className: 'p-TabBar-tabLabel', style }, data.title.label);
        }
        const originalToDisplayedMap = this.findDuplicateLabels([...this.tabBar.titles]);
        const labelDetails = originalToDisplayedMap.get(data.title.caption);
        if (labelDetails) {
            return h.div({ className: 'p-TabBar-tabLabelWrapper' }, h.div({ className: 'p-TabBar-tabLabel', style }, data.title.label), h.div({ className: 'p-TabBar-tabLabelDetails', style }, labelDetails));
        }
        return h.div({ className: 'p-TabBar-tabLabel', style }, data.title.label);
    }
    renderBadge(data, isInSidePanel) {
        const totalBadge = this.getDecorationData(data.title, 'badge').reduce((sum, badge) => sum + badge, 0);
        if (!totalBadge) {
            return h.div({});
        }
        const limitedBadge = totalBadge >= 100 ? '99+' : totalBadge;
        return isInSidePanel
            ? h.div({ className: 'tart-badge-decorator-sidebar' }, `${limitedBadge}`)
            : h.div({ className: 'tart-badge-decorator-horizontal' }, `${limitedBadge}`);
    }
    /**
     * Find duplicate labels from the currently opened tabs in the tab bar.
     * Return the appropriate partial paths that can distinguish the identical labels.
     *
     * E.g., a/p/index.ts => a/..., b/p/index.ts => b/...
     *
     * To prevent excessively long path displayed, show at maximum three levels from the end by default.
     * @param {Title<Widget>[]} titles Array of titles in the current tab bar.
     * @returns {Map<string, string>} A map from each tab's original path to its displayed partial path.
     */
    findDuplicateLabels(titles) {
        // Filter from all tabs to group them by the distinct label (file name).
        // E.g., 'foo.js' => {0 (index) => 'a/b/foo.js', '2 => a/c/foo.js' },
        //       'bar.js' => {1 => 'a/d/bar.js', ...}
        const labelGroups = new Map();
        titles.forEach((title, index) => {
            if (!labelGroups.has(title.label)) {
                labelGroups.set(title.label, new Map());
            }
            labelGroups.get(title.label).set(index, title.caption);
        });
        const originalToDisplayedMap = new Map();
        // Parse each group of editors with the same label.
        labelGroups.forEach(labelGroup => {
            // Filter to get groups that have duplicates.
            if (labelGroup.size > 1) {
                const paths = [];
                let maxPathLength = 0;
                labelGroup.forEach((pathStr, index) => {
                    const steps = pathStr.split('/');
                    maxPathLength = Math.max(maxPathLength, steps.length);
                    paths[index] = (steps.slice(0, steps.length - 1));
                    // By default, show at maximum three levels from the end.
                    let defaultDisplayedPath = steps.slice(-4, -1).join('/');
                    if (steps.length > 4) {
                        defaultDisplayedPath = '.../' + defaultDisplayedPath;
                    }
                    originalToDisplayedMap.set(pathStr, defaultDisplayedPath);
                });
                // Iterate through the steps of the path from the left to find the step that can distinguish it.
                // E.g., ['root', 'foo', 'c'], ['root', 'bar', 'd'] => 'foo', 'bar'
                let i = 0;
                while (i < maxPathLength - 1) {
                    // Store indexes of all paths that have the identical element in each step.
                    const stepOccurrences = new Map();
                    // Compare the current step of all paths
                    paths.forEach((path, index) => {
                        const step = path[i];
                        if (path.length > 0) {
                            if (i > path.length - 1) {
                                paths[index] = [];
                            }
                            else if (!stepOccurrences.has(step)) {
                                stepOccurrences.set(step, [index]);
                            }
                            else {
                                stepOccurrences.get(step).push(index);
                            }
                        }
                    });
                    // Set the displayed path for each tab.
                    stepOccurrences.forEach((indexArr, displayedPath) => {
                        if (indexArr.length === 1) {
                            const originalPath = labelGroup.get(indexArr[0]);
                            if (originalPath) {
                                const originalElements = originalPath.split('/');
                                const displayedElements = displayedPath.split('/');
                                if (originalElements.slice(-2)[0] !== displayedElements.slice(-1)[0]) {
                                    displayedPath += '/...';
                                }
                                if (originalElements[0] !== displayedElements[0]) {
                                    displayedPath = '.../' + displayedPath;
                                }
                                originalToDisplayedMap.set(originalPath, displayedPath);
                                paths[indexArr[0]] = [];
                            }
                        }
                    });
                    i++;
                }
            }
        });
        return originalToDisplayedMap;
    }
    /**
     * If size information is available for the icon, set it as inline style. Tab padding
     * is also considered in the `top` position.
     * @param {SideBarRenderData} data Data used to render the tab icon.
     * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
     */
    renderIcon(data, isInSidePanel) {
        if (!isInSidePanel && this.iconThemeService && this.iconThemeService.current === 'none') {
            return h.div();
        }
        let top;
        if (data.paddingTop) {
            top = `${data.paddingTop || 0}px`;
        }
        const style = { top };
        const baseClassName = this.createIconClass(data);
        const overlayIcons = [];
        const decorationData = this.getDecorationData(data.title, 'iconOverlay');
        // Check if the tab has decoration markers to be rendered on top.
        if (decorationData.length > 0) {
            const baseIcon = h.div({ className: baseClassName, style }, data.title.iconLabel);
            const wrapperClassName = WidgetDecoration.Styles.ICON_WRAPPER_CLASS;
            const decoratorSizeClassName = isInSidePanel ? WidgetDecoration.Styles.DECORATOR_SIDEBAR_SIZE_CLASS : WidgetDecoration.Styles.DECORATOR_SIZE_CLASS;
            decorationData
                .filter(notEmpty)
                .map(overlay => [overlay.position, overlay])
                .forEach(([position, overlay]) => {
                const iconAdditionalClasses = [decoratorSizeClassName, WidgetDecoration.IconOverlayPosition.getStyle(position, isInSidePanel)];
                const overlayIconStyle = (color) => {
                    if (color === undefined) {
                        return {};
                    }
                    return { color };
                };
                // Parse the optional background (if it exists) of the overlay icon.
                if (overlay.background) {
                    const backgroundIconClassName = this.getIconClass(overlay.background.shape, iconAdditionalClasses);
                    overlayIcons.push(h.div({
                        key: data.title.label + '-background',
                        className: backgroundIconClassName,
                        style: overlayIconStyle(overlay.background.color)
                    }));
                }
                // Parse the overlay icon.
                const overlayIcon = overlay.icon || overlay.iconClass;
                const overlayIconClassName = this.getIconClass(overlayIcon, iconAdditionalClasses);
                overlayIcons.push(h.span({
                    key: data.title.label,
                    className: overlayIconClassName,
                    style: overlayIconStyle(overlay.color)
                }));
            });
            return h.div({ className: wrapperClassName, style }, [baseIcon, ...overlayIcons]);
        }
        return h.div({ className: baseClassName, style }, data.title.iconLabel);
    }
    resetDecorations(title) {
        if (title) {
            this.decorations.delete(title);
        }
        else {
            this.decorations.clear();
        }
        if (this.tabBar) {
            this.tabBar.update();
        }
    }
    /**
     * Get all available decorations of a given tab.
     * @param {string} title The widget title.
     */
    getDecorations(title) {
        if (this.tabBar && this.decoratorService) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const owner = title.owner;
            if (!owner.resetTabBarDecorations) {
                owner.resetTabBarDecorations = () => this.decorations.delete(title);
                title.owner.disposed.connect(owner.resetTabBarDecorations);
            }
            const decorations = this.decorations.get(title) || this.decoratorService.getDecorations(title);
            this.decorations.set(title, decorations);
            return decorations;
        }
        return [];
    }
    /**
     * Get the decoration data given the tab URI and the decoration data type.
     * @param {string} title The title.
     * @param {K} key The type of the decoration data.
     */
    getDecorationData(title, key) {
        return this.getDecorations(title).filter(data => data[key] !== undefined).map(data => data[key]);
    }
    handleContextMenuEvent = (event) => {
        if (this.contextMenuRenderer && this.contextMenuPath && event.currentTarget instanceof HTMLElement) {
            event.stopPropagation();
            event.preventDefault();
            this.contextMenuRenderer.render(this.contextMenuPath, event);
        }
    };
    handleDblClickEvent = (event) => {
        if (this.tabBar && event.currentTarget instanceof HTMLElement) {
            const id = event.currentTarget.id;
            // eslint-disable-next-line no-null/no-null
            const title = this.tabBar.titles.find(t => this.createTabId(t) === id) || null;
            const area = title && title.owner.parent;
            if (area instanceof TartDockPanel && (area.id === BOTTOM_AREA_ID || area.id === MAIN_AREA_ID)) {
                area.toggleMaximized();
            }
        }
    };
    /**
     * Get the class of an icon.
     * @param {string | string[]} iconName The name of the icon.
     * @param {string[]} additionalClasses Additional classes of the icon.
     */
    getIconClass(iconName, additionalClasses = []) {
        const iconClass = (typeof iconName === 'string') ? ['a', 'fa', `fa-${iconName}`] : ['a'].concat(iconName);
        return iconClass.concat(additionalClasses).join(' ');
    }
}
export class ScrollableTabBar extends TabBar {
    scrollBar;
    toDispose = new DisposableCollection();
    scrollBarFactory;
    pendingReveal;
    constructor(options) {
        super(options);
        this.scrollBarFactory = () => new PerfectScrollbar(this.scrollbarHost, options);
    }
    get scrollbarHost() {
        return this.node;
    }
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this.toDispose.dispose();
    }
    /**
     * Reveal the tab with the given index by moving the scroll bar if necessary.
     */
    revealTab(index) {
        if (this.pendingReveal) {
            // A reveal has already been scheduled
            return this.pendingReveal;
        }
        const result = new Promise((resolve, reject) => {
            // The tab might not have been created yet, so wait until the next frame
            window.requestAnimationFrame(() => {
                const tab = this.contentNode.children[index];
                if (tab && this.isVisible) {
                    const parent = this.scrollbarHost;
                    if (this.orientation === 'horizontal') {
                        const scroll = parent.scrollLeft;
                        const left = tab.offsetLeft;
                        if (scroll > left) {
                            parent.scrollLeft = left;
                        }
                        else {
                            const right = left + tab.clientWidth - parent.clientWidth;
                            if (scroll < right && tab.clientWidth < parent.clientWidth) {
                                parent.scrollLeft = right;
                            }
                        }
                    }
                    else {
                        const scroll = parent.scrollTop;
                        const top = tab.offsetTop;
                        if (scroll > top) {
                            parent.scrollTop = top;
                        }
                        else {
                            const bottom = top + tab.clientHeight - parent.clientHeight;
                            if (scroll < bottom && tab.clientHeight < parent.clientHeight) {
                                parent.scrollTop = bottom;
                            }
                        }
                    }
                }
                if (this.pendingReveal === result) {
                    this.pendingReveal = undefined;
                }
                resolve();
            });
        });
        this.pendingReveal = result;
        return result;
    }
    onAfterAttach(msg) {
        if (!this.scrollBar) {
            this.scrollBar = this.scrollBarFactory();
        }
        super.onAfterAttach(msg);
    }
    onBeforeDetach(msg) {
        super.onBeforeDetach(msg);
        if (this.scrollBar) {
            this.scrollBar.destroy();
            this.scrollBar = undefined;
        }
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        if (this.scrollBar) {
            this.scrollBar.update();
        }
    }
    onResize(msg) {
        super.onResize(msg);
        if (this.scrollBar) {
            if (this.currentIndex >= 0) {
                this.revealTab(this.currentIndex);
            }
            this.scrollBar.update();
        }
    }
}
/**
 * A specialized tab bar for side areas.
 */
export class SideTabBar extends ScrollableTabBar {
    static DRAG_THRESHOLD = 5;
    /**
     * Emitted when a tab is added to the tab bar.
     */
    tabAdded = new Signal(this);
    /**
     * Side panels can be collapsed by clicking on the currently selected tab. This signal is
     * emitted when the mouse is released on the selected tab without initiating a drag.
     */
    collapseRequested = new Signal(this);
    toCancelViewContainerDND = new DisposableCollection();
    mouseData;
    constructor(options) {
        super(options);
        // Create the hidden content node (see `hiddenContentNode` for explanation)
        const hiddenContent = document.createElement('ul');
        hiddenContent.className = HIDDEN_CONTENT_CLASS;
        this.node.appendChild(hiddenContent);
    }
    /**
     * Tab bars of the left and right side panel are arranged vertically by rotating their labels.
     * Rotation is realized with the CSS `transform` property, which disrupts the browser's ability
     * to arrange the involved elements automatically. Therefore the elements are arranged explicitly
     * by the TabBarRenderer using inline `height` and `top` styles. However, the size of labels
     * must still be computed by the browser, so the rendering is performed in two steps: first the
     * tab bar is rendered horizontally inside a _hidden content node_, then it is rendered again
     * vertically inside the proper content node. After the first step, size information is gathered
     * from all labels so it can be applied during the second step.
     */
    get hiddenContentNode() {
        return this.node.getElementsByClassName(HIDDEN_CONTENT_CLASS)[0];
    }
    insertTab(index, value) {
        const result = super.insertTab(index, value);
        this.tabAdded.emit({ title: result });
        return result;
    }
    /**
     * The following event processing is used to generate `collapseRequested` signals
     * when the mouse goes up on the currently selected tab without too much movement
     * between `mousedown` and `mouseup`. The movement threshold is the same that
     * is used by the superclass to detect a drag event. The `allowDeselect` option
     * of the TabBar constructor cannot be used here because it is triggered when the
     * mouse goes down, and thus collides with dragging.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'pointerdown':
                this.onMouseDown(event);
                super.handleEvent(event);
                break;
            case 'pointerup':
                super.handleEvent(event);
                this.onMouseUp(event);
                break;
            case 'pointermove':
                this.onMouseMove(event);
                super.handleEvent(event);
                break;
            case 'p-dragenter':
                this.onDragEnter(event);
                break;
            case 'p-dragover':
                this.onDragOver(event);
                break;
            case 'p-dragleave':
            case 'p-drop':
                this.cancelViewContainerDND();
                break;
            default:
                super.handleEvent(event);
        }
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.renderTabBar();
        this.node.addEventListener('p-dragenter', this);
        this.node.addEventListener('p-dragover', this);
        this.node.addEventListener('p-dragleave', this);
        document.addEventListener('p-drop', this);
    }
    onAfterDetach(msg) {
        super.onAfterDetach(msg);
        this.node.removeEventListener('p-dragenter', this);
        this.node.removeEventListener('p-dragover', this);
        this.node.removeEventListener('p-dragleave', this);
        document.removeEventListener('p-drop', this);
    }
    onUpdateRequest(msg) {
        this.renderTabBar();
        if (this.scrollBar) {
            this.scrollBar.update();
        }
    }
    /**
     * Render the tab bar in the _hidden content node_ (see `hiddenContentNode` for explanation),
     * then gather size information for labels and render it again in the proper content node.
     */
    renderTabBar() {
        if (this.isAttached) {
            // Render into the invisible node
            this.renderTabs(this.hiddenContentNode);
            // Await a rendering frame
            window.requestAnimationFrame(() => {
                const hiddenContent = this.hiddenContentNode;
                const n = hiddenContent.children.length;
                const renderData = new Array(n);
                for (let i = 0; i < n; i++) {
                    const hiddenTab = hiddenContent.children[i];
                    // Extract tab padding from the computed style
                    const tabStyle = window.getComputedStyle(hiddenTab);
                    const rd = {
                        paddingTop: parseFloat(tabStyle.paddingTop),
                        paddingBottom: parseFloat(tabStyle.paddingBottom)
                    };
                    // Extract label size from the DOM
                    const labelElements = hiddenTab.getElementsByClassName('p-TabBar-tabLabel');
                    if (labelElements.length === 1) {
                        const label = labelElements[0];
                        rd.labelSize = { width: label.clientWidth, height: label.clientHeight };
                    }
                    // Extract icon size from the DOM
                    const iconElements = hiddenTab.getElementsByClassName('p-TabBar-tabIcon');
                    if (iconElements.length === 1) {
                        const icon = iconElements[0];
                        rd.iconSize = { width: icon.clientWidth, height: icon.clientHeight };
                    }
                    renderData[i] = rd;
                }
                // Render into the visible node
                this.renderTabs(this.contentNode, renderData);
            });
        }
    }
    /**
     * Render the tab bar using the given DOM element as host. The optional `renderData` is forwarded
     * to the TabBarRenderer.
     */
    renderTabs(host, renderData) {
        const titles = this.titles;
        const n = titles.length;
        const renderer = this.renderer;
        const currentTitle = this.currentTitle;
        const content = new Array(n);
        for (let i = 0; i < n; i++) {
            const title = titles[i];
            const current = title === currentTitle;
            const zIndex = current ? n : n - i - 1;
            let rd;
            if (renderData && i < renderData.length) {
                rd = { title, current, zIndex, ...renderData[i] };
            }
            else {
                rd = { title, current, zIndex };
            }
            content[i] = renderer.renderTab(rd, true);
        }
        VirtualDOM.render(content, host);
    }
    cancelViewContainerDND = () => {
        this.toCancelViewContainerDND.dispose();
    };
    /**
     * Handles `viewContainerPart` drag enter.
     */
    onDragEnter = (event) => {
        this.cancelViewContainerDND();
        if (event.mimeData.getData('application/vnd.phosphor.view-container-factory')) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    /**
     * Handle `viewContainerPart` drag over,
     * Defines the appropriate `drpAction` and opens the tab on which the mouse stands on for more than 800 ms.
     */
    onDragOver = (event) => {
        const factory = event.mimeData.getData('application/vnd.phosphor.view-container-factory');
        const widget = factory && factory();
        if (!widget) {
            event.dropAction = 'none';
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!this.toCancelViewContainerDND.disposed) {
            event.dropAction = event.proposedAction;
            return;
        }
        const { target, clientX, clientY } = event;
        if (target instanceof HTMLElement) {
            if (widget.options.disableDraggingToOtherContainers || widget.viewContainer.disableDNDBetweenContainers) {
                event.dropAction = 'none';
                target.classList.add('tart-cursor-no-drop');
                this.toCancelViewContainerDND.push(Disposable.create(() => {
                    target.classList.remove('tart-cursor-no-drop');
                }));
            }
            else {
                event.dropAction = event.proposedAction;
            }
            const { top, bottom, left, right, height } = target.getBoundingClientRect();
            const mouseOnTop = (clientY - top) < (height / 2);
            const dropTargetClass = `drop-target-${mouseOnTop ? 'top' : 'bottom'}`;
            const tabs = this.contentNode.children;
            const targetTab = ArrayExt.findFirstValue(tabs, t => ElementExt.hitTest(t, clientX, clientY));
            if (!targetTab) {
                return;
            }
            targetTab.classList.add(dropTargetClass);
            this.toCancelViewContainerDND.push(Disposable.create(() => {
                if (targetTab) {
                    targetTab.classList.remove(dropTargetClass);
                }
            }));
            const openTabTimer = setTimeout(() => {
                const title = this.titles.find(t => this.renderer.createTabId(t) === targetTab.id);
                if (title) {
                    const mouseStillOnTab = clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
                    if (mouseStillOnTab) {
                        this.currentTitle = title;
                    }
                }
            }, 800);
            this.toCancelViewContainerDND.push(Disposable.create(() => {
                clearTimeout(openTabTimer);
            }));
        }
    };
    onMouseDown(event) {
        // Check for left mouse button and current mouse status
        if (event.button !== 0 || this.mouseData) {
            return;
        }
        // Check whether the mouse went down on the current tab
        const tabs = this.contentNode.children;
        const index = ArrayExt.findFirstIndex(tabs, tab => ElementExt.hitTest(tab, event.clientX, event.clientY));
        if (index < 0 || index !== this.currentIndex) {
            return;
        }
        // Check whether the close button was clicked
        const icon = tabs[index].querySelector(this.renderer.closeIconSelector);
        if (icon && icon.contains(event.target)) {
            return;
        }
        this.mouseData = {
            pressX: event.clientX,
            pressY: event.clientY,
            mouseDownTabIndex: index
        };
    }
    onMouseUp(event) {
        // Check for left mouse button and current mouse status
        if (event.button !== 0 || !this.mouseData) {
            return;
        }
        // Check whether the mouse went up on the current tab
        const mouseDownTabIndex = this.mouseData.mouseDownTabIndex;
        this.mouseData = undefined;
        const tabs = this.contentNode.children;
        const index = ArrayExt.findFirstIndex(tabs, tab => ElementExt.hitTest(tab, event.clientX, event.clientY));
        if (index < 0 || index !== mouseDownTabIndex) {
            return;
        }
        // Collapse the side bar
        this.collapseRequested.emit(this.titles[index]);
    }
    onMouseMove(event) {
        // Check for left mouse button and current mouse status
        if (event.button !== 0 || !this.mouseData) {
            return;
        }
        const data = this.mouseData;
        const dx = Math.abs(event.clientX - data.pressX);
        const dy = Math.abs(event.clientY - data.pressY);
        const threshold = SideTabBar.DRAG_THRESHOLD;
        if (dx >= threshold || dy >= threshold) {
            this.mouseData = undefined;
        }
    }
}
/**
 * Specialized scrollable tab-bar which comes with toolbar support.
 * Instead of the following DOM structure.
 *
 * +-------------------------+
 * |[TAB_0][TAB_1][TAB_2][TAB|
 * +-------------Scrollable--+
 *
 * There is a dedicated HTML element for toolbar which does **not** contained in the scrollable element.
 *
 * +-------------------------+-----------------+
 * |[TAB_0][TAB_1][TAB_2][TAB|         Toolbar |
 * +-------------Scrollable--+-Non-Scrollable-+
 *
 */
// export class ToolbarAwareTabBar extends ScrollableTabBar {
//
//     protected contentContainer: HTMLElement;
//     protected toolbar: TabBarToolbar | undefined;
//     protected breadcrumbsContainer: HTMLElement;
//     // protected readonly breadcrumbsRenderer: BreadcrumbsRenderer;
//     protected topRow: HTMLElement;
//
//     constructor(
//         protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
//         protected readonly tabBarToolbarFactory: () => TabBarToolbar,
//         protected readonly breadcrumbsRendererFactory: BreadcrumbsRendererFactory,
//         protected readonly options?: TabBar.IOptions<Widget> & PerfectScrollbar.Options,
//     ) {
//         super(options);
//         this.breadcrumbsRenderer = this.breadcrumbsRendererFactory();
//         this.rewireDOM();
//         this.toDispose.push(this.tabBarToolbarRegistry.onDidChange(() => this.update()));
//         this.toDispose.push(this.breadcrumbsRenderer);
//         this.toDispose.push(this.breadcrumbsRenderer.onDidChangeActiveState(active => {
//             this.node.classList.toggle('tart-tabBar-multirow', active);
//             if (this.parent) {
//                 MessageLoop.sendMessage(this.parent, new Message('fit-request'));
//             }
//         }));
//         this.node.classList.toggle('tart-tabBar-multirow', this.breadcrumbsRenderer.active);
//         const handler = () => this.updateBreadcrumbs();
//         this.currentChanged.connect(handler);
//         this.toDispose.push(Disposable.create(() => this.currentChanged.disconnect(handler)));
//     }
//
//     /**
//      * Overrides the `contentNode` property getter in PhosphorJS' TabBar.
//      */
//     get contentNode(): HTMLUListElement {
//         return this.tabBarContainer.getElementsByClassName(ToolbarAwareTabBar.Styles.TAB_BAR_CONTENT)[0] as HTMLUListElement;
//     }
//
//     /**
//      * Overrides the scrollable host from the parent class.
//      */
//     protected get scrollbarHost(): HTMLElement {
//         return this.tabBarContainer;
//     }
//
//     protected get tabBarContainer(): HTMLElement {
//         return this.node.getElementsByClassName(ToolbarAwareTabBar.Styles.TAB_BAR_CONTENT_CONTAINER)[0] as HTMLElement;
//     }
//
//     protected async updateBreadcrumbs(): Promise<void> {
//         const current = this.currentTitle?.owner;
//         const uri = NavigatableWidget.is(current) ? current.getResourceUri() : undefined;
//         await this.breadcrumbsRenderer.refresh(uri);
//     }
//
//     protected onAfterAttach(msg: Message): void {
//         if (this.toolbar) {
//             if (this.toolbar.isAttached) {
//                 Widget.detach(this.toolbar);
//             }
//             Widget.attach(this.toolbar, this.topRow);
//             if (this.breadcrumbsContainer) {
//                 this.node.appendChild(this.breadcrumbsContainer);
//             }
//             this.breadcrumbsRenderer?.refresh();
//         }
//         super.onAfterAttach(msg);
//     }
//
//     protected onBeforeDetach(msg: Message): void {
//         if (this.toolbar && this.toolbar.isAttached) {
//             Widget.detach(this.toolbar);
//         }
//         super.onBeforeDetach(msg);
//     }
//
//     protected onUpdateRequest(msg: Message): void {
//         super.onUpdateRequest(msg);
//         this.updateToolbar();
//     }
//
//     protected updateToolbar(): void {
//         if (!this.toolbar) {
//             return;
//         }
//         const widget = this.currentTitle?.owner ?? undefined;
//         this.toolbar.updateTarget(widget);
//     }
//
//     handleEvent(event: Event): void {
//         if (this.toolbar && event instanceof MouseEvent && this.toolbar.shouldHandleMouseEvent(event)) {
//             // if the mouse event is over the toolbar part don't handle it.
//             return;
//         }
//         super.handleEvent(event);
//     }
//
//     /**
//      * Restructures the DOM defined in PhosphorJS.
//      *
//      * By default the tabs (`li`) are contained in the `this.contentNode` (`ul`) which is wrapped in a `div` (`this.node`).
//      * Instead of this structure, we add a container for the `this.contentNode` and for the toolbar.
//      * The scrollbar will only work for the `ul` part but it does not affect the toolbar, so it can be on the right hand-side.
//      */
//     protected rewireDOM(): void {
//         const contentNode = this.node.getElementsByClassName(ToolbarAwareTabBar.Styles.TAB_BAR_CONTENT)[0];
//         if (!contentNode) {
//             throw new Error("'this.node' does not have the content as a direct child with class name 'p-TabBar-content'.");
//         }
//         this.node.removeChild(contentNode);
//         this.topRow = document.createElement('div');
//         this.topRow.classList.add('tart-tabBar-tab-row');
//         this.contentContainer = document.createElement('div');
//         this.contentContainer.classList.add(ToolbarAwareTabBar.Styles.TAB_BAR_CONTENT_CONTAINER);
//         this.contentContainer.appendChild(contentNode);
//         this.topRow.appendChild(this.contentContainer);
//         this.node.appendChild(this.topRow);
//         this.toolbar = this.tabBarToolbarFactory();
//         this.breadcrumbsContainer = document.createElement('div');
//         this.breadcrumbsContainer.classList.add('tart-tabBar-breadcrumb-row');
//         this.breadcrumbsContainer.appendChild(this.breadcrumbsRenderer.host);
//         this.node.appendChild(this.breadcrumbsContainer);
//     }
// }
export var ToolbarAwareTabBar;
(function (ToolbarAwareTabBar) {
    let Styles;
    (function (Styles) {
        Styles.TAB_BAR_CONTENT = 'p-TabBar-content';
        Styles.TAB_BAR_CONTENT_CONTAINER = 'p-TabBar-content-container';
    })(Styles = ToolbarAwareTabBar.Styles || (ToolbarAwareTabBar.Styles = {}));
})(ToolbarAwareTabBar || (ToolbarAwareTabBar = {}));

//# sourceMappingURL=../../../lib/browser/shell/tab-bars.js.map
