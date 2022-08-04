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
import { inject, injectable, optional } from 'inversify';
import { Emitter } from '../../common';
import { QuickInputService } from './quick-input-service';
let QuickPickServiceImpl = class QuickPickServiceImpl {
    quickInputService;
    onDidHideEmitter = new Emitter();
    onDidHide = this.onDidHideEmitter.event;
    onDidChangeValueEmitter = new Emitter();
    onDidChangeValue = this.onDidChangeValueEmitter.event;
    onDidAcceptEmitter = new Emitter();
    onDidAccept = this.onDidAcceptEmitter.event;
    onDidChangeActiveEmitter = new Emitter();
    onDidChangeActive = this.onDidChangeActiveEmitter.event;
    onDidChangeSelectionEmitter = new Emitter();
    onDidChangeSelection = this.onDidChangeSelectionEmitter.event;
    onDidTriggerButtonEmitter = new Emitter();
    onDidTriggerButton = this.onDidTriggerButtonEmitter.event;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items = [];
    async show(items, options) {
        this.items = items;
        const opts = Object.assign({}, options, {
            onDidAccept: () => this.onDidAcceptEmitter.fire(),
            onDidChangeActive: (quickPick, activeItems) => this.onDidChangeActiveEmitter.fire({
                quickPick,
                activeItems
            }),
            onDidChangeSelection: (quickPick, selectedItems) => this.onDidChangeSelectionEmitter.fire({
                quickPick,
                selectedItems
            }),
            onDidChangeValue: (quickPick, filter) => this.onDidChangeValueEmitter.fire({
                quickPick,
                filter
            }),
            onDidHide: () => this.onDidHideEmitter.fire(),
            onDidTriggerButton: (btn) => this.onDidTriggerButtonEmitter.fire(btn),
        });
        return this.quickInputService?.showQuickPick(this.items, opts);
    }
    hide() {
        this.quickInputService?.hide();
    }
    setItems(items) {
        this.items = items;
    }
};
__decorate([
    inject(QuickInputService),
    optional()
], QuickPickServiceImpl.prototype, "quickInputService", void 0);
QuickPickServiceImpl = __decorate([
    injectable()
], QuickPickServiceImpl);
export { QuickPickServiceImpl };

//# sourceMappingURL=../../../lib/browser/quick-input/quick-pick-service-impl.js.map
