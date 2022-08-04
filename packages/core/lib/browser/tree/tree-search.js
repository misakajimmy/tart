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
import { inject, injectable, postConstruct } from 'inversify';
import { DisposableCollection } from '../../common/disposable';
import { Emitter } from '../../common';
import { Tree } from './tree';
import { FuzzySearch } from './fuzzy-search';
import { TopDownTreeIterator } from './tree-iterator';
import { LabelProvider } from '../label-provider';
let TreeSearch = class TreeSearch {
    tree;
    fuzzySearch;
    labelProvider;
    disposables = new DisposableCollection();
    filteredNodesEmitter = new Emitter();
    _filterResult = [];
    _filteredNodesAndParents = new Set();
    _filteredNodes = [];
    /**
     * Returns with the filtered nodes after invoking the `filter` method.
     */
    get filteredNodes() {
        return this._filteredNodes.slice();
    }
    /**
     * Event that is fired when the filtered nodes have been changed.
     */
    get onFilteredNodesChanged() {
        return this.filteredNodesEmitter.event;
    }
    getHighlights() {
        return new Map(this._filterResult.map(m => [m.item.id, this.toCaptionHighlight(m)]));
    }
    /**
     * Resolves to all the visible tree nodes that match the search pattern.
     */
    async filter(pattern) {
        const { root } = this.tree;
        this._filteredNodesAndParents = new Set();
        if (!pattern || !root) {
            this._filterResult = [];
            this._filteredNodes = [];
            this.fireFilteredNodesChanged(this._filteredNodes);
            return [];
        }
        const items = [...new TopDownTreeIterator(root)];
        const transform = (node) => this.labelProvider.getName(node);
        this._filterResult = await this.fuzzySearch.filter({
            items,
            pattern,
            transform
        });
        this._filteredNodes = this._filterResult.map(({ item }) => {
            this.addAllParentsToFilteredSet(item);
            return item;
        });
        this.fireFilteredNodesChanged(this._filteredNodes);
        return this._filteredNodes.slice();
    }
    passesFilters(node) {
        return this._filteredNodesAndParents.has(node.id);
    }
    dispose() {
        this.disposables.dispose();
    }
    init() {
        this.disposables.push(this.filteredNodesEmitter);
    }
    addAllParentsToFilteredSet(node) {
        let toAdd = node;
        while (toAdd && !this._filteredNodesAndParents.has(toAdd.id)) {
            this._filteredNodesAndParents.add(toAdd.id);
            toAdd = toAdd.parent;
        }
    }
    fireFilteredNodesChanged(nodes) {
        this.filteredNodesEmitter.fire(nodes);
    }
    toCaptionHighlight(match) {
        return {
            ranges: match.ranges.map(this.mapRange.bind(this))
        };
    }
    mapRange(range) {
        const { offset, length } = range;
        return {
            offset,
            length
        };
    }
};
__decorate([
    inject(Tree)
], TreeSearch.prototype, "tree", void 0);
__decorate([
    inject(FuzzySearch)
], TreeSearch.prototype, "fuzzySearch", void 0);
__decorate([
    inject(LabelProvider)
], TreeSearch.prototype, "labelProvider", void 0);
__decorate([
    postConstruct()
], TreeSearch.prototype, "init", null);
TreeSearch = __decorate([
    injectable()
], TreeSearch);
export { TreeSearch };

//# sourceMappingURL=../../../lib/browser/tree/tree-search.js.map
