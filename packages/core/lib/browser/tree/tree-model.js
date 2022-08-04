/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { inject, injectable, postConstruct } from 'inversify';
import { Emitter } from '../../common';
import { DisposableCollection } from '../../common/disposable';
import { CompositeTreeNode, Tree } from './tree';
import { SelectableTreeNode, TreeSelection, TreeSelectionService } from './tree-selection';
import { ExpandableTreeNode, TreeExpansionService } from './tree-expansion';
import { TreeNavigationService } from './tree-navigation';
import { BottomUpTreeIterator, Iterators, TopDownTreeIterator } from './tree-iterator';
import { TreeSearch } from './tree-search';
/**
 * The tree model.
 */
export const TreeModel = Symbol('TreeModel');
let TreeModelImpl = class TreeModelImpl {
    tree;
    selectionService;
    expansionService;
    navigationService;
    treeSearch;
    onChangedEmitter = new Emitter();
    onOpenNodeEmitter = new Emitter();
    toDispose = new DisposableCollection();
    get root() {
        return this.tree.root;
    }
    set root(root) {
        this.tree.root = root;
    }
    get onChanged() {
        return this.onChangedEmitter.event;
    }
    get onOpenNode() {
        return this.onOpenNodeEmitter.event;
    }
    get onNodeRefreshed() {
        return this.tree.onNodeRefreshed;
    }
    // tslint:disable-next-line:typedef
    get selectedNodes() {
        return this.selectionService.selectedNodes;
    }
    // tslint:disable-next-line:typedef
    get onSelectionChanged() {
        return this.selectionService.onSelectionChanged;
    }
    get onExpansionChanged() {
        return this.expansionService.onExpansionChanged;
    }
    get onDidChangeBusy() {
        return this.tree.onDidChangeBusy;
    }
    dispose() {
        this.toDispose.dispose();
    }
    getNode(id) {
        return this.tree.getNode(id);
    }
    validateNode(node) {
        return this.tree.validateNode(node);
    }
    async refresh(parent) {
        if (parent) {
            return this.tree.refresh(parent);
        }
        return this.tree.refresh();
    }
    async expandNode(raw) {
        for (const node of raw ? [raw] : this.selectedNodes) {
            if (ExpandableTreeNode.is(node)) {
                return this.expansionService.expandNode(node);
            }
        }
        return undefined;
    }
    async collapseNode(raw) {
        for (const node of raw ? [raw] : this.selectedNodes) {
            if (ExpandableTreeNode.is(node)) {
                return this.expansionService.collapseNode(node);
            }
        }
        return false;
    }
    async collapseAll(raw) {
        const node = raw || this.selectedNodes[0];
        if (SelectableTreeNode.is(node)) {
            this.selectNode(node);
        }
        if (CompositeTreeNode.is(node)) {
            return this.expansionService.collapseAll(node);
        }
        return false;
    }
    async toggleNodeExpansion(raw) {
        for (const node of raw ? [raw] : this.selectedNodes) {
            if (ExpandableTreeNode.is(node)) {
                await this.expansionService.toggleNodeExpansion(node);
                return;
            }
        }
    }
    selectPrevNode(type = TreeSelection.SelectionType.DEFAULT) {
        const node = this.getPrevSelectableNode();
        if (node) {
            this.addSelection({ node, type });
        }
    }
    getPrevSelectableNode(node = this.selectedNodes[0]) {
        const iterator = this.createBackwardIterator(node);
        return iterator && this.doGetNextNode(iterator);
    }
    selectNextNode(type = TreeSelection.SelectionType.DEFAULT) {
        const node = this.getNextSelectableNode();
        if (node) {
            this.addSelection({ node, type });
        }
    }
    getNextSelectableNode(node = this.selectedNodes[0]) {
        const iterator = this.createIterator(node);
        return iterator && this.doGetNextNode(iterator);
    }
    openNode(raw) {
        const node = raw || this.selectedNodes[0];
        if (node) {
            this.doOpenNode(node);
            this.onOpenNodeEmitter.fire(node);
        }
    }
    selectParent() {
        if (this.selectedNodes.length === 1) {
            const node = this.selectedNodes[0];
            const parent = SelectableTreeNode.getVisibleParent(node);
            if (parent) {
                this.selectNode(parent);
            }
        }
    }
    async navigateTo(nodeOrId) {
        if (nodeOrId) {
            const node = typeof nodeOrId === 'string' ? this.getNode(nodeOrId) : nodeOrId;
            if (node) {
                this.navigationService.push(node);
                await this.doNavigate(node);
                return node;
            }
        }
        return undefined;
    }
    canNavigateForward() {
        return !!this.navigationService.next;
    }
    canNavigateBackward() {
        return !!this.navigationService.prev;
    }
    async navigateForward() {
        const node = this.navigationService.advance();
        if (node) {
            await this.doNavigate(node);
        }
    }
    async navigateBackward() {
        const node = this.navigationService.retreat();
        if (node) {
            await this.doNavigate(node);
        }
    }
    addSelection(selectionOrTreeNode) {
        this.selectionService.addSelection(selectionOrTreeNode);
    }
    selectNode(node) {
        this.addSelection(node);
    }
    toggleNode(node) {
        this.addSelection({ node, type: TreeSelection.SelectionType.TOGGLE });
    }
    selectRange(node) {
        this.addSelection({ node, type: TreeSelection.SelectionType.RANGE });
    }
    storeState() {
        return {
            selection: this.selectionService.storeState()
        };
    }
    restoreState(state) {
        if (state.selection) {
            this.selectionService.restoreState(state.selection);
        }
    }
    markAsBusy(node, ms, token) {
        return this.tree.markAsBusy(node, ms, token);
    }
    init() {
        this.toDispose.push(this.tree);
        this.toDispose.push(this.tree.onChanged(() => this.fireChanged()));
        this.toDispose.push(this.selectionService);
        this.toDispose.push(this.expansionService);
        this.toDispose.push(this.expansionService.onExpansionChanged(node => {
            this.fireChanged();
            this.handleExpansion(node);
        }));
        this.toDispose.push(this.onOpenNodeEmitter);
        this.toDispose.push(this.onChangedEmitter);
        this.toDispose.push(this.treeSearch);
    }
    handleExpansion(node) {
        this.selectIfAncestorOfSelected(node);
    }
    /**
     * Select the given node if it is the ancestor of a selected node.
     */
    selectIfAncestorOfSelected(node) {
        if (!node.expanded && [...this.selectedNodes].some(selectedNode => CompositeTreeNode.isAncestor(node, selectedNode))) {
            if (SelectableTreeNode.isVisible(node)) {
                this.selectNode(node);
            }
        }
    }
    fireChanged() {
        this.onChangedEmitter.fire(undefined);
    }
    doGetNextNode(iterator) {
        // Skip the first item. // TODO: clean this up, and skip the first item in a different way without loading everything.
        iterator.next();
        let result = iterator.next();
        while (!result.done && !this.isVisibleSelectableNode(result.value)) {
            result = iterator.next();
        }
        const node = result.value;
        if (SelectableTreeNode.isVisible(node)) {
            return node;
        }
        return undefined;
    }
    isVisibleSelectableNode(node) {
        return SelectableTreeNode.isVisible(node);
    }
    createBackwardIterator(node) {
        const { filteredNodes } = this.treeSearch;
        if (filteredNodes.length === 0) {
            return node ? new BottomUpTreeIterator(node, { pruneCollapsed: true }) : undefined;
        }
        if (node && filteredNodes.indexOf(node) === -1) {
            return undefined;
        }
        return Iterators.cycle(filteredNodes.slice().reverse(), node);
    }
    createIterator(node) {
        const { filteredNodes } = this.treeSearch;
        if (filteredNodes.length === 0) {
            return node ? new TopDownTreeIterator(node, { pruneCollapsed: true }) : undefined;
        }
        if (node && filteredNodes.indexOf(node) === -1) {
            return undefined;
        }
        return Iterators.cycle(filteredNodes, node);
    }
    doOpenNode(node) {
        if (ExpandableTreeNode.is(node)) {
            this.toggleNodeExpansion(node);
        }
    }
    async doNavigate(node) {
        this.tree.root = node;
        if (ExpandableTreeNode.is(node)) {
            await this.expandNode(node);
        }
        if (SelectableTreeNode.is(node)) {
            this.selectNode(node);
        }
    }
};
__decorate([
    inject(Tree)
], TreeModelImpl.prototype, "tree", void 0);
__decorate([
    inject(TreeSelectionService)
], TreeModelImpl.prototype, "selectionService", void 0);
__decorate([
    inject(TreeExpansionService)
], TreeModelImpl.prototype, "expansionService", void 0);
__decorate([
    inject(TreeNavigationService)
], TreeModelImpl.prototype, "navigationService", void 0);
__decorate([
    inject(TreeSearch)
], TreeModelImpl.prototype, "treeSearch", void 0);
__decorate([
    postConstruct()
], TreeModelImpl.prototype, "init", null);
TreeModelImpl = __decorate([
    injectable()
], TreeModelImpl);
export { TreeModelImpl };

//# sourceMappingURL=../../../lib/browser/tree/tree-model.js.map
