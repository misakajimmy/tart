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
import { PreferenceSchemaProperties } from '../../common/preferences/preference-schema';
export interface OverridePreferenceName {
    preferenceName: string;
    overrideIdentifier: string;
}
export declare namespace OverridePreferenceName {
    function is(arg: any): arg is OverridePreferenceName;
}
export declare const OVERRIDE_PROPERTY_PATTERN: RegExp;
export declare const getOverridePattern: (identifier: string) => string;
export declare class PreferenceLanguageOverrideService {
    protected readonly overrideIdentifiers: Set<string>;
    testOverrideValue(name: string, value: any): value is PreferenceSchemaProperties;
    overridePreferenceName({ preferenceName, overrideIdentifier }: OverridePreferenceName): string;
    overriddenPreferenceName(name: string): OverridePreferenceName | undefined;
    computeOverridePatternPropertiesKey(): string | undefined;
    getOverridePreferenceNames(preferenceName: string): IterableIterator<string>;
    /**
     * @param overrideIdentifier
     * @returns true if the addition caused a change, i.e. if the identifier was not already present in the set of identifiers, false otherwise.
     */
    addOverrideIdentifier(overrideIdentifier: string): boolean;
    /**
     * @param overrideIdentifier
     * @returns true if the deletion caused a change, i.e. if the identifier was present in the set, false otherwise.
     */
    removeOverrideIdentifier(overrideIdentifier: string): boolean;
}
