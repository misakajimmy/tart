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
import * as React from 'react';
import { Container, interfaces } from 'inversify';
import { DisposableCollection } from '../../common/disposable';
import { TreeModel, TreeNode, TreeProps, TreeWidget } from '../tree';
import { TreeElement, TreeSource } from './tree-source';
import { TreeElementNode } from './source-tree';
export declare class SourceTreeWidget extends TreeWidget {
    protected readonly toDisposeOnSource: DisposableCollection;
    get source(): TreeSource | undefined;
    set source(source: TreeSource | undefined);
    get selectedElement(): TreeElement | undefined;
    static createContainer(parent: interfaces.Container, props?: Partial<TreeProps>): Container;
    storeState(): object;
    restoreState(state: object): void;
    protected init(): void;
    protected renderTree(model: TreeModel): React.ReactNode;
    protected renderCaption(node: TreeNode): React.ReactNode;
    protected createTreeElementNodeClassNames(node: TreeElementNode): string[];
    protected superStoreState(): object;
    protected superRestoreState(state: object): void;
}
