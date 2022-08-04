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
import { ContributionFilterRegistry, ContributionType, FilterContribution } from './contribution-filter';
import { Filter } from './filter';
/**
 * Registry of contribution filters.
 *
 * Implement/bind to the `FilterContribution` interface/symbol to register your contribution filters.
 */
export declare class ContributionFilterRegistryImpl implements ContributionFilterRegistry {
    protected initialized: boolean;
    protected genericFilters: Filter<Object>[];
    protected typeToFilters: Map<ContributionType, Filter<Object>[]>;
    constructor(contributions?: FilterContribution[]);
    addFilters(types: '*' | ContributionType[], filters: Filter<Object>[]): void;
    applyFilters<T extends Object>(toFilter: T[], type: ContributionType): T[];
    protected getOrCreate(type: ContributionType): Filter<Object>[];
    protected getFilters(type: ContributionType): Filter<Object>[];
}
