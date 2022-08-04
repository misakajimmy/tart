/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
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
import { Widget } from '@lumino/widgets';
import { BaseWidget } from '../widgets';
import { Emitter } from '../../common';
export class SidePanelToolbar extends BaseWidget {
    tabBarToolbarRegistry;
    tabBarToolbarFactory;
    side;
    titleContainer;
    toolbar;
    onContextMenuEmitter = new Emitter();
    onContextMenu = this.onContextMenuEmitter.event;
    constructor(tabBarToolbarRegistry, tabBarToolbarFactory, side) {
        super();
        this.tabBarToolbarRegistry = tabBarToolbarRegistry;
        this.tabBarToolbarFactory = tabBarToolbarFactory;
        this.side = side;
        this.toDispose.push(this.onContextMenuEmitter);
        this.init();
        this.tabBarToolbarRegistry.onDidChange(() => this.update());
    }
    _toolbarTitle;
    set toolbarTitle(title) {
        if (this.titleContainer && title) {
            this._toolbarTitle = title;
            this.titleContainer.innerText = this._toolbarTitle.label;
            this.titleContainer.title = this._toolbarTitle.caption || this._toolbarTitle.label;
            this.update();
        }
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    showMoreContextMenu(anchor) {
        if (this.toolbar) {
            return this.toolbar.renderMoreContextMenu(anchor);
        }
        throw new Error(this.id + ' widget is not attached');
    }
    onBeforeAttach(msg) {
        super.onBeforeAttach(msg);
        if (this.titleContainer) {
            this.addEventListener(this.titleContainer, 'contextmenu', e => this.onContextMenuEmitter.fire(e));
        }
    }
    onAfterAttach(msg) {
        if (this.toolbar) {
            if (this.toolbar.isAttached) {
                Widget.detach(this.toolbar);
            }
            Widget.attach(this.toolbar, this.node);
        }
        super.onAfterAttach(msg);
    }
    onBeforeDetach(msg) {
        if (this.titleContainer) {
            this.node.removeChild(this.titleContainer);
        }
        if (this.toolbar && this.toolbar.isAttached) {
            Widget.detach(this.toolbar);
        }
        super.onBeforeDetach(msg);
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        this.updateToolbar();
    }
    updateToolbar() {
        if (!this.toolbar) {
            return;
        }
        const widget = this._toolbarTitle?.owner ?? undefined;
        this.toolbar.updateTarget(widget);
    }
    init() {
        this.titleContainer = document.createElement('div');
        this.titleContainer.classList.add('tart-sidepanel-title');
        this.titleContainer.classList.add('noWrapInfo');
        this.titleContainer.classList.add('noselect');
        this.node.appendChild(this.titleContainer);
        this.node.classList.add('tart-sidepanel-toolbar');
        this.node.classList.add(`tart-${this.side}-side-panel`);
        this.toolbar = this.tabBarToolbarFactory();
        this.update();
    }
}

//# sourceMappingURL=../../../lib/browser/shell/side-panel-toolbar.js.map
