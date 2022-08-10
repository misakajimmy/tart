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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named, postConstruct } from 'inversify';
import URI from '@tart/core/lib/common/uri';
import { ContributionProvider, ReferenceCollection, ResourceProvider, } from '@tart/core/lib/common';
import { EditorPreferences } from '@tart/editor';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
// import { ApplicationServer } from '@wm/core/lib/common/application-protocol';
import { Deferred } from '@tart/core/lib/common/promise-util';
export const MonacoEditorModelFactory = Symbol('MonacoEditorModelFactory');
let MonacoTextModelService = class MonacoTextModelService {
    constructor() {
        this._ready = new Deferred();
        /**
         * This component does some asynchronous work before being fully initialized.
         */
        this.ready = this._ready.promise;
        this._models = new ReferenceCollection(uri => this.loadModel(new URI(uri)));
        this.modelOptions = {
            'editor.tabSize': 'tabSize',
            'editor.insertSpaces': 'insertSpaces'
        };
    }
    get models() {
        return this._models.values();
    }
    get onDidCreate() {
        return this._models.onDidCreate;
    }
    init() {
        let isWindowsBackend = false;
        // this.applicationServer.getBackendOS().then(os => {
        //     isWindowsBackend = os === OS.Type.Windows;
        // }, () => undefined).then(() => this._ready.resolve());
        this._ready.resolve();
        const staticServices = monaco.services.StaticServices;
        if (staticServices.resourcePropertiesService) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const original = staticServices.resourcePropertiesService.get();
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
    get(uri) {
        return this._models.get(uri);
    }
    createModelReference(raw) {
        return this._models.acquire(raw.toString());
    }
    registerTextModelContentProvider(scheme, provider) {
        return {
            dispose() {
                // no-op
            }
        };
    }
    async loadModel(uri) {
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
    createModel(resource) {
        const factory = this.factories.getContributions().find(({ scheme }) => resource.uri.scheme === scheme);
        return factory ? factory.createModel(resource) : new MonacoEditorModel(resource, this.m2p, this.p2m, this.editorPreferences);
    }
    updateModel(model, change) {
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
                const options = {};
                // @ts-ignore
                options[modelOption] = change.newValue;
                model.textEditorModel.updateOptions(options);
            }
        }
        else {
            model.autoSave = this.editorPreferences.get('editor.autoSave', undefined, model.uri);
            model.autoSaveDelay = this.editorPreferences.get('editor.autoSaveDelay', undefined, model.uri);
            model.textEditorModel.updateOptions(this.getModelOptions(model));
        }
    }
    getModelOptions(arg) {
        const uri = typeof arg === 'string' ? arg : arg.uri;
        const overrideIdentifier = typeof arg === 'string' ? undefined : arg.languageId;
        return {
            tabSize: this.editorPreferences.get({ preferenceName: 'editor.tabSize', overrideIdentifier }, undefined, uri),
            insertSpaces: this.editorPreferences.get({
                preferenceName: 'editor.insertSpaces',
                overrideIdentifier
            }, undefined, uri)
        };
    }
};
__decorate([
    inject(ResourceProvider)
], MonacoTextModelService.prototype, "resourceProvider", void 0);
__decorate([
    inject(EditorPreferences)
], MonacoTextModelService.prototype, "editorPreferences", void 0);
__decorate([
    inject(MonacoToProtocolConverter)
], MonacoTextModelService.prototype, "m2p", void 0);
__decorate([
    inject(ProtocolToMonacoConverter)
], MonacoTextModelService.prototype, "p2m", void 0);
__decorate([
    inject(ContributionProvider),
    named(MonacoEditorModelFactory)
], MonacoTextModelService.prototype, "factories", void 0);
__decorate([
    postConstruct()
], MonacoTextModelService.prototype, "init", null);
MonacoTextModelService = __decorate([
    injectable()
], MonacoTextModelService);
export { MonacoTextModelService };

//# sourceMappingURL=../../lib/browser/monaco-text-model-service.js.map
