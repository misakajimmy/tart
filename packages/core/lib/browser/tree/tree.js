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
import { injectable } from 'inversify';
import { CancellationTokenSource, DisposableCollection, Emitter, WaitUntilEvent } from '../../common';
import { timeout } from '../../common/promise-util';
export const Tree = Symbol('Tree');
export var TreeNode;
(function (TreeNode) {
    function is(node) {
        return !!node && typeof node === 'object' && 'id' in node && 'parent' in node;
    }
    TreeNode.is = is;
    function equals(left, right) {
        return left === right || (!!left && !!right && left.id === right.id);
    }
    TreeNode.equals = equals;
    function isVisible(node) {
        return !!node && (node.visible === undefined || node.visible);
    }
    TreeNode.isVisible = isVisible;
})(TreeNode || (TreeNode = {}));
export var CompositeTreeNode;
(function (CompositeTreeNode) {
    function is(node) {
        return !!node && 'children' in node;
    }
    CompositeTreeNode.is = is;
    function getFirstChild(parent) {
        return parent.children[0];
    }
    CompositeTreeNode.getFirstChild = getFirstChild;
    function getLastChild(parent) {
        return parent.children[parent.children.length - 1];
    }
    CompositeTreeNode.getLastChild = getLastChild;
    function isAncestor(parent, child) {
        if (!child) {
            return false;
        }
        if (TreeNode.equals(parent, child.parent)) {
            return true;
        }
        return isAncestor(parent, child.parent);
    }
    CompositeTreeNode.isAncestor = isAncestor;
    function indexOf(parent, node) {
        if (!node) {
            return -1;
        }
        return parent.children.findIndex(child => TreeNode.equals(node, child));
    }
    CompositeTreeNode.indexOf = indexOf;
    function addChildren(parent, children) {
        for (const child of children) {
            addChild(parent, child);
        }
        return parent;
    }
    CompositeTreeNode.addChildren = addChildren;
    function addChild(parent, child) {
        const children = parent.children;
        const index = children.findIndex(value => value.id === child.id);
        if (index !== -1) {
            children.splice(index, 1, child);
            setParent(child, index, parent);
        }
        else {
            children.push(child);
            setParent(child, parent.children.length - 1, parent);
        }
        return parent;
    }
    CompositeTreeNode.addChild = addChild;
    function removeChild(parent, child) {
        const children = parent.children;
        const index = children.findIndex(value => value.id === child.id);
        if (index === -1) {
            return;
        }
        children.splice(index, 1);
        const { previousSibling, nextSibling } = child;
        if (previousSibling) {
            Object.assign(previousSibling, { nextSibling });
        }
        if (nextSibling) {
            Object.assign(nextSibling, { previousSibling });
        }
    }
    CompositeTreeNode.removeChild = removeChild;
    function setParent(child, index, parent) {
        const previousSibling = parent.children[index - 1];
        const nextSibling = parent.children[index + 1];
        Object.assign(child, { parent, previousSibling, nextSibling });
        if (previousSibling) {
            Object.assign(previousSibling, { nextSibling: child });
        }
        if (nextSibling) {
            Object.assign(nextSibling, { previousSibling: child });
        }
    }
    CompositeTreeNode.setParent = setParent;
})(CompositeTreeNode || (CompositeTreeNode = {}));
/**
 * A default implementation of the tree.
 */
let TreeImpl = class TreeImpl {
    onChangedEmitter = new Emitter();
    onNodeRefreshedEmitter = new Emitter();
    toDispose = new DisposableCollection();
    onDidChangeBusyEmitter = new Emitter();
    onDidChangeBusy = this.onDidChangeBusyEmitter.event;
    nodes = {};
    constructor() {
        this.toDispose.push(this.onChangedEmitter);
        this.toDispose.push(this.onNodeRefreshedEmitter);
        this.toDispose.push(this.onDidChangeBusyEmitter);
    }
    _root;
    get root() {
        return this._root;
    }
    set root(root) {
        this.nodes = {};
        this._root = root;
        this.addNode(root);
        this.refresh();
    }
    get onChanged() {
        return this.onChangedEmitter.event;
    }
    get onNodeRefreshed() {
        return this.onNodeRefreshedEmitter.event;
    }
    dispose() {
        this.nodes = {};
        this.toDispose.dispose();
    }
    getNode(id) {
        return id !== undefined ? this.nodes[id] : undefined;
    }
    validateNode(node) {
        const id = !!node ? node.id : undefined;
        return this.getNode(id);
    }
    async refresh(raw) {
        const parent = !raw ? this._root : this.validateNode(raw);
        let result;
        if (CompositeTreeNode.is(parent)) {
            const busySource = new CancellationTokenSource();
            this.doMarkAsBusy(parent, 800, busySource.token);
            try {
                result = parent;
                const children = await this.resolveChildren(parent);
                result = await this.setChildren(parent, children);
            }
            finally {
                busySource.cancel();
            }
        }
        this.fireChanged();
        return result;
    }
    async markAsBusy(raw, ms, token) {
        const node = this.validateNode(raw);
        if (node) {
            await this.doMarkAsBusy(node, ms, token);
        }
    }
    fireChanged() {
        this.onChangedEmitter.fire(undefined);
    }
    async fireNodeRefreshed(parent) {
        await WaitUntilEvent.fire(this.onNodeRefreshedEmitter, parent);
        this.fireChanged();
    }
    resolveChildren(parent) {
        return Promise.resolve(Array.from(parent.children));
    }
    async setChildren(parent, children) {
        const root = this.getRootNode(parent);
        if (this.nodes[root.id] && this.nodes[root.id] !== root) {
            console.error(`Child node '${parent.id}' does not belong to this '${root.id}' tree.`);
            return undefined;
        }
        this.removeNode(parent);
        parent.children = children;
        this.addNode(parent);
        await this.fireNodeRefreshed(parent);
        return parent;
    }
    removeNode(node) {
        if (CompositeTreeNode.is(node)) {
            node.children.forEach(child => this.removeNode(child));
        }
        if (node) {
            delete this.nodes[node.id];
        }
    }
    getRootNode(node) {
        if (node.parent === undefined) {
            return node;
        }
        else {
            return this.getRootNode(node.parent);
        }
    }
    addNode(node) {
        if (node) {
            this.nodes[node.id] = node;
        }
        if (CompositeTreeNode.is(node)) {
            const { children } = node;
            children.forEach((child, index) => {
                CompositeTreeNode.setParent(child, index, node);
                this.addNode(child);
            });
        }
    }
    async doMarkAsBusy(node, ms, token) {
        try {
            await timeout(ms, token);
            this.doSetBusy(node);
            token.onCancellationRequested(() => this.doResetBusy(node));
        }
        catch {
            /* no-op */
        }
    }
    doSetBusy(node) {
        const oldBusy = node.busy || 0;
        node.busy = oldBusy + 1;
        if (oldBusy === 0) {
            this.onDidChangeBusyEmitter.fire(node);
        }
    }
    doResetBusy(node) {
        const oldBusy = node.busy || 0;
        if (oldBusy > 0) {
            node.busy = oldBusy - 1;
            if (node.busy === 0) {
                this.onDidChangeBusyEmitter.fire(node);
            }
        }
    }
};
TreeImpl = __decorate([
    injectable()
], TreeImpl);
export { TreeImpl };

//# sourceMappingURL=../../../lib/browser/tree/tree.js.map
