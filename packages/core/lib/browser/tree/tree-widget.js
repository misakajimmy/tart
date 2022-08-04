/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TreeWidget_1;
import { debounce } from 'lodash';
import { inject, injectable, postConstruct } from 'inversify';
import { Disposable, SelectionService } from '../../common';
import { Key, KeyCode, KeyModifier } from '../keyboard/keys';
import { ContextMenuRenderer } from '../context-menu-renderer';
import { BUSY_CLASS, CODICON_LOADING_CLASSES, CODICON_TREE_ITEM_CLASSES, COLLAPSED_CLASS, EXPANSION_TOGGLE_CLASS, FOCUS_CLASS, SELECTED_CLASS, UnsafeWidgetUtilities, Widget } from '../widgets';
import { CompositeTreeNode, TreeNode } from './tree';
import { TreeModel } from './tree-model';
import { ExpandableTreeNode } from './tree-expansion';
import { SelectableTreeNode, TreeSelection } from './tree-selection';
import { DecoratedTreeNode, TreeDecoration, TreeDecoratorService } from './tree-decorator';
import { notEmpty } from '../../common/objects';
import { isOSX } from '../../common/os';
import { ReactWidget } from '../widgets/react-widget';
import * as React from 'react';
import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import { TopDownTreeIterator } from './tree-iterator';
import { SearchBoxFactory, SearchBoxProps } from './search-box';
import { TreeSearch } from './tree-search';
import { ElementExt } from '@lumino/domutils';
import { TreeWidgetSelection } from './tree-widget-selection';
import { LabelProvider } from '../label-provider';
import { CorePreferences } from '../core-preferences';
export const TREE_CLASS = 'tart-Tree';
export const TREE_CONTAINER_CLASS = 'tart-TreeContainer';
export const TREE_NODE_CLASS = 'tart-TreeNode';
export const TREE_NODE_CONTENT_CLASS = 'tart-TreeNodeContent';
export const TREE_NODE_INFO_CLASS = 'tart-TreeNodeInfo';
export const TREE_NODE_TAIL_CLASS = 'tart-TreeNodeTail';
export const TREE_NODE_SEGMENT_CLASS = 'tart-TreeNodeSegment';
export const TREE_NODE_SEGMENT_GROW_CLASS = 'tart-TreeNodeSegmentGrow';
export const EXPANDABLE_TREE_NODE_CLASS = 'tart-ExpandableTreeNode';
export const COMPOSITE_TREE_NODE_CLASS = 'tart-CompositeTreeNode';
export const TREE_NODE_CAPTION_CLASS = 'tart-TreeNodeCaption';
export const TREE_NODE_INDENT_GUIDE_CLASS = 'tart-tree-node-indent';
export const TreeProps = Symbol('TreeProps');
/**
 * The default tree properties.
 */
export const defaultTreeProps = {
    leftPadding: 8,
    expansionTogglePadding: 22
};
let TreeWidget = TreeWidget_1 = class TreeWidget extends ReactWidget {
    props;
    model;
    contextMenuRenderer;
    scrollArea = this.node;
    searchBox;
    searchHighlights;
    decoratorService;
    treeSearch;
    searchBoxFactory;
    decorations = new Map();
    selectionService;
    labelProvider;
    corePreferences;
    shouldScrollToRow = true;
    rows = new Map();
    updateRows = debounce(() => this.doUpdateRows(), 10);
    /**
     * Row index to ensure visibility.
     * - Used to forcefully scroll if necessary.
     */
    scrollToRow;
    /**
     * Update tree decorations.
     * - Updating decorations are debounced in order to limit the number of expensive updates.
     */
    updateDecorations = debounce(() => this.doUpdateDecorations(), 150);
    view;
    /**
     * Store the last scroll state.
     */
    lastScrollState;
    constructor(props, model, contextMenuRenderer) {
        super();
        this.props = props;
        this.model = model;
        this.contextMenuRenderer = contextMenuRenderer;
        this.scrollOptions = {
            suppressScrollX: true,
            minScrollbarLength: 35
        };
        this.addClass(TREE_CLASS);
        this.node.tabIndex = 0;
    }
    /**
     * Store the tree state.
     */
    storeState() {
        const decorations = this.decoratorService.deflateDecorators(this.decorations);
        let state = {
            decorations
        };
        if (this.model.root) {
            state = {
                ...state,
                root: this.deflateForStorage(this.model.root),
                model: this.model.storeState()
            };
        }
        return state;
    }
    /**
     * Restore the state.
     * @param oldState the old state object.
     */
    restoreState(oldState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { root, decorations, model } = oldState;
        if (root) {
            this.model.root = this.inflateFromStorage(root);
        }
        if (decorations) {
            this.decorations = this.decoratorService.inflateDecorators(decorations);
        }
        if (model) {
            this.model.restoreState(model);
        }
    }
    init() {
        if (this.props.search) {
            this.searchBox = this.searchBoxFactory({ ...SearchBoxProps.DEFAULT, showButtons: true, showFilter: true });
            this.searchBox.node.addEventListener('focus', () => {
                this.node.focus();
            });
            this.toDispose.pushAll([
                this.searchBox,
                this.searchBox.onTextChange(async (data) => {
                    await this.treeSearch.filter(data);
                    this.searchHighlights = this.treeSearch.getHighlights();
                    this.searchBox.updateHighlightInfo({
                        filterText: data,
                        total: this.rows.size,
                        matched: this.searchHighlights.size
                    });
                    this.update();
                }),
                this.searchBox.onClose(data => this.treeSearch.filter(undefined)),
                this.searchBox.onNext(() => {
                    // Enable next selection if there are currently highlights.
                    if (this.searchHighlights.size > 1) {
                        this.model.selectNextNode();
                    }
                }),
                this.searchBox.onPrevious(() => {
                    // Enable previous selection if there are currently highlights.
                    if (this.searchHighlights.size > 1) {
                        this.model.selectPrevNode();
                    }
                }),
                this.searchBox.onFilterToggled(e => {
                    this.updateRows();
                }),
                this.treeSearch,
                this.treeSearch.onFilteredNodesChanged(nodes => {
                    if (this.searchBox.isFiltering) {
                        this.updateRows();
                    }
                    const node = nodes.find(SelectableTreeNode.is);
                    if (node) {
                        this.model.selectNode(node);
                    }
                }),
            ]);
        }
        this.toDispose.pushAll([
            this.model,
            this.model.onChanged(() => this.updateRows()),
            this.model.onSelectionChanged(() => this.updateScrollToRow({ resize: false })),
            this.model.onDidChangeBusy(() => this.update()),
            this.model.onNodeRefreshed(() => this.updateDecorations()),
            this.model.onExpansionChanged(() => this.updateDecorations()),
            this.decoratorService,
            this.decoratorService.onDidChangeDecorations(() => this.updateDecorations()),
            this.labelProvider.onDidChange(e => {
                for (const row of this.rows.values()) {
                    if (e.affects(row)) {
                        this.forceUpdate();
                        return;
                    }
                }
            })
        ]);
        setTimeout(() => {
            this.updateRows();
            this.updateDecorations();
        });
        if (this.props.globalSelection) {
            this.toDispose.pushAll([
                this.model.onSelectionChanged(() => {
                    if (this.node.contains(document.activeElement)) {
                        this.updateGlobalSelection();
                    }
                }),
                Disposable.create(() => {
                    const selection = this.selectionService.selection;
                    if (TreeWidgetSelection.isSource(selection, this)) {
                        this.selectionService.selection = undefined;
                    }
                })
            ]);
        }
        this.toDispose.push(this.corePreferences.onPreferenceChanged(preference => {
            if (preference.preferenceName === 'workbench.tree.renderIndentGuides') {
                this.update();
            }
        }));
    }
    /**
     * Update the global selection for the tree.
     */
    updateGlobalSelection() {
        this.selectionService.selection = TreeWidgetSelection.create(this);
    }
    doUpdateRows() {
        const root = this.model.root;
        const rowsToUpdate = [];
        if (root) {
            const depths = new Map();
            let index = 0;
            const c = new TopDownTreeIterator(root, {
                pruneCollapsed: true,
                pruneSiblings: true
            });
            for (const node of c) {
                if (this.shouldDisplayNode(node)) {
                    const parentDepth = depths.get(node.parent);
                    const depth = parentDepth === undefined ? 0 : TreeNode.isVisible(node.parent) ? parentDepth + 1 : parentDepth;
                    if (CompositeTreeNode.is(node)) {
                        depths.set(node, depth);
                    }
                    rowsToUpdate.push([node.id, {
                            index: index++,
                            node,
                            depth
                        }]);
                }
            }
        }
        this.rows = new Map(rowsToUpdate);
        this.updateScrollToRow();
    }
    shouldDisplayNode(node) {
        return TreeNode.isVisible(node) && (!this.searchBox?.isFiltering || this.treeSearch.passesFilters(node));
    }
    /**
     * Update the `scrollToRow`.
     * @param updateOptions the tree widget force update options.
     */
    updateScrollToRow(updateOptions) {
        this.scrollToRow = this.getScrollToRow();
        this.forceUpdate(updateOptions);
    }
    /**
     * Get the `scrollToRow`.
     *
     * @returns the `scrollToRow` if available.
     */
    getScrollToRow() {
        if (!this.shouldScrollToRow) {
            return undefined;
        }
        const selected = this.model.selectedNodes;
        const node = selected.find(SelectableTreeNode.hasFocus) || selected[0];
        const row = node && this.rows.get(node.id);
        return row && row.index;
    }
    async doUpdateDecorations() {
        this.decorations = await this.decoratorService.getDecorations(this.model);
        this.forceUpdate();
    }
    /**
     * Force deep resizing and rendering of rows.
     * https://github.com/bvaughn/react-virtualized/blob/master/docs/List.md#recomputerowheights-index-number
     */
    forceUpdate({ resize } = { resize: false }) {
        if (this.view && this.view.list) {
            if (resize && this.isVisible) {
                this.view.cache.clearAll();
                this.view.list.recomputeRowHeights();
            }
            else {
                this.view.list.forceUpdateGrid();
            }
        }
        this.update();
    }
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        this.node.focus({ preventScroll: true });
    }
    /**
     * Actually focus the tree node.
     */
    doFocus() {
        if (!this.model.selectedNodes.length) {
            const node = this.getNodeToFocus();
            if (SelectableTreeNode.is(node)) {
                this.model.selectNode(node);
            }
        }
        // It has to be called after nodes are selected.
        if (this.props.globalSelection) {
            this.updateGlobalSelection();
        }
        this.forceUpdate();
    }
    /**
     * Get the tree node to focus.
     *
     * @returns the node to focus if available.
     */
    getNodeToFocus() {
        const root = this.model.root;
        if (SelectableTreeNode.isVisible(root)) {
            return root;
        }
        return this.model.getNextSelectableNode(root);
    }
    onUpdateRequest(msg) {
        if (!this.isAttached) {
            // if (!this.isAttached || !this.isVisible) {
            return;
        }
        super.onUpdateRequest(msg);
    }
    onResize(msg) {
        super.onResize(msg);
        this.forceUpdate({ resize: true });
    }
    render() {
        return React.createElement('div', this.createContainerAttributes(), this.renderTree(this.model));
    }
    /**
     * Create the container attributes for the widget.
     */
    createContainerAttributes() {
        const classNames = [TREE_CONTAINER_CLASS];
        if (!this.rows.size) {
            classNames.push('empty');
        }
        return {
            className: classNames.join(' '),
            onContextMenu: event => this.handleContextMenuEvent(this.getContainerTreeNode(), event)
        };
    }
    /**
     * Get the container tree node.
     *
     * @returns the tree node for the container if available.
     */
    getContainerTreeNode() {
        return this.model.root;
    }
    /**
     * Render the tree widget.
     * @param model the tree model.
     */
    renderTree(model) {
        if (model.root) {
            const rows = Array.from(this.rows.values());
            if (this.props.virtualized === false) {
                this.onRender.push(Disposable.create(() => this.scrollToSelected()));
                return rows.map(row => React.createElement("div", { key: row.index }, this.renderNodeRow(row)));
            }
            return React.createElement(TreeWidget_1.View, { ref: view => this.view = (view || undefined), width: this.node.offsetWidth, height: this.node.offsetHeight, rows: rows, renderNodeRow: this.renderNodeRow, scrollToRow: this.scrollToRow, handleScroll: this.handleScroll });
        }
        // eslint-disable-next-line no-null/no-null
        return null;
    }
    /**
     * Scroll to the selected tree node.
     */
    scrollToSelected() {
        if (this.props.scrollIfActive === true && !this.node.contains(document.activeElement)) {
            return;
        }
        const focus = this.node.getElementsByClassName(FOCUS_CLASS)[0];
        if (focus) {
            ElementExt.scrollIntoViewIfNeeded(this.scrollArea, focus);
        }
        else {
            const selected = this.node.getElementsByClassName(SELECTED_CLASS)[0];
            if (selected) {
                ElementExt.scrollIntoViewIfNeeded(this.scrollArea, selected);
            }
        }
    }
    /**
     * Handle the scroll event.
     */
    handleScroll = (info) => {
        this.node.scrollTop = info.scrollTop;
    };
    /**
     * Render the node row.
     */
    renderNodeRow = (row) => this.doRenderNodeRow(row);
    /**
     * Actually render the node row.
     */
    doRenderNodeRow({ index, node, depth }) {
        return React.createElement(React.Fragment, null,
            this.renderIndent(node, { depth }),
            this.renderNode(node, { depth }));
    }
    /**
     * Render the tree node given the node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    renderIcon(node, props) {
        // eslint-disable-next-line no-null/no-null
        return null;
    }
    /**
     * Toggle the node.
     */
    toggle = (event) => this.doToggle(event);
    /**
     * Actually toggle the tree node.
     * @param event the mouse click event.
     */
    doToggle(event) {
        const nodeId = event.currentTarget.getAttribute('data-node-id');
        if (nodeId) {
            const node = this.model.getNode(nodeId);
            if (node && this.props.expandOnlyOnExpansionToggleClick) {
                if (this.isExpandable(node) && !this.hasShiftMask(event) && !this.hasCtrlCmdMask(event)) {
                    this.model.toggleNodeExpansion(node);
                }
            }
            else {
                this.handleClickEvent(node, event);
            }
        }
        event.stopPropagation();
    }
    /**
     * Render the node expansion toggle.
     * @param node the tree node.
     * @param props the node properties.
     */
    renderExpansionToggle(node, props) {
        if (!this.isExpandable(node)) {
            // eslint-disable-next-line no-null/no-null
            return null;
        }
        const classes = [TREE_NODE_SEGMENT_CLASS, EXPANSION_TOGGLE_CLASS];
        if (!node.expanded) {
            classes.push(COLLAPSED_CLASS);
        }
        if (node.busy) {
            classes.push(BUSY_CLASS, ...CODICON_LOADING_CLASSES);
        }
        else {
            classes.push(...CODICON_TREE_ITEM_CLASSES);
        }
        const className = classes.join(' ');
        return React.createElement("div", { "data-node-id": node.id, className: className, onClick: this.toggle, onDoubleClick: this.handleExpansionToggleDblClickEvent });
    }
    /**
     * Render the tree node caption given the node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    renderCaption(node, props) {
        const tooltip = this.getDecorationData(node, 'tooltip').filter(notEmpty).join(' • ');
        const classes = [TREE_NODE_SEGMENT_CLASS];
        if (!this.hasTrailingSuffixes(node)) {
            classes.push(TREE_NODE_SEGMENT_GROW_CLASS);
        }
        const className = classes.join(' ');
        let attrs = this.decorateCaption(node, {
            className, id: node.id
        });
        if (tooltip.length > 0) {
            attrs = {
                ...attrs,
                title: tooltip
            };
        }
        const children = [];
        const caption = this.toNodeName(node);
        const highlight = this.getDecorationData(node, 'highlight')[0];
        if (highlight) {
            children.push(this.toReactNode(caption, highlight));
        }
        const searchHighlight = this.searchHighlights ? this.searchHighlights.get(node.id) : undefined;
        if (searchHighlight) {
            children.push(...this.toReactNode(caption, searchHighlight));
        }
        else if (!highlight) {
            children.push(caption);
        }
        return React.createElement('div', attrs, ...children);
    }
    /**
     * Update the node given the caption and highlight.
     * @param caption the caption.
     * @param highlight the tree decoration caption highlight.
     */
    toReactNode(caption, highlight) {
        let style = {};
        if (highlight.color) {
            style = {
                ...style,
                color: highlight.color
            };
        }
        if (highlight.backgroundColor) {
            style = {
                ...style,
                backgroundColor: highlight.backgroundColor
            };
        }
        const createChildren = (fragment, index) => {
            const { data } = fragment;
            if (fragment.highlight) {
                return React.createElement("mark", { className: TreeDecoration.Styles.CAPTION_HIGHLIGHT_CLASS, style: style, key: index }, data);
            }
            else {
                return data;
            }
        };
        return TreeDecoration.CaptionHighlight.split(caption, highlight).map(createChildren);
    }
    /**
     * Decorate the tree caption.
     * @param node the tree node.
     * @param attrs the additional attributes.
     */
    decorateCaption(node, attrs) {
        const style = this.getDecorationData(node, 'fontData')
            .filter(notEmpty)
            .reverse()
            .map(fontData => this.applyFontStyles({}, fontData))
            .reduce((acc, current) => ({
            ...acc,
            ...current
        }), {});
        return {
            ...attrs,
            style
        };
    }
    /**
     * Determine if the tree node contains trailing suffixes.
     * @param node the tree node.
     *
     * @returns `true` if the tree node contains trailing suffices.
     */
    hasTrailingSuffixes(node) {
        return this.getDecorationData(node, 'captionSuffixes').filter(notEmpty).reduce((acc, current) => acc.concat(current), []).length > 0;
    }
    /**
     * Apply font styles to the tree.
     * @param original the original css properties.
     * @param fontData the optional `fontData`.
     */
    applyFontStyles(original, fontData) {
        if (fontData === undefined) {
            return original;
        }
        const modified = { ...original }; // make a copy to mutate
        const { color, style } = fontData;
        if (color) {
            modified.color = color;
        }
        if (style) {
            (Array.isArray(style) ? style : [style]).forEach(s => {
                switch (s) {
                    case 'bold':
                        modified.fontWeight = s;
                        break;
                    case 'normal':
                    case 'oblique':
                    case 'italic':
                        modified.fontStyle = s;
                        break;
                    case 'underline':
                    case 'line-through':
                        modified.textDecoration = s;
                        break;
                    default:
                        throw new Error(`Unexpected font style: "${s}".`);
                }
            });
        }
        return modified;
    }
    /**
     * Render caption affixes for the given tree node.
     * @param node the tree node.
     * @param props the node properties.
     * @param affixKey the affix key.
     */
    renderCaptionAffixes(node, props, affixKey) {
        const suffix = affixKey === 'captionSuffixes';
        const affixClass = suffix ? TreeDecoration.Styles.CAPTION_SUFFIX_CLASS : TreeDecoration.Styles.CAPTION_PREFIX_CLASS;
        const classes = [TREE_NODE_SEGMENT_CLASS, affixClass];
        const affixes = this.getDecorationData(node, affixKey).filter(notEmpty).reduce((acc, current) => acc.concat(current), []);
        const children = [];
        for (let i = 0; i < affixes.length; i++) {
            const affix = affixes[i];
            if (suffix && i === affixes.length - 1) {
                classes.push(TREE_NODE_SEGMENT_GROW_CLASS);
            }
            const style = this.applyFontStyles({}, affix.fontData);
            const className = classes.join(' ');
            const key = node.id + '_' + i;
            const attrs = {
                className,
                style,
                key
            };
            children.push(React.createElement('div', attrs, affix.data));
        }
        return React.createElement(React.Fragment, null, children);
    }
    /**
     * Decorate the tree node icon.
     * @param node the tree node.
     * @param icon the icon.
     */
    decorateIcon(node, icon) {
        if (!icon) {
            return;
        }
        const overlayIcons = [];
        // if multiple overlays have the same overlay.position attribute, we'll de-duplicate those and only process the first one from the decoration array
        const seenPositions = new Set();
        const overlays = this.getDecorationData(node, 'iconOverlay').filter(notEmpty);
        for (const overlay of overlays) {
            if (!seenPositions.has(overlay.position)) {
                seenPositions.add(overlay.position);
                const iconClasses = [TreeDecoration.Styles.DECORATOR_SIZE_CLASS, TreeDecoration.IconOverlayPosition.getStyle(overlay.position)];
                const style = (color) => color === undefined ? {} : { color };
                if (overlay.background) {
                    overlayIcons.push(React.createElement("span", { key: node.id + 'bg', className: this.getIconClass(overlay.background.shape, iconClasses), style: style(overlay.background.color) }));
                }
                const overlayIcon = 'icon' in overlay ? overlay.icon : overlay.iconClass;
                overlayIcons.push(React.createElement("span", { key: node.id, className: this.getIconClass(overlayIcon, iconClasses), style: style(overlay.color) }));
            }
        }
        if (overlayIcons.length > 0) {
            return React.createElement("div", { className: TreeDecoration.Styles.ICON_WRAPPER_CLASS },
                icon,
                overlayIcons);
        }
        return icon;
    }
    /**
     * Render the tree node tail decorations.
     * @param node the tree node.
     * @param props the node properties.
     */
    renderTailDecorations(node, props) {
        const tailDecorations = this.getDecorationData(node, 'tailDecorations').filter(notEmpty).reduce((acc, current) => acc.concat(current), []);
        if (tailDecorations.length === 0) {
            return;
        }
        return this.renderTailDecorationsForNode(node, props, tailDecorations);
    }
    renderTailDecorationsForNode(node, props, tailDecorations) {
        return React.createElement(React.Fragment, null, tailDecorations.map((decoration, index) => {
            const { tooltip } = decoration;
            const { data, fontData } = decoration;
            const color = decoration.color;
            const className = [TREE_NODE_SEGMENT_CLASS, TREE_NODE_TAIL_CLASS].join(' ');
            const style = fontData ? this.applyFontStyles({}, fontData) : color ? { color } : undefined;
            const icon = decoration.icon || decoration.iconClass;
            const content = data ? data : icon ?
                React.createElement("span", { key: node.id + 'icon' + index, className: this.getIconClass(icon) }) : '';
            return React.createElement("div", { key: node.id + className + index, className: className, style: style, title: tooltip }, content);
        }));
    }
    /**
     * Determine the classes to use for an icon
     * - Assumes a Font Awesome name when passed a single string, otherwise uses the passed string array
     * @param iconName the icon name or list of icon names.
     * @param additionalClasses additional CSS classes.
     *
     * @returns the icon class name.
     */
    getIconClass(iconName, additionalClasses = []) {
        const iconClass = (typeof iconName === 'string') ? ['a', 'fa', `fa-${iconName}`] : ['a'].concat(iconName);
        return iconClass.concat(additionalClasses).join(' ');
    }
    /**
     * Render indent for the file tree based on the depth
     * @param node the tree node.
     * @param depth the depth of the tree node.
     */
    renderIndent(node, props) {
        const renderIndentGuides = this.corePreferences['workbench.tree.renderIndentGuides'];
        if (renderIndentGuides === 'none') {
            return undefined;
        }
        const indentDivs = [];
        let current = node;
        let depth = props.depth;
        while (current && depth) {
            const classNames = [TREE_NODE_INDENT_GUIDE_CLASS];
            if (this.needsActiveIndentGuideline(current)) {
                classNames.push('active');
            }
            else {
                classNames.push(renderIndentGuides === 'onHover' ? 'hover' : 'always');
            }
            const paddingLeft = this.props.leftPadding * depth;
            indentDivs.unshift(React.createElement("div", { key: depth, className: classNames.join(' '), style: {
                    paddingLeft: `${paddingLeft}px`
                } }));
            current = current.parent;
            depth--;
        }
        return indentDivs;
    }
    needsActiveIndentGuideline(node) {
        const parent = node.parent;
        if (!parent || !this.isExpandable(parent)) {
            return false;
        }
        if (SelectableTreeNode.isSelected(parent)) {
            return true;
        }
        if (parent.expanded) {
            for (const sibling of parent.children) {
                if (SelectableTreeNode.isSelected(sibling) && !(this.isExpandable(sibling) && sibling.expanded)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Render the node given the tree node and node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    renderNode(node, props) {
        if (!TreeNode.isVisible(node)) {
            return undefined;
        }
        const attributes = this.createNodeAttributes(node, props);
        const content = React.createElement("div", { className: TREE_NODE_CONTENT_CLASS },
            this.renderExpansionToggle(node, props),
            this.decorateIcon(node, this.renderIcon(node, props)),
            this.renderCaptionAffixes(node, props, 'captionPrefixes'),
            this.renderCaption(node, props),
            this.renderCaptionAffixes(node, props, 'captionSuffixes'),
            this.renderTailDecorations(node, props));
        return React.createElement('div', attributes, content);
    }
    /**
     * Create node attributes for the tree node given the node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    createNodeAttributes(node, props) {
        const className = this.createNodeClassNames(node, props).join(' ');
        const style = this.createNodeStyle(node, props);
        return {
            className,
            style,
            onClick: event => this.handleClickEvent(node, event),
            onDoubleClick: event => this.handleDblClickEvent(node, event),
            onContextMenu: event => this.handleContextMenuEvent(node, event)
        };
    }
    /**
     * Create the node class names.
     * @param node the tree node.
     * @param props the node properties.
     *
     * @returns the list of tree node class names.
     */
    createNodeClassNames(node, props) {
        const classNames = [TREE_NODE_CLASS];
        if (CompositeTreeNode.is(node)) {
            classNames.push(COMPOSITE_TREE_NODE_CLASS);
        }
        if (this.isExpandable(node)) {
            classNames.push(EXPANDABLE_TREE_NODE_CLASS);
        }
        if (SelectableTreeNode.isSelected(node)) {
            classNames.push(SELECTED_CLASS);
        }
        if (SelectableTreeNode.hasFocus(node)) {
            classNames.push(FOCUS_CLASS);
        }
        return classNames;
    }
    /**
     * Get the default node style.
     * @param node the tree node.
     * @param props the node properties.
     *
     * @returns the CSS properties if available.
     */
    getDefaultNodeStyle(node, props) {
        const paddingLeft = this.getPaddingLeft(node, props) + 'px';
        return { paddingLeft };
    }
    getPaddingLeft(node, props) {
        return props.depth * this.props.leftPadding + (this.needsExpansionTogglePadding(node) ? this.props.expansionTogglePadding : 0);
    }
    /**
     * If the node is a composite, a toggle will be rendered.
     * Otherwise we need to add the width and the left, right padding => 18px
     */
    needsExpansionTogglePadding(node) {
        return !this.isExpandable(node);
    }
    /**
     * Create the tree node style.
     * @param node the tree node.
     * @param props the node properties.
     */
    createNodeStyle(node, props) {
        return this.decorateNodeStyle(node, this.getDefaultNodeStyle(node, props));
    }
    /**
     * Decorate the node style.
     * @param node the tree node.
     * @param style the optional CSS properties.
     *
     * @returns the CSS styles if available.
     */
    decorateNodeStyle(node, style) {
        const backgroundColor = this.getDecorationData(node, 'backgroundColor').filter(notEmpty).shift();
        if (backgroundColor) {
            style = {
                ...(style || {}),
                backgroundColor
            };
        }
        return style;
    }
    /**
     * Determine if the tree node is expandable.
     * @param node the tree node.
     *
     * @returns `true` if the tree node is expandable.
     */
    isExpandable(node) {
        return ExpandableTreeNode.is(node);
    }
    /**
     * Get the tree node decorations.
     * @param node the tree node.
     *
     * @returns the list of tree decoration data.
     */
    getDecorations(node) {
        const decorations = [];
        if (DecoratedTreeNode.is(node)) {
            decorations.push(node.decorationData);
        }
        if (this.decorations.has(node.id)) {
            decorations.push(...this.decorations.get(node.id));
        }
        return decorations.sort(TreeDecoration.Data.comparePriority);
    }
    /**
     * Get the tree decoration data for the given key.
     * @param node the tree node.
     * @param key the tree decoration data key.
     *
     * @returns the tree decoration data at the given key.
     */
    getDecorationData(node, key) {
        return this.getDecorations(node).filter(data => data[key] !== undefined).map(data => data[key]).filter(notEmpty);
    }
    /**
     * Get the scroll container.
     */
    getScrollContainer() {
        this.toDisposeOnDetach.push(Disposable.create(() => {
            const { scrollTop, scrollLeft } = this.node;
            this.lastScrollState = { scrollTop, scrollLeft };
        }));
        if (this.lastScrollState) {
            const { scrollTop, scrollLeft } = this.lastScrollState;
            this.node.scrollTop = scrollTop;
            this.node.scrollLeft = scrollLeft;
        }
        return this.node;
    }
    onAfterAttach(msg) {
        const up = [
            Key.ARROW_UP,
            KeyCode.createKeyCode({ first: Key.ARROW_UP, modifiers: [KeyModifier.Shift] })
        ];
        const down = [
            Key.ARROW_DOWN,
            KeyCode.createKeyCode({ first: Key.ARROW_DOWN, modifiers: [KeyModifier.Shift] })
        ];
        if (this.props.search) {
            if (this.searchBox.isAttached) {
                Widget.detach(this.searchBox);
            }
            UnsafeWidgetUtilities.attach(this.searchBox, this.node.parentElement);
            this.addKeyListener(this.node, this.searchBox.keyCodePredicate.bind(this.searchBox), this.searchBox.handle.bind(this.searchBox));
            this.toDisposeOnDetach.push(Disposable.create(() => {
                Widget.detach(this.searchBox);
            }));
        }
        super.onAfterAttach(msg);
        this.addKeyListener(this.node, Key.ARROW_LEFT, event => this.handleLeft(event));
        this.addKeyListener(this.node, Key.ARROW_RIGHT, event => this.handleRight(event));
        this.addKeyListener(this.node, up, event => this.handleUp(event));
        this.addKeyListener(this.node, down, event => this.handleDown(event));
        this.addKeyListener(this.node, Key.ENTER, event => this.handleEnter(event));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.addEventListener(this.node, 'ps-scroll-y', (e) => {
            if (this.view && this.view.list && this.view.list.Grid) {
                const { scrollTop } = e.target;
                this.view.list.Grid.handleScrollEvent({ scrollTop });
            }
        });
        this.addEventListener(this.node, 'focus', () => this.doFocus());
    }
    /**
     * Handle the `left arrow` keyboard event.
     * @param event the `left arrow` keyboard event.
     */
    async handleLeft(event) {
        if (!!this.props.multiSelect && (this.hasCtrlCmdMask(event) || this.hasShiftMask(event))) {
            return;
        }
        if (!await this.model.collapseNode()) {
            this.model.selectParent();
        }
    }
    /**
     * Handle the `right arrow` keyboard event.
     * @param event the `right arrow` keyboard event.
     */
    async handleRight(event) {
        if (!!this.props.multiSelect && (this.hasCtrlCmdMask(event) || this.hasShiftMask(event))) {
            return;
        }
        if (!await this.model.expandNode()) {
            this.model.selectNextNode();
        }
    }
    /**
     * Handle the `up arrow` keyboard event.
     * @param event the `up arrow` keyboard event.
     */
    handleUp(event) {
        if (!!this.props.multiSelect && this.hasShiftMask(event)) {
            this.model.selectPrevNode(TreeSelection.SelectionType.RANGE);
        }
        else {
            this.model.selectPrevNode();
        }
    }
    /**
     * Handle the `down arrow` keyboard event.
     * @param event the `down arrow` keyboard event.
     */
    handleDown(event) {
        if (!!this.props.multiSelect && this.hasShiftMask(event)) {
            this.model.selectNextNode(TreeSelection.SelectionType.RANGE);
        }
        else {
            this.model.selectNextNode();
        }
    }
    /**
     * Handle the `enter key` keyboard event.
     * - `enter` opens the tree node.
     * @param event the `enter key` keyboard event.
     */
    handleEnter(event) {
        this.model.openNode();
    }
    /**
     * Handle the single-click mouse event.
     * @param node the tree node if available.
     * @param event the mouse single-click event.
     */
    handleClickEvent(node, event) {
        if (node) {
            const shiftMask = this.hasShiftMask(event);
            const ctrlCmdMask = this.hasCtrlCmdMask(event);
            if (!!this.props.multiSelect) {
                if (SelectableTreeNode.is(node)) {
                    if (shiftMask) {
                        this.model.selectRange(node);
                    }
                    else if (ctrlCmdMask) {
                        this.model.toggleNode(node);
                    }
                    else {
                        this.model.selectNode(node);
                    }
                }
            }
            else {
                if (SelectableTreeNode.is(node)) {
                    this.model.selectNode(node);
                }
            }
            if (!this.props.expandOnlyOnExpansionToggleClick) {
                if (this.isExpandable(node) && !shiftMask && !ctrlCmdMask) {
                    this.model.toggleNodeExpansion(node);
                }
            }
            event.stopPropagation();
        }
    }
    /**
     * Handle the double-click mouse event.
     * @param node the tree node if available.
     * @param event the double-click mouse event.
     */
    handleDblClickEvent(node, event) {
        this.model.openNode(node);
        event.stopPropagation();
    }
    /**
     * Handle the context menu click event.
     * - The context menu click event is triggered by the right-click.
     * @param node the tree node if available.
     * @param event the right-click mouse event.
     */
    handleContextMenuEvent(node, event) {
        if (SelectableTreeNode.is(node)) {
            // Keep the selection for the context menu, if the widget support multi-selection and the right click happens on an already selected node.
            if (!this.props.multiSelect || !node.selected) {
                const type = !!this.props.multiSelect && this.hasCtrlCmdMask(event) ? TreeSelection.SelectionType.TOGGLE : TreeSelection.SelectionType.DEFAULT;
                this.model.addSelection({ node, type });
            }
            const contextMenuPath = this.props.contextMenuPath;
            if (contextMenuPath) {
                const { x, y } = event.nativeEvent;
                const args = this.toContextMenuArgs(node);
                this.onRender.push(Disposable.create(() => setTimeout(() => this.contextMenuRenderer.render({
                    menuPath: contextMenuPath,
                    anchor: { x, y },
                    args
                }))));
            }
            this.doFocus();
        }
        event.stopPropagation();
        event.preventDefault();
    }
    /**
     * Handle the double-click mouse event on the expansion toggle.
     */
    handleExpansionToggleDblClickEvent = (event) => this.doHandleExpansionToggleDblClickEvent(event);
    /**
     * Actually handle the double-click mouse event on the expansion toggle.
     * @param event the double-click mouse event.
     */
    doHandleExpansionToggleDblClickEvent(event) {
        if (this.props.expandOnlyOnExpansionToggleClick) {
            // Ignore the double-click event.
            event.stopPropagation();
        }
    }
    /**
     * Convert the tree node to context menu arguments.
     * @param node the selectable tree node.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toContextMenuArgs(node) {
        return undefined;
    }
    /**
     * Determine if the tree modifier aware event has a `ctrlcmd` mask.
     * @param event the tree modifier aware event.
     *
     * @returns `true` if the tree modifier aware event contains the `ctrlcmd` mask.
     */
    hasCtrlCmdMask(event) {
        const { metaKey, ctrlKey } = event;
        return (isOSX && metaKey) || ctrlKey;
    }
    /**
     * Determine if the tree modifier aware event has a `shift` mask.
     * @param event the tree modifier aware event.
     *
     * @returns `true` if the tree modifier aware event contains the `shift` mask.
     */
    hasShiftMask(event) {
        // Ctrl/Cmd mask overrules the Shift mask.
        if (this.hasCtrlCmdMask(event)) {
            return false;
        }
        return event.shiftKey;
    }
    /**
     * Deflate the tree node for storage.
     * @param node the tree node.
     */
    deflateForStorage(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const copy = Object.assign({}, node);
        if (copy.parent) {
            delete copy.parent;
        }
        if ('previousSibling' in copy) {
            delete copy.previousSibling;
        }
        if ('nextSibling' in copy) {
            delete copy.nextSibling;
        }
        if ('busy' in copy) {
            delete copy.busy;
        }
        if (CompositeTreeNode.is(node)) {
            copy.children = [];
            for (const child of node.children) {
                copy.children.push(this.deflateForStorage(child));
            }
        }
        return copy;
    }
    /**
     * Inflate the tree node from storage.
     * @param node the tree node.
     * @param parent the optional tree node.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inflateFromStorage(node, parent) {
        if (node.selected) {
            node.selected = false;
        }
        if (parent) {
            node.parent = parent;
        }
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                this.inflateFromStorage(child, node);
            }
        }
        return node;
    }
    toNodeIcon(node) {
        return this.labelProvider.getIcon(node);
    }
    toNodeName(node) {
        return this.labelProvider.getName(node);
    }
    toNodeDescription(node) {
        return this.labelProvider.getLongName(node);
    }
};
__decorate([
    inject(TreeDecoratorService)
], TreeWidget.prototype, "decoratorService", void 0);
__decorate([
    inject(TreeSearch)
], TreeWidget.prototype, "treeSearch", void 0);
__decorate([
    inject(SearchBoxFactory)
], TreeWidget.prototype, "searchBoxFactory", void 0);
__decorate([
    inject(SelectionService)
], TreeWidget.prototype, "selectionService", void 0);
__decorate([
    inject(LabelProvider)
], TreeWidget.prototype, "labelProvider", void 0);
__decorate([
    inject(CorePreferences)
], TreeWidget.prototype, "corePreferences", void 0);
__decorate([
    postConstruct()
], TreeWidget.prototype, "init", null);
TreeWidget = TreeWidget_1 = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(TreeModel)),
    __param(2, inject(ContextMenuRenderer))
], TreeWidget);
export { TreeWidget };
(function (TreeWidget) {
    class View extends React.Component {
        list;
        cache = new CellMeasurerCache({
            fixedWidth: true
        });
        render() {
            const { rows, width, height, scrollToRow, handleScroll } = this.props;
            return React.createElement("div", null,
                console.log('loading') === undefined ? React.createElement("div", { style: { height: '1px' } }) : React.createElement("div", null),
                React.createElement(List, { ref: list => this.list = (list || undefined), width: width, height: height, rowCount: rows.length, rowHeight: this.cache.rowHeight, rowRenderer: this.renderTreeRow, scrollToIndex: scrollToRow, onScroll: handleScroll, tabIndex: -1 }));
        }
        renderTreeRow = ({ key, index, style, parent }) => {
            const row = this.props.rows[index];
            return React.createElement(CellMeasurer, { cache: this.cache, columnIndex: 0, key: key, parent: parent, rowIndex: index },
                React.createElement("div", { key: key, style: style }, this.props.renderNodeRow(row)));
        };
    }
    TreeWidget.View = View;
})(TreeWidget || (TreeWidget = {}));

//# sourceMappingURL=../../../lib/browser/tree/tree-widget.js.map
