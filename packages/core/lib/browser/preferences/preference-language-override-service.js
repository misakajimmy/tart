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
import { injectable } from 'inversify';
import { escapeRegExpCharacters } from '../../common';
import { PreferenceSchemaProperties } from '../../common/preferences/preference-schema';
export var OverridePreferenceName;
(function (OverridePreferenceName) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && typeof arg === 'object' && 'preferenceName' in arg && 'overrideIdentifier' in arg;
    }
    OverridePreferenceName.is = is;
})(OverridePreferenceName || (OverridePreferenceName = {}));
const OVERRIDE_PROPERTY = '\\[(.*)\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);
export const getOverridePattern = (identifier) => `\\[(${identifier})\\]$`;
let PreferenceLanguageOverrideService = class PreferenceLanguageOverrideService {
    overrideIdentifiers = new Set();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testOverrideValue(name, value) {
        return PreferenceSchemaProperties.is(value) && OVERRIDE_PROPERTY_PATTERN.test(name);
    }
    overridePreferenceName({ preferenceName, overrideIdentifier }) {
        return `[${overrideIdentifier}].${preferenceName}`;
    }
    overriddenPreferenceName(name) {
        const index = name.indexOf('.');
        if (index === -1) {
            return undefined;
        }
        const matches = name.substr(0, index).match(OVERRIDE_PROPERTY_PATTERN);
        const overrideIdentifier = matches && matches[1];
        if (!overrideIdentifier || !this.overrideIdentifiers.has(overrideIdentifier)) {
            return undefined;
        }
        const preferenceName = name.substr(index + 1);
        return { preferenceName, overrideIdentifier };
    }
    computeOverridePatternPropertiesKey() {
        let param = '';
        for (const overrideIdentifier of this.overrideIdentifiers) {
            if (param.length) {
                param += '|';
            }
            param += new RegExp(escapeRegExpCharacters(overrideIdentifier)).source;
        }
        return param.length ? getOverridePattern(param) : undefined;
    }
    *getOverridePreferenceNames(preferenceName) {
        for (const overrideIdentifier of this.overrideIdentifiers) {
            yield this.overridePreferenceName({ preferenceName, overrideIdentifier });
        }
    }
    /**
     * @param overrideIdentifier
     * @returns true if the addition caused a change, i.e. if the identifier was not already present in the set of identifiers, false otherwise.
     */
    addOverrideIdentifier(overrideIdentifier) {
        const alreadyPresent = this.overrideIdentifiers.has(overrideIdentifier);
        if (!alreadyPresent) {
            this.overrideIdentifiers.add(overrideIdentifier);
        }
        return !alreadyPresent;
    }
    /**
     * @param overrideIdentifier
     * @returns true if the deletion caused a change, i.e. if the identifier was present in the set, false otherwise.
     */
    removeOverrideIdentifier(overrideIdentifier) {
        return this.overrideIdentifiers.delete(overrideIdentifier);
    }
};
PreferenceLanguageOverrideService = __decorate([
    injectable()
], PreferenceLanguageOverrideService);
export { PreferenceLanguageOverrideService };

//# sourceMappingURL=../../../lib/browser/preferences/preference-language-override-service.js.map
