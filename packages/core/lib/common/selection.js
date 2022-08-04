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
import URI from './uri';
export var UriSelection;
(function (UriSelection) {
    function is(arg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeof arg === 'object' && ('uri' in arg) && arg['uri'] instanceof URI;
    }
    UriSelection.is = is;
    function getUri(selection) {
        if (is(selection)) {
            return selection.uri;
        }
        if (Array.isArray(selection) && is(selection[0])) {
            return selection[0].uri;
        }
        return undefined;
    }
    UriSelection.getUri = getUri;
    function getUris(selection) {
        if (is(selection)) {
            return [selection.uri];
        }
        if (Array.isArray(selection)) {
            return selection.filter(is).map(s => s.uri);
        }
        return [];
    }
    UriSelection.getUris = getUris;
})(UriSelection || (UriSelection = {}));

//# sourceMappingURL=../../lib/common/selection.js.map
