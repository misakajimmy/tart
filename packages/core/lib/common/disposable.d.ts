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
import { Event } from './event';
import { Emitter } from './emitter';
export interface Disposable {
    /**
     * Dispose this object.
     */
    dispose(): void;
}
export declare namespace Disposable {
    function is(arg: any): arg is Disposable;
    function create(func: () => void): Disposable;
    const NULL: Disposable;
}
export declare class DisposableCollection implements Disposable {
    protected readonly disposables: Disposable[];
    protected readonly onDisposeEmitter: Emitter<void>;
    private disposingElements;
    constructor(...toDispose: Disposable[]);
    /**
     * This event is fired only once
     * on first dispose of not empty collection.
     */
    get onDispose(): Event<void>;
    get disposed(): boolean;
    dispose(): void;
    push(disposable: Disposable): Disposable;
    pushAll(disposables: Disposable[]): Disposable[];
    protected checkDisposed(): void;
}
