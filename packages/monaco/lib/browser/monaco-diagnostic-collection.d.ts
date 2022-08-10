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
/// <reference types="@theia/monaco-editor-core/monaco" />
import { Diagnostic } from 'vscode-languageserver-types';
import { Disposable, DisposableCollection } from '@tart/core/lib/common/disposable';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import IModel = monaco.editor.IModel;
import IMarkerData = monaco.editor.IMarkerData;
export declare class MonacoDiagnosticCollection implements Disposable {
    protected readonly name: string;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly diagnostics: Map<string, MonacoModelDiagnostics>;
    protected readonly toDispose: DisposableCollection;
    constructor(name: string, p2m: ProtocolToMonacoConverter);
    dispose(): void;
    get(uri: string): Diagnostic[];
    set(uri: string, diagnostics: Diagnostic[]): void;
}
export declare class MonacoModelDiagnostics implements Disposable {
    readonly owner: string;
    protected readonly p2m: ProtocolToMonacoConverter;
    readonly uri: monaco.Uri;
    constructor(uri: string, diagnostics: Diagnostic[], owner: string, p2m: ProtocolToMonacoConverter);
    protected _markers: IMarkerData[];
    get markers(): ReadonlyArray<IMarkerData>;
    protected _diagnostics: Diagnostic[];
    get diagnostics(): Diagnostic[];
    set diagnostics(diagnostics: Diagnostic[]);
    dispose(): void;
    updateModelMarkers(): void;
    protected doUpdateModelMarkers(model: IModel | undefined): void;
}
