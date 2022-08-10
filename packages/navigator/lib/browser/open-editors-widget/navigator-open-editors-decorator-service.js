/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
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
import { AbstractTreeDecoratorService } from '@tart/core/lib/browser/tree/tree-decorator';
import { ContributionProvider } from '@tart/core/lib/common';
export const OpenEditorsTreeDecorator = Symbol('OpenEditorsTreeDecorator');
let OpenEditorsTreeDecoratorService = class OpenEditorsTreeDecoratorService extends AbstractTreeDecoratorService {
    constructor(contributions) {
        super(contributions.getContributions());
        this.contributions = contributions;
    }
};
OpenEditorsTreeDecoratorService = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(OpenEditorsTreeDecorator))
], OpenEditorsTreeDecoratorService);
export { OpenEditorsTreeDecoratorService };

//# sourceMappingURL=../../../lib/browser/open-editors-widget/navigator-open-editors-decorator-service.js.map
