/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
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
export interface IKeyIterator<K> {
    reset(key: K): this;
    next(): this;
    hasNext(): boolean;
    cmp(a: string): number;
    value(): string;
}
export declare class PathIterator implements IKeyIterator<string> {
    private readonly _splitOnBackslash;
    private readonly _caseSensitive;
    private _value;
    private _from;
    private _to;
    constructor(_splitOnBackslash?: boolean, _caseSensitive?: boolean);
    reset(key: string): this;
    hasNext(): boolean;
    next(): this;
    cmp(a: string): number;
    value(): string;
}
export declare class UriIterator implements IKeyIterator<URI> {
    protected readonly caseSensitive: boolean;
    private _pathIterator;
    private _value;
    private _states;
    private _stateIdx;
    constructor(caseSensitive: boolean);
    reset(key: URI): this;
    next(): this;
    hasNext(): boolean;
    cmp(a: string): number;
    value(): string;
}
export declare class TernarySearchTree<K, V> {
    private _iter;
    private _root;
    constructor(segments: IKeyIterator<K>);
    static forUris<E>(caseSensitive: boolean): TernarySearchTree<URI, E>;
    static forPaths<E>(): TernarySearchTree<string, E>;
    clear(): void;
    set(key: K, element: V): V | undefined;
    get(key: K): V | undefined;
    delete(key: K): void;
    findSubstr(key: K): V | undefined;
    findSuperstr(key: K): Iterator<V> | undefined;
    forEach(callback: (value: V, index: K) => any): void;
    private _nodeIterator;
    private _forEach;
}
