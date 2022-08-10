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
/// <reference types="@theia/monaco-editor-core/monaco" />
import URI from '@tart/core/lib/common/uri';
import { Disposable } from '@tart/core/lib/common';
import { DeltaDecorationParams, DiffNavigator, Dimension } from '@tart/editor';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditor, MonacoEditorServices } from './monaco-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import IStandaloneDiffEditor = monaco.editor.IStandaloneDiffEditor;
import IDiffEditorConstructionOptions = monaco.editor.IDiffEditorConstructionOptions;
import IDiffNavigatorOptions = monaco.editor.IDiffNavigatorOptions;
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;
export declare namespace MonacoDiffEditor {
    interface IOptions extends MonacoEditor.ICommonOptions, IDiffEditorConstructionOptions, IDiffNavigatorOptions {
    }
}
export declare class MonacoDiffEditor extends MonacoEditor {
    readonly uri: URI;
    readonly node: HTMLElement;
    readonly originalModel: MonacoEditorModel;
    readonly modifiedModel: MonacoEditorModel;
    protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory;
    constructor(uri: URI, node: HTMLElement, originalModel: MonacoEditorModel, modifiedModel: MonacoEditorModel, services: MonacoEditorServices, diffNavigatorFactory: MonacoDiffNavigatorFactory, options?: MonacoDiffEditor.IOptions, override?: IEditorOverrideServices);
    protected _diffEditor: IStandaloneDiffEditor;
    get diffEditor(): IStandaloneDiffEditor;
    protected _diffNavigator: DiffNavigator;
    get diffNavigator(): DiffNavigator;
    isActionSupported(id: string): boolean;
    deltaDecorations(params: DeltaDecorationParams): string[];
    getResourceUri(): URI;
    createMoveToUri(resourceUri: URI): URI;
    protected create(options?: IDiffEditorConstructionOptions, override?: monaco.editor.IEditorOverrideServices): Disposable;
    protected resize(dimension: Dimension | null): void;
}
