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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, injectable, postConstruct } from 'inversify';
import { deepFreeze, Disposable, DisposableCollection, Emitter, unreachable } from '../../common';
import { Deferred } from '../../common/promise-util';
import { PreferenceProvider } from './preference-provider';
import { PreferenceSchemaProvider } from './preference-contribution';
import URI from '../../common/uri';
import { PreferenceScope } from './preference-scope';
import { PreferenceConfigurations } from './preference-configurations';
import { JSONExt } from '@lumino/coreutils';
import { PreferenceLanguageOverrideService } from './preference-language-override-service';
export { PreferenceScope };
export class PreferenceChangeImpl {
    change;
    constructor(change) {
        this.change = change;
    }
    get preferenceName() {
        return this.change.preferenceName;
    }
    get newValue() {
        return this.change.newValue;
    }
    get oldValue() {
        return this.change.oldValue;
    }
    get scope() {
        return this.change.scope;
    }
    // TODO add tests
    affects(resourceUri) {
        const resourcePath = resourceUri && new URI(resourceUri).path;
        const domain = this.change.domain;
        return !resourcePath || !domain || domain.some(uri => new URI(uri).path.relativity(resourcePath) >= 0);
    }
}
export const PreferenceService = Symbol('PreferenceService');
/**
 * We cannot load providers directly in the case if they depend on `PreferenceService` somehow.
 * It allows to load them lazily after DI is configured.
 */
export const PreferenceProviderProvider = Symbol('PreferenceProviderProvider');
let PreferenceServiceImpl = class PreferenceServiceImpl {
    onPreferenceChangedEmitter = new Emitter();
    onPreferenceChanged = this.onPreferenceChangedEmitter.event;
    onPreferencesChangedEmitter = new Emitter();
    onPreferencesChanged = this.onPreferencesChangedEmitter.event;
    toDispose = new DisposableCollection(this.onPreferenceChangedEmitter, this.onPreferencesChangedEmitter);
    schema;
    providerProvider;
    configurations;
    preferenceOverrideService;
    preferenceProviders = new Map();
    _ready = new Deferred();
    get ready() {
        return this._ready.promise;
    }
    dispose() {
        this.toDispose.dispose();
    }
    has(preferenceName, resourceUri) {
        return this.get(preferenceName, undefined, resourceUri) !== undefined;
    }
    get(preferenceName, defaultValue, resourceUri) {
        return this.resolve(preferenceName, defaultValue, resourceUri).value;
    }
    resolve(preferenceName, defaultValue, resourceUri) {
        const { value, configUri } = this.doResolve(preferenceName, defaultValue, resourceUri);
        if (value === undefined) {
            const overridden = this.overriddenPreferenceName(preferenceName);
            if (overridden) {
                return this.doResolve(overridden.preferenceName, defaultValue, resourceUri);
            }
        }
        return { value, configUri };
    }
    async set(preferenceName, value, scope, resourceUri) {
        // const resolvedScope = scope ?? (!resourceUri ? PreferenceScope.Workspace : PreferenceScope.Folder);
        // if (resolvedScope === PreferenceScope.Folder && !resourceUri) {
        //     throw new Error('Unable to write to Folder Settings because no resource is provided.');
        // }
        // const provider = this.getProvider(resolvedScope);
        // if (provider && await provider.setPreference(preferenceName, value, resourceUri)) {
        return;
        // }
        // throw new Error(`Unable to write to ${PreferenceScope[resolvedScope]} Settings.`);
    }
    getBoolean(preferenceName, defaultValue, resourceUri) {
        const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
        // eslint-disable-next-line no-null/no-null
        return value !== null && value !== undefined ? !!value : defaultValue;
    }
    getString(preferenceName, defaultValue, resourceUri) {
        const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
        // eslint-disable-next-line no-null/no-null
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value.toString();
    }
    getNumber(preferenceName, defaultValue, resourceUri) {
        const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
        // eslint-disable-next-line no-null/no-null
        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (typeof value === 'number') {
            return value;
        }
        return Number(value);
    }
    inspect(preferenceName, resourceUri) {
        const defaultValue = this.inspectInScope(preferenceName, PreferenceScope.Default, resourceUri);
        // const globalValue = this.inspectInScope<T>(preferenceName, PreferenceScope.User, resourceUri);
        // const workspaceValue = this.inspectInScope<T>(preferenceName, PreferenceScope.Workspace, resourceUri);
        // const workspaceFolderValue = this.inspectInScope<T>(preferenceName, PreferenceScope.Folder, resourceUri);
        const valueApplied = defaultValue;
        // const valueApplied = workspaceFolderValue ?? workspaceValue ?? globalValue ?? defaultValue;
        return { preferenceName, defaultValue, value: valueApplied };
        // return { preferenceName, defaultValue, globalValue, workspaceValue, workspaceFolderValue, value: valueApplied };
    }
    async updateValue(preferenceName, value, resourceUri) {
        const inspection = this.inspect(preferenceName, resourceUri);
        if (inspection) {
            const scopesToChange = this.getScopesToChange(inspection, value);
            const isDeletion = value === undefined
                || (scopesToChange.length === 1 && JSONExt.deepEqual(value, inspection.defaultValue));
            // const isDeletion = value === undefined
            //     || (scopesToChange.length === 1 && scopesToChange[0] === PreferenceScope.User && JSONExt.deepEqual(value, inspection.defaultValue));
            const effectiveValue = isDeletion ? undefined : value;
            await Promise.all(scopesToChange.map(scope => this.set(preferenceName, effectiveValue, scope, resourceUri)));
        }
    }
    overridePreferenceName(options) {
        return this.preferenceOverrideService.overridePreferenceName(options);
    }
    overriddenPreferenceName(preferenceName) {
        return this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
    }
    getConfigUri(scope, resourceUri, sectionName = this.configurations.getConfigName()) {
        const provider = this.getProvider(scope);
        if (!provider || !this.configurations.isAnyConfig(sectionName)) {
            return undefined;
        }
        const configUri = provider.getConfigUri(resourceUri, sectionName);
        if (configUri) {
            return configUri;
        }
        return provider.getContainingConfigUri && provider.getContainingConfigUri(resourceUri, sectionName);
    }
    async initializeProviders() {
        try {
            for (const scope of PreferenceScope.getScopes()) {
                const provider = this.providerProvider(scope);
                this.preferenceProviders.set(scope, provider);
                this.toDispose.push(provider.onDidPreferencesChanged(changes => this.reconcilePreferences(changes)));
                await provider.ready;
            }
            this._ready.resolve();
        }
        catch (e) {
            console.log('error');
            console.log(e);
            this._ready.reject(e);
        }
    }
    init() {
        this.toDispose.push(Disposable.create(() => this._ready.reject(new Error('preference service is disposed'))));
        this.initializeProviders();
    }
    reconcilePreferences(changes) {
        const changesToEmit = {};
        const acceptChange = (change) => this.getAffectedPreferenceNames(change, preferenceName => changesToEmit[preferenceName] = new PreferenceChangeImpl({ ...change, preferenceName }));
        for (const preferenceName of Object.keys(changes)) {
            let change = changes[preferenceName];
            if (change.newValue === undefined) {
                const overridden = this.overriddenPreferenceName(change.preferenceName);
                if (overridden) {
                    change = {
                        ...change, newValue: this.doGet(overridden.preferenceName)
                    };
                }
            }
            // if (this.schema.isValidInScope(preferenceName, PreferenceScope.Folder)) {
            //     acceptChange(change);
            //     continue;
            // }
            for (const scope of PreferenceScope.getReversedScopes()) {
                if (this.schema.isValidInScope(preferenceName, scope)) {
                    const provider = this.getProvider(scope);
                    if (provider) {
                        const value = provider.get(preferenceName);
                        if (scope > change.scope && value !== undefined) {
                            // preference defined in a more specific scope
                            break;
                        }
                        else if (scope === change.scope && change.newValue !== undefined) {
                            // preference is changed into something other than `undefined`
                            acceptChange(change);
                        }
                        else if (scope < change.scope && change.newValue === undefined && value !== undefined) {
                            // preference is changed to `undefined`, use the value from a more general scope
                            change = {
                                ...change,
                                newValue: value,
                                scope
                            };
                            acceptChange(change);
                        }
                    }
                }
                else if (change.newValue === undefined && change.scope === PreferenceScope.Default) {
                    // preference is removed
                    acceptChange(change);
                    break;
                }
            }
        }
        // emit the changes
        const changedPreferenceNames = Object.keys(changesToEmit);
        if (changedPreferenceNames.length > 0) {
            this.onPreferencesChangedEmitter.fire(changesToEmit);
        }
        changedPreferenceNames.forEach(preferenceName => this.onPreferenceChangedEmitter.fire(changesToEmit[preferenceName]));
    }
    getAffectedPreferenceNames(change, accept) {
        accept(change.preferenceName);
        for (const overridePreferenceName of this.schema.getOverridePreferenceNames(change.preferenceName)) {
            if (!this.doHas(overridePreferenceName)) {
                accept(overridePreferenceName);
            }
        }
    }
    getProvider(scope) {
        return this.preferenceProviders.get(scope);
    }
    inspectInScope(preferenceName, scope, resourceUri) {
        const value = this.doInspectInScope(preferenceName, scope, resourceUri);
        if (value === undefined) {
            const overridden = this.overriddenPreferenceName(preferenceName);
            if (overridden) {
                return this.doInspectInScope(overridden.preferenceName, scope, resourceUri);
            }
        }
        return value;
    }
    getScopedValueFromInspection(inspection, scope) {
        switch (scope) {
            case PreferenceScope.Default:
                return inspection.defaultValue;
            // case PreferenceScope.User:
            //     return inspection.globalValue;
            // case PreferenceScope.Workspace:
            //     return inspection.workspaceValue;
            // case PreferenceScope.Folder:
            //     return inspection.workspaceFolderValue;
        }
        unreachable(scope, 'Not all PreferenceScope enum variants handled.');
    }
    getScopesToChange(inspection, intendedValue) {
        if (JSONExt.deepEqual(inspection.value, intendedValue)) {
            return [];
        }
        // Scopes in ascending order of scope breadth.
        const allScopes = PreferenceScope.getReversedScopes();
        // Get rid of Default scope. We can't set anything there.
        allScopes.pop();
        const isScopeDefined = (scope) => this.getScopedValueFromInspection(inspection, scope) !== undefined;
        if (intendedValue === undefined) {
            return allScopes.filter(isScopeDefined);
        }
        return [allScopes.find(isScopeDefined)];
        // return [allScopes.find(isScopeDefined) ?? PreferenceScope.User];
    }
    doHas(preferenceName, resourceUri) {
        return this.doGet(preferenceName, undefined, resourceUri) !== undefined;
    }
    doInspectInScope(preferenceName, scope, resourceUri) {
        const provider = this.getProvider(scope);
        return provider && provider.get(preferenceName, resourceUri);
    }
    doGet(preferenceName, defaultValue, resourceUri) {
        return this.doResolve(preferenceName, defaultValue, resourceUri).value;
    }
    doResolve(preferenceName, defaultValue, resourceUri) {
        const result = {};
        for (const scope of PreferenceScope.getScopes()) {
            if (this.schema.isValidInScope(preferenceName, scope)) {
                const provider = this.getProvider(scope);
                if (provider) {
                    const { configUri, value } = provider.resolve(preferenceName, resourceUri);
                    if (value !== undefined) {
                        result.configUri = configUri;
                        result.value = PreferenceProvider.merge(result.value, value);
                    }
                }
            }
        }
        return {
            configUri: result.configUri,
            value: result.value !== undefined ? deepFreeze(result.value) : defaultValue
        };
    }
};
__decorate([
    inject(PreferenceSchemaProvider)
], PreferenceServiceImpl.prototype, "schema", void 0);
__decorate([
    inject(PreferenceProviderProvider)
], PreferenceServiceImpl.prototype, "providerProvider", void 0);
__decorate([
    inject(PreferenceConfigurations)
], PreferenceServiceImpl.prototype, "configurations", void 0);
__decorate([
    inject(PreferenceLanguageOverrideService)
], PreferenceServiceImpl.prototype, "preferenceOverrideService", void 0);
__decorate([
    postConstruct()
], PreferenceServiceImpl.prototype, "init", null);
PreferenceServiceImpl = __decorate([
    injectable()
], PreferenceServiceImpl);
export { PreferenceServiceImpl };

//# sourceMappingURL=../../../lib/browser/preferences/preference-service.js.map
