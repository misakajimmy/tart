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
var SourceTreeWidget_1;
import * as React from 'react';
import { injectable, postConstruct } from 'inversify';
import { DisposableCollection } from '../../common/disposable';
import { createTreeContainer, Tree, TreeImpl, TreeWidget } from '../tree';
import { SourceTree, TreeElementNode, TreeSourceNode } from './source-tree';
let SourceTreeWidget = SourceTreeWidget_1 = class SourceTreeWidget extends TreeWidget {
    toDisposeOnSource = new DisposableCollection();
    get source() {
        const root = this.model.root;
        return TreeSourceNode.is(root) ? root.source : undefined;
    }
    set source(source) {
        if (this.source === source) {
            return;
        }
        this.toDisposeOnSource.dispose();
        this.toDispose.push(this.toDisposeOnSource);
        this.model.root = TreeSourceNode.to(source);
        if (source) {
            this.toDisposeOnSource.push(source.onDidChange(() => this.model.refresh()));
        }
    }
    get selectedElement() {
        const node = this.model.selectedNodes[0];
        return TreeElementNode.is(node) && node.element || undefined;
    }
    static createContainer(parent, props) {
        const child = createTreeContainer(parent, props);
        child.unbind(TreeImpl);
        child.bind(SourceTree).toSelf();
        child.rebind(Tree).toService(SourceTree);
        child.unbind(TreeWidget);
        child.bind(SourceTreeWidget_1).toSelf();
        return child;
    }
    storeState() {
        // no-op
        return {};
    }
    restoreState(state) {
        // no-op
    }
    init() {
        super.init();
        this.addClass('tart-source-tree');
        this.toDispose.push(this.model.onOpenNode(node => {
            if (TreeElementNode.is(node) && node.element.open) {
                node.element.open();
            }
        }));
    }
    renderTree(model) {
        if (TreeSourceNode.is(model.root) && model.root.children.length === 0) {
            const { placeholder } = model.root.source;
            if (placeholder) {
                return React.createElement("div", { className: 'tart-tree-source-node-placeholder noselect' }, placeholder);
            }
        }
        return super.renderTree(model);
    }
    renderCaption(node) {
        if (TreeElementNode.is(node)) {
            const classNames = this.createTreeElementNodeClassNames(node);
            return React.createElement("div", { className: classNames.join(' ') }, node.element.render());
        }
        return undefined;
    }
    createTreeElementNodeClassNames(node) {
        return ['tart-tree-element-node'];
    }
    superStoreState() {
        return super.storeState();
    }
    superRestoreState(state) {
        super.restoreState(state);
        return;
    }
};
__decorate([
    postConstruct()
], SourceTreeWidget.prototype, "init", null);
SourceTreeWidget = SourceTreeWidget_1 = __decorate([
    injectable()
], SourceTreeWidget);
export { SourceTreeWidget };

//# sourceMappingURL=../../../lib/browser/source-tree/source-tree-widget.js.map
