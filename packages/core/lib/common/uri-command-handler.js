/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
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
import { UriSelection } from '../common/selection';
import URI from './uri';
export class UriAwareCommandHandler {
    selectionService;
    handler;
    options;
    /**
     * @deprecated since 1.6.0. Please use `UriAwareCommandHandler.MonoSelect` or `UriAwareCommandHandler.MultiSelect`.
     */
    constructor(selectionService, handler, options) {
        this.selectionService = selectionService;
        this.handler = handler;
        this.options = options;
    }
    execute(...args) {
        const [uri, ...others] = this.getArgsWithUri(...args);
        return uri ? this.handler.execute(uri, ...others) : undefined;
    }
    isVisible(...args) {
        const [uri, ...others] = this.getArgsWithUri(...args);
        if (uri) {
            if (this.handler.isVisible) {
                return this.handler.isVisible(uri, ...others);
            }
            return true;
        }
        return false;
    }
    isEnabled(...args) {
        const [uri, ...others] = this.getArgsWithUri(...args);
        if (uri) {
            if (this.handler.isEnabled) {
                return this.handler.isEnabled(uri, ...others);
            }
            return true;
        }
        return false;
    }
    getUri(...args) {
        const [maybeUriArray] = args;
        const firstArgIsOK = this.isMulti()
            ? Array.isArray(maybeUriArray) && maybeUriArray.every(uri => uri instanceof URI)
            : maybeUriArray instanceof URI;
        if (firstArgIsOK) {
            return maybeUriArray;
        }
        const { selection } = this.selectionService;
        const uriOrUris = this.isMulti()
            ? UriSelection.getUris(selection)
            : UriSelection.getUri(selection);
        return uriOrUris;
    }
    getArgsWithUri(...args) {
        const uri = this.getUri(...args);
        const [maybeUri, ...others] = args;
        if (uri === maybeUri) {
            return [maybeUri, ...others];
        }
        return [uri, ...args];
    }
    isMulti() {
        return this.options && !!this.options.multi;
    }
}
(function (UriAwareCommandHandler) {
    /**
     * @returns a command handler for mono-select contexts that expects a `URI` as the first parameter of its methods.
     */
    function MonoSelect(selectionService, handler) {
        /* eslint-disable-next-line deprecation/deprecation*/ // Safe to use when the generic and the options agree.
        return new UriAwareCommandHandler(selectionService, handler, { multi: false });
    }
    UriAwareCommandHandler.MonoSelect = MonoSelect;
    /**
     * @returns a command handler for multi-select contexts that expects a `URI[]` as the first parameter of its methods.
     */
    function MultiSelect(selectionService, handler) {
        /* eslint-disable-next-line deprecation/deprecation*/ // Safe to use when the generic and the options agree.
        return new UriAwareCommandHandler(selectionService, handler, { multi: true });
    }
    UriAwareCommandHandler.MultiSelect = MultiSelect;
})(UriAwareCommandHandler || (UriAwareCommandHandler = {}));

//# sourceMappingURL=../../lib/common/uri-command-handler.js.map
