/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { URI as Uri } from 'vscode-uri';
import { Path } from './path';
export default class URI {
    codeUri;
    constructor(uri = '') {
        if (uri instanceof Uri) {
            this.codeUri = uri;
        }
        else {
            this.codeUri = Uri.parse(uri);
        }
    }
    _path;
    get path() {
        if (this._path === undefined) {
            this._path = new Path(this.codeUri.path);
        }
        return this._path;
    }
    /**
     * TODO move implementation to `DefaultUriLabelProviderContribution.getName`
     *
     * @deprecated use `LabelProvider.getName` instead
     */
    get displayName() {
        const base = this.path.base;
        if (base) {
            return base;
        }
        if (this.path.isRoot) {
            return this.path.toString();
        }
        return '';
    }
    /**
     * Return all uri from the current to the top most.
     */
    get allLocations() {
        const locations = [];
        let location = this;
        while (!location.path.isRoot && location.path.hasDir) {
            locations.push(location);
            location = location.parent;
        }
        locations.push(location);
        return locations;
    }
    get parent() {
        if (this.path.isRoot) {
            return this;
        }
        return this.withPath(this.path.dir);
    }
    get scheme() {
        return this.codeUri.scheme;
    }
    get authority() {
        return this.codeUri.authority;
    }
    get query() {
        return this.codeUri.query;
    }
    get fragment() {
        return this.codeUri.fragment;
    }
    static getDistinctParents(uris) {
        const result = [];
        uris.forEach((uri, i) => {
            if (!uris.some((otherUri, index) => index !== i && otherUri.isEqualOrParent(uri))) {
                result.push(uri);
            }
        });
        return result;
    }
    relative(uri) {
        if (this.authority !== uri.authority || this.scheme !== uri.scheme) {
            return undefined;
        }
        return this.path.relative(uri.path);
    }
    resolve(path) {
        return this.withPath(this.path.join(path.toString()));
    }
    /**
     * return a new URI replacing the current with the given scheme
     */
    withScheme(scheme) {
        const newCodeUri = Uri.from({
            ...this.codeUri.toJSON(),
            scheme
        });
        return new URI(newCodeUri);
    }
    /**
     * return a new URI replacing the current with the given authority
     */
    withAuthority(authority) {
        const newCodeUri = Uri.from({
            ...this.codeUri.toJSON(),
            scheme: this.codeUri.scheme,
            authority
        });
        return new URI(newCodeUri);
    }
    /**
     * return this URI without a authority
     */
    withoutAuthority() {
        return this.withAuthority('');
    }
    /**
     * return a new URI replacing the current with the given path
     */
    withPath(path) {
        const newCodeUri = Uri.from({
            ...this.codeUri.toJSON(),
            scheme: this.codeUri.scheme,
            path: path.toString()
        });
        return new URI(newCodeUri);
    }
    /**
     * return this URI without a path
     */
    withoutPath() {
        return this.withPath('');
    }
    /**
     * return a new URI replacing the current with the given query
     */
    withQuery(query) {
        const newCodeUri = Uri.from({
            ...this.codeUri.toJSON(),
            scheme: this.codeUri.scheme,
            query
        });
        return new URI(newCodeUri);
    }
    /**
     * return this URI without a query
     */
    withoutQuery() {
        return this.withQuery('');
    }
    /**
     * return a new URI replacing the current with the given fragment
     */
    withFragment(fragment) {
        const newCodeUri = Uri.from({
            ...this.codeUri.toJSON(),
            scheme: this.codeUri.scheme,
            fragment
        });
        return new URI(newCodeUri);
    }
    /**
     * return this URI without a fragment
     */
    withoutFragment() {
        return this.withFragment('');
    }
    /**
     * return a new URI replacing the current with its normalized path, resolving '..' and '.' segments
     */
    normalizePath() {
        return this.withPath(this.path.normalize());
    }
    toString(skipEncoding) {
        return this.codeUri.toString(skipEncoding);
    }
    isEqual(uri, caseSensitive = true) {
        if (!this.hasSameOrigin(uri)) {
            return false;
        }
        return caseSensitive
            ? this.toString() === uri.toString()
            : this.toString().toLowerCase() === uri.toString().toLowerCase();
    }
    isEqualOrParent(uri, caseSensitive = true) {
        if (!this.hasSameOrigin(uri)) {
            return false;
        }
        let left = this.path;
        let right = uri.path;
        if (!caseSensitive) {
            left = new Path(left.toString().toLowerCase());
            right = new Path(right.toString().toLowerCase());
        }
        return left.isEqualOrParent(right);
    }
    hasSameOrigin(uri) {
        return (this.authority === uri.authority) && (this.scheme === uri.scheme);
    }
}

//# sourceMappingURL=../../lib/common/uri.js.map
