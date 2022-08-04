/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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
import { debounce } from 'lodash';
import { inject, injectable, named } from 'inversify';
import { ContributionProvider, Emitter } from '../../common';
export const TabBarDecorator = Symbol('TabBarDecorator');
let TabBarDecoratorService = class TabBarDecoratorService {
    onDidChangeDecorationsEmitter = new Emitter();
    onDidChangeDecorations = this.onDidChangeDecorationsEmitter.event;
    fireDidChangeDecorations = debounce(() => this.onDidChangeDecorationsEmitter.fire(undefined), 150);
    contributions;
    initialize() {
        this.contributions.getContributions().map(decorator => decorator.onDidChangeDecorations(this.fireDidChangeDecorations));
    }
    /**
     * Assign tabs the decorators provided by all the contributions.
     * @param {Title<Widget>} title the title
     * @returns an array of its decoration data.
     */
    getDecorations(title) {
        const decorators = this.contributions.getContributions();
        let all = [];
        for (const decorator of decorators) {
            const decorations = decorator.decorate(title);
            all = all.concat(decorations);
        }
        return all;
    }
};
__decorate([
    inject(ContributionProvider),
    named(TabBarDecorator)
], TabBarDecoratorService.prototype, "contributions", void 0);
TabBarDecoratorService = __decorate([
    injectable()
], TabBarDecoratorService);
export { TabBarDecoratorService };

//# sourceMappingURL=../../../lib/browser/shell/tab-bar-decorator.js.map
