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
import { ContributionProvider, Event, MaybePromise, ReferenceCollection, Resource, ResourceProvider } from '@tart/core/lib/common';
import { EditorPreferenceChange, EditorPreferences } from '@tart/editor';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { Deferred } from '@tart/core/lib/common/promise-util';
import IReference = monaco.editor.IReference;
export { IReference };
export declare const MonacoEditorModelFactory: unique symbol;
export interface MonacoEditorModelFactory {
    readonly scheme: string;
    createModel(resource: Resource): MaybePromise<MonacoEditorModel>;
}
export declare class MonacoTextModelService implements monaco.editor.ITextModelService {
    protected readonly _ready: Deferred<void>;
    /**
     * This component does some asynchronous work before being fully initialized.
     */
    readonly ready: Promise<void>;
    protected readonly _models: ReferenceCollection<string, MonacoEditorModel>;
    protected readonly resourceProvider: ResourceProvider;
    protected readonly editorPreferences: EditorPreferences;
    protected readonly m2p: MonacoToProtocolConverter;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly factories: ContributionProvider<MonacoEditorModelFactory>;
    protected readonly modelOptions: {
        [name: string]: (keyof monaco.editor.ITextModelUpdateOptions | undefined);
    };
    get models(): MonacoEditorModel[];
    get onDidCreate(): Event<MonacoEditorModel>;
    init(): void;
    get(uri: string): MonacoEditorModel | undefined;
    createModelReference(raw: monaco.Uri | URI): Promise<IReference<MonacoEditorModel>>;
    registerTextModelContentProvider(scheme: string, provider: monaco.editor.ITextModelContentProvider): monaco.IDisposable;
    protected loadModel(uri: URI): Promise<MonacoEditorModel>;
    protected createModel(resource: Resource): MaybePromise<MonacoEditorModel>;
    protected updateModel(model: MonacoEditorModel, change?: EditorPreferenceChange): void;
    /** @deprecated pass MonacoEditorModel instead  */
    protected getModelOptions(uri: string): monaco.editor.ITextModelUpdateOptions;
    protected getModelOptions(model: MonacoEditorModel): monaco.editor.ITextModelUpdateOptions;
}
