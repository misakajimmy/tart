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

import {inject, injectable, named, postConstruct} from 'inversify';
import URI from '@tartjs/core/lib/common/uri';
import {
    ContributionProvider,
    Event,
    MaybePromise,
    ReferenceCollection,
    Resource,
    ResourceProvider,
} from '@tartjs/core/lib/common';
import {EditorPreferenceChange, EditorPreferences} from '@tartjs/editor';
import {MonacoEditorModel} from './monaco-editor-model';
import {MonacoToProtocolConverter} from './monaco-to-protocol-converter';
import {ProtocolToMonacoConverter} from './protocol-to-monaco-converter';
// import { ApplicationServer } from '@wm/core/lib/common/application-protocol';
import {Deferred} from '@tartjs/core/lib/common/promise-util';
import IReference = monaco.editor.IReference;

export {IReference};

export const MonacoEditorModelFactory = Symbol('MonacoEditorModelFactory');

export interface MonacoEditorModelFactory {

    readonly scheme: string;

    createModel(
        resource: Resource
    ): MaybePromise<MonacoEditorModel>;

}

@injectable()
export class MonacoTextModelService implements monaco.editor.ITextModelService {

    protected readonly _ready = new Deferred<void>();
    /**
     * This component does some asynchronous work before being fully initialized.
     */
    readonly ready: Promise<void> = this._ready.promise;

    protected readonly _models = new ReferenceCollection<string, MonacoEditorModel>(
        uri => this.loadModel(new URI(uri))
    );

    @inject(ResourceProvider)
    protected readonly resourceProvider: ResourceProvider;

    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;

    @inject(MonacoToProtocolConverter)
    protected readonly m2p: MonacoToProtocolConverter;

    @inject(ProtocolToMonacoConverter)
    protected readonly p2m: ProtocolToMonacoConverter;

    @inject(ContributionProvider)
    @named(MonacoEditorModelFactory)
    protected readonly factories: ContributionProvider<MonacoEditorModelFactory>;
    protected readonly modelOptions: { [name: string]: (keyof monaco.editor.ITextModelUpdateOptions | undefined) } = {
        'editor.tabSize': 'tabSize',
        'editor.insertSpaces': 'insertSpaces'
    };

    get models(): MonacoEditorModel[] {
        return this._models.values();
    }

    get onDidCreate(): Event<MonacoEditorModel> {
        return this._models.onDidCreate;
    }

    @postConstruct()
    public init(): void {
        let isWindowsBackend = false;

        // this.applicationServer.getBackendOS().then(os => {
        //     isWindowsBackend = os === OS.Type.Windows;
        // }, () => undefined).then(() => this._ready.resolve());

        this._ready.resolve();

        const staticServices = monaco.services.StaticServices;

        if (staticServices.resourcePropertiesService) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const original = staticServices.resourcePropertiesService.get() as any;
            original.getEOL = () => {
                const eol = this.editorPreferences['files.eol'];
                if (eol) {
                    if (eol !== 'auto') {
                        return eol;
                    }
                }
                return isWindowsBackend ? '\r\n' : '\n';
            };
        }
    }

    get(uri: string): MonacoEditorModel | undefined {
        return this._models.get(uri);
    }

    createModelReference(raw: monaco.Uri | URI): Promise<IReference<MonacoEditorModel>> {
        return this._models.acquire(raw.toString());
    }

    registerTextModelContentProvider(scheme: string, provider: monaco.editor.ITextModelContentProvider): monaco.IDisposable {
        return {
            dispose(): void {
                // no-op
            }
        };
    }

    protected async loadModel(uri: URI): Promise<MonacoEditorModel> {
        await this.ready;
        await this.editorPreferences.ready;
        const resource = await this.resourceProvider(uri);
        const model = await (await this.createModel(resource)).load();
        this.updateModel(model);
        model.textEditorModel.onDidChangeLanguage(() => this.updateModel(model));
        const disposable = this.editorPreferences.onPreferenceChanged(change => this.updateModel(model, change));
        model.onDispose(() => disposable.dispose());
        return model;
    }

    protected createModel(resource: Resource): MaybePromise<MonacoEditorModel> {
        const factory = this.factories.getContributions().find(({scheme}) => resource.uri.scheme === scheme);
        return factory ? factory.createModel(resource) : new MonacoEditorModel(resource, this.m2p, this.p2m, this.editorPreferences);
    }

    protected updateModel(model: MonacoEditorModel, change?: EditorPreferenceChange): void {
        if (change) {
            if (!change.affects(model.uri, model.languageId)) {
                return;
            }
            if (change.preferenceName === 'editor.autoSave') {
                model.autoSave = this.editorPreferences.get('editor.autoSave', undefined, model.uri);
            }
            if (change.preferenceName === 'editor.autoSaveDelay') {
                model.autoSaveDelay = this.editorPreferences.get('editor.autoSaveDelay', undefined, model.uri);
            }
            const modelOption = this.modelOptions[change.preferenceName];
            if (modelOption) {
                const options: monaco.editor.ITextModelUpdateOptions = {};
                // @ts-ignore
                options[modelOption] = change.newValue as any;
                model.textEditorModel.updateOptions(options);
            }
        } else {
            model.autoSave = this.editorPreferences.get('editor.autoSave', undefined, model.uri);
            model.autoSaveDelay = this.editorPreferences.get('editor.autoSaveDelay', undefined, model.uri);
            model.textEditorModel.updateOptions(this.getModelOptions(model));
        }
    }

    /** @deprecated pass MonacoEditorModel instead  */
    protected getModelOptions(uri: string): monaco.editor.ITextModelUpdateOptions;

    protected getModelOptions(model: MonacoEditorModel): monaco.editor.ITextModelUpdateOptions;

    protected getModelOptions(arg: string | MonacoEditorModel): monaco.editor.ITextModelUpdateOptions {
        const uri = typeof arg === 'string' ? arg : arg.uri;
        const overrideIdentifier = typeof arg === 'string' ? undefined : arg.languageId;
        return {
            tabSize: this.editorPreferences.get({preferenceName: 'editor.tabSize', overrideIdentifier}, undefined, uri),
            insertSpaces: this.editorPreferences.get({
                preferenceName: 'editor.insertSpaces',
                overrideIdentifier
            }, undefined, uri)
        };
    }
}
