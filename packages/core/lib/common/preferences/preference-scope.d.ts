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
export declare enum PreferenceScope {
    Default = 0
}
export declare namespace PreferenceScope {
    function is(scope: any): scope is PreferenceScope;
    /**
     * @returns preference scopes from broadest to narrowest: Default -> Folder.
     */
    function getScopes(): PreferenceScope[];
    /**
     * @returns preference scopes from narrowest to broadest. Folder -> Default.
     */
    function getReversedScopes(): PreferenceScope[];
    function getScopeNames(scope?: PreferenceScope): string[];
    function fromString(strScope: string): PreferenceScope | undefined;
}
