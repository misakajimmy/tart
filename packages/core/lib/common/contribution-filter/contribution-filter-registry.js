/********************************************************************************
 * Copyright (C) 2021 STMicroelectronics and others.
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
import { injectable, multiInject, optional } from 'inversify';
import { FilterContribution } from './contribution-filter';
/**
 * Registry of contribution filters.
 *
 * Implement/bind to the `FilterContribution` interface/symbol to register your contribution filters.
 */
let ContributionFilterRegistryImpl = class ContributionFilterRegistryImpl {
    initialized = false;
    genericFilters = [];
    typeToFilters = new Map();
    constructor(contributions = []) {
        for (const contribution of contributions) {
            contribution.registerContributionFilters(this);
        }
        this.initialized = true;
    }
    addFilters(types, filters) {
        if (this.initialized) {
            throw new Error('cannot add filters after initialization is done.');
        }
        else if (types === '*') {
            this.genericFilters.push(...filters);
        }
        else {
            for (const type of types) {
                this.getOrCreate(type).push(...filters);
            }
        }
    }
    applyFilters(toFilter, type) {
        const filters = this.getFilters(type);
        if (filters.length === 0) {
            return toFilter;
        }
        return toFilter.filter(object => filters.every(filter => filter(object)));
    }
    getOrCreate(type) {
        let value = this.typeToFilters.get(type);
        if (value === undefined) {
            this.typeToFilters.set(type, value = []);
        }
        return value;
    }
    getFilters(type) {
        return [
            ...this.typeToFilters.get(type) || [],
            ...this.genericFilters
        ];
    }
};
ContributionFilterRegistryImpl = __decorate([
    injectable(),
    __param(0, multiInject(FilterContribution)),
    __param(0, optional())
], ContributionFilterRegistryImpl);
export { ContributionFilterRegistryImpl };

//# sourceMappingURL=../../../lib/common/contribution-filter/contribution-filter-registry.js.map
