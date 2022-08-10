/********************************************************************************
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and others.
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
var QuickViewService_1;
import { inject, injectable } from 'inversify';
import { Disposable } from '../../common';
import { ContextKeyService } from '../context-key-service';
import { QuickAccessRegistry } from './quick-access';
import { filterItems } from '../../common/quick-pick-service';
let QuickViewService = QuickViewService_1 = class QuickViewService {
    static PREFIX = 'view ';
    items = [];
    quickAccessRegistry;
    contextKexService;
    hiddenItemLabels = new Set();
    registerItem(item) {
        const quickOpenItem = {
            label: item.label,
            execute: () => item.open(),
            when: item.when
        };
        this.items.push(quickOpenItem);
        this.items.sort((a, b) => a.label.localeCompare(b.label));
        return Disposable.create(() => {
            const index = this.items.indexOf(quickOpenItem);
            if (index !== -1) {
                this.items.splice(index, 1);
            }
        });
    }
    hideItem(label) {
        this.hiddenItemLabels.add(label);
    }
    showItem(label) {
        this.hiddenItemLabels.delete(label);
    }
    registerQuickAccessProvider() {
        this.quickAccessRegistry.registerQuickAccessProvider({
            getInstance: () => this,
            prefix: QuickViewService_1.PREFIX,
            placeholder: '',
            helpEntries: [{ description: 'Open View', needsEditor: false }]
        });
    }
    getPicks(filter, token) {
        const items = this.items.filter(item => (item.when === undefined || this.contextKexService.match(item.when)) &&
            (!this.hiddenItemLabels.has(item.label)));
        return filterItems(items, filter);
    }
};
__decorate([
    inject(QuickAccessRegistry)
], QuickViewService.prototype, "quickAccessRegistry", void 0);
__decorate([
    inject(ContextKeyService)
], QuickViewService.prototype, "contextKexService", void 0);
QuickViewService = QuickViewService_1 = __decorate([
    injectable()
], QuickViewService);
export { QuickViewService };

//# sourceMappingURL=../../../lib/browser/quick-input/quick-view-service.js.map
