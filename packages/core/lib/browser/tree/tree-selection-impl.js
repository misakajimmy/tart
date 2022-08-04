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
import { Tree } from './tree';
import { Emitter } from '../../common';
import { TreeSelectionState } from './tree-selection-state';
import { SelectableTreeNode, TreeSelection } from './tree-selection';
let TreeSelectionServiceImpl = class TreeSelectionServiceImpl {
    tree;
    onSelectionChangedEmitter = new Emitter();
    state;
    get selectedNodes() {
        return this.state.selection();
    }
    get onSelectionChanged() {
        return this.onSelectionChangedEmitter.event;
    }
    dispose() {
        this.onSelectionChangedEmitter.dispose();
    }
    addSelection(selectionOrTreeNode) {
        const selection = ((arg) => {
            const type = TreeSelection.SelectionType.DEFAULT;
            if (TreeSelection.is(arg)) {
                return {
                    type,
                    ...arg
                };
            }
            return {
                type,
                node: arg
            };
        })(selectionOrTreeNode);
        const node = this.validateNode(selection.node);
        if (node === undefined) {
            return;
        }
        Object.assign(selection, { node });
        const newState = this.state.nextState(selection);
        this.transiteTo(newState);
    }
    storeState() {
        return {
            selectionStack: this.state.selectionStack.map(s => ({
                focus: s.focus && s.focus.id || undefined,
                node: s.node && s.node.id || undefined,
                type: s.type
            }))
        };
    }
    restoreState(state) {
        const selectionStack = [];
        for (const selection of state.selectionStack) {
            const node = selection.node && this.tree.getNode(selection.node) || undefined;
            if (!SelectableTreeNode.is(node)) {
                break;
            }
            const focus = selection.focus && this.tree.getNode(selection.focus) || undefined;
            selectionStack.push({
                node,
                focus: SelectableTreeNode.is(focus) && focus || undefined,
                type: selection.type
            });
        }
        if (selectionStack.length) {
            this.transiteTo(new TreeSelectionState(this.tree, selectionStack));
        }
    }
    init() {
        this.state = new TreeSelectionState(this.tree);
    }
    fireSelectionChanged() {
        this.onSelectionChangedEmitter.fire(this.state.selection());
    }
    transiteTo(newState) {
        const oldNodes = this.state.selection();
        const newNodes = newState.selection();
        const toUnselect = this.difference(oldNodes, newNodes);
        const toSelect = this.difference(newNodes, oldNodes);
        this.unselect(toUnselect);
        this.select(toSelect);
        this.removeFocus(oldNodes, newNodes);
        this.addFocus(newState.focus);
        this.state = newState;
        this.fireSelectionChanged();
    }
    unselect(nodes) {
        nodes.forEach(node => node.selected = false);
    }
    select(nodes) {
        nodes.forEach(node => node.selected = true);
    }
    removeFocus(...nodes) {
        nodes.forEach(node => node.forEach(n => n.focus = false));
    }
    addFocus(node) {
        if (node) {
            node.focus = true;
        }
    }
    /**
     * Returns an array of the difference of two arrays. The returned array contains all elements that are contained by
     * `left` and not contained by `right`. `right` may also contain elements not present in `left`: these are simply ignored.
     */
    difference(left, right) {
        return left.filter(item => right.indexOf(item) === -1);
    }
    /**
     * Returns a reference to the argument if the node exists in the tree. Otherwise, `undefined`.
     */
    validateNode(node) {
        const result = this.tree.validateNode(node);
        return SelectableTreeNode.is(result) ? result : undefined;
    }
};
__decorate([
    inject(Tree)
], TreeSelectionServiceImpl.prototype, "tree", void 0);
__decorate([
    postConstruct()
], TreeSelectionServiceImpl.prototype, "init", null);
TreeSelectionServiceImpl = __decorate([
    injectable()
], TreeSelectionServiceImpl);
export { TreeSelectionServiceImpl };

//# sourceMappingURL=../../../lib/browser/tree/tree-selection-impl.js.map
