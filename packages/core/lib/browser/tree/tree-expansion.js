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
import { CompositeTreeNode, Tree } from './tree';
export const TreeExpansionService = Symbol('TreeExpansionService');
export var ExpandableTreeNode;
(function (ExpandableTreeNode) {
    function is(node) {
        return !!node && CompositeTreeNode.is(node) && 'expanded' in node;
    }
    ExpandableTreeNode.is = is;
    function isExpanded(node) {
        return ExpandableTreeNode.is(node) && node.expanded;
    }
    ExpandableTreeNode.isExpanded = isExpanded;
    function isCollapsed(node) {
        return ExpandableTreeNode.is(node) && !node.expanded;
    }
    ExpandableTreeNode.isCollapsed = isCollapsed;
})(ExpandableTreeNode || (ExpandableTreeNode = {}));
let TreeExpansionServiceImpl = class TreeExpansionServiceImpl {
    tree;
    onExpansionChangedEmitter = new Emitter();
    get onExpansionChanged() {
        return this.onExpansionChangedEmitter.event;
    }
    dispose() {
        this.onExpansionChangedEmitter.dispose();
    }
    async expandNode(raw) {
        const node = this.tree.validateNode(raw);
        if (ExpandableTreeNode.isCollapsed(node)) {
            return this.doExpandNode(node);
        }
        return undefined;
    }
    async collapseNode(raw) {
        const node = this.tree.validateNode(raw);
        return this.doCollapseNode(node);
    }
    async collapseAll(raw) {
        const node = this.tree.validateNode(raw);
        return this.doCollapseAll(node);
    }
    async toggleNodeExpansion(node) {
        if (node.expanded) {
            await this.collapseNode(node);
        }
        else {
            await this.expandNode(node);
        }
    }
    init() {
        this.tree.onNodeRefreshed(node => {
            for (const child of node.children) {
                if (ExpandableTreeNode.isExpanded(child)) {
                    node.waitUntil(this.tree.refresh(child));
                }
            }
        });
    }
    fireExpansionChanged(node) {
        this.onExpansionChangedEmitter.fire(node);
    }
    async doExpandNode(node) {
        const refreshed = await this.tree.refresh(node);
        if (ExpandableTreeNode.is(refreshed)) {
            refreshed.expanded = true;
            this.fireExpansionChanged(refreshed);
            return refreshed;
        }
        return undefined;
    }
    doCollapseAll(node) {
        let result = false;
        if (CompositeTreeNode.is(node)) {
            for (const child of node.children) {
                result = this.doCollapseAll(child) || result;
            }
        }
        return this.doCollapseNode(node) || result;
    }
    doCollapseNode(node) {
        if (!ExpandableTreeNode.isExpanded(node)) {
            return false;
        }
        node.expanded = false;
        this.fireExpansionChanged(node);
        return true;
    }
};
__decorate([
    inject(Tree)
], TreeExpansionServiceImpl.prototype, "tree", void 0);
__decorate([
    postConstruct()
], TreeExpansionServiceImpl.prototype, "init", null);
TreeExpansionServiceImpl = __decorate([
    injectable()
], TreeExpansionServiceImpl);
export { TreeExpansionServiceImpl };

//# sourceMappingURL=../../../lib/browser/tree/tree-expansion.js.map
