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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '@tart/core/lib/common/contribution-provider';
import { AbstractTreeDecoratorService } from '@tart/core/lib/browser/tree/tree-decorator';
/**
 * Symbol for all decorators that would like to contribute into the navigator.
 */
export const NavigatorTreeDecorator = Symbol('NavigatorTreeDecorator');
/**
 * Decorator service for the navigator.
 */
let NavigatorDecoratorService = class NavigatorDecoratorService extends AbstractTreeDecoratorService {
    constructor(contributions) {
        super(contributions.getContributions());
        this.contributions = contributions;
    }
};
NavigatorDecoratorService = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(NavigatorTreeDecorator))
], NavigatorDecoratorService);
export { NavigatorDecoratorService };

//# sourceMappingURL=../../lib/browser/navigator-decorator-service.js.map
