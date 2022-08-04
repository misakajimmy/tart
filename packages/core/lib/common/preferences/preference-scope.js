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
/* eslint-disable @typescript-eslint/no-explicit-any */
export var PreferenceScope;
(function (PreferenceScope) {
    PreferenceScope[PreferenceScope["Default"] = 0] = "Default";
    // User,
    // Workspace,
    // Folder
})(PreferenceScope || (PreferenceScope = {}));
(function (PreferenceScope) {
    function is(scope) {
        return typeof scope === 'number' && getScopes().findIndex(s => s === scope) >= 0;
    }
    PreferenceScope.is = is;
    /**
     * @returns preference scopes from broadest to narrowest: Default -> Folder.
     */
    function getScopes() {
        return Object.keys(PreferenceScope)
            .filter(k => typeof PreferenceScope[k] === 'string')
            .map(v => Number(v));
    }
    PreferenceScope.getScopes = getScopes;
    /**
     * @returns preference scopes from narrowest to broadest. Folder -> Default.
     */
    function getReversedScopes() {
        return getScopes().reverse();
    }
    PreferenceScope.getReversedScopes = getReversedScopes;
    function getScopeNames(scope) {
        const names = [];
        const allNames = Object.keys(PreferenceScope)
            .filter(k => typeof PreferenceScope[k] === 'number');
        if (scope) {
            for (const name of allNames) {
                if (PreferenceScope[name] <= scope) {
                    names.push(name);
                }
            }
        }
        return names;
    }
    PreferenceScope.getScopeNames = getScopeNames;
    function fromString(strScope) {
        switch (strScope) {
            // case 'application':
            //     return PreferenceScope.User;
            // case 'window':
            //     return PreferenceScope.Folder;
            // case 'resource':
            //     return PreferenceScope.Folder;
            // case 'language-overridable':
            //     return PreferenceScope.Folder;
        }
        return PreferenceScope.Default;
    }
    PreferenceScope.fromString = fromString;
})(PreferenceScope || (PreferenceScope = {}));

//# sourceMappingURL=../../../lib/common/preferences/preference-scope.js.map
