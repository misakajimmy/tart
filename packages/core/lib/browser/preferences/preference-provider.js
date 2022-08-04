var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { default as debounce } from 'p-debounce';
import URI from '../../common/uri';
import { inject, injectable } from 'inversify';
import { DisposableCollection, Emitter } from '../../common';
import { PreferenceLanguageOverrideService } from './preference-language-override-service';
import { Deferred } from '../../common/promise-util';
import { JSONExt } from '@lumino/coreutils';
export var PreferenceProviderDataChange;
(function (PreferenceProviderDataChange) {
    function affects(change, resourceUri) {
        const resourcePath = resourceUri && new URI(resourceUri).path;
        const domain = change.domain;
        return !resourcePath || !domain || domain.some(uri => new URI(uri).path.relativity(resourcePath) >= 0);
    }
    PreferenceProviderDataChange.affects = affects;
})(PreferenceProviderDataChange || (PreferenceProviderDataChange = {}));
/**
 * The {@link PreferenceProvider} is used to store and retrieve preference values. A {@link PreferenceProvider} does not operate in a global scope but is
 * configured for one or more {@link PreferenceScope}s. The (default implementation for the) {@link PreferenceService} aggregates all {@link PreferenceProvider}s and
 * serves as a common facade for manipulating preference values.
 */
let PreferenceProvider = class PreferenceProvider {
    preferenceOverrideService;
    onDidPreferencesChangedEmitter = new Emitter();
    onDidPreferencesChanged = this.onDidPreferencesChangedEmitter.event;
    toDispose = new DisposableCollection();
    _ready = new Deferred();
    deferredChanges;
    fireDidPreferencesChanged = debounce(() => {
        const changes = this.deferredChanges;
        this.deferredChanges = undefined;
        if (changes && Object.keys(changes).length) {
            this.onDidPreferencesChangedEmitter.fire(changes);
            return true;
        }
        return false;
    }, 0);
    constructor() {
        this.toDispose.push(this.onDidPreferencesChangedEmitter);
    }
    _pendingChanges = Promise.resolve(false);
    get pendingChanges() {
        return this._pendingChanges;
    }
    /**
     * Resolved when the preference provider is ready to provide preferences
     * It should be resolved by subclasses.
     */
    get ready() {
        return this._ready.promise;
    }
    static merge(source, target) {
        if (source === undefined || !JSONExt.isObject(source)) {
            return JSONExt.deepCopy(target);
        }
        if (JSONExt.isPrimitive(target)) {
            return {};
        }
        for (const key of Object.keys(target)) {
            const value = target[key];
            if (key in source) {
                if (JSONExt.isObject(source[key]) && JSONExt.isObject(value)) {
                    this.merge(source[key], value);
                    continue;
                }
            }
            source[key] = JSONExt.deepCopy(value);
        }
        return source;
    }
    /**
     * Handles deep equality with the possibility of `undefined`
     */
    static deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a === undefined || b === undefined) {
            return false;
        }
        return JSONExt.deepEqual(a, b);
    }
    dispose() {
        this.toDispose.dispose();
    }
    /**
     * Retrieve the stored value for the given preference and resource URI.
     *
     * @param preferenceName the preference identifier.
     * @param resourceUri the uri of the resource for which the preference is stored. This is used to retrieve
     * a potentially different value for the same preference for different resources, for example `files.encoding`.
     *
     * @returns the value stored for the given preference and resourceUri if it exists, otherwise `undefined`.
     */
    get(preferenceName, resourceUri) {
        return this.resolve(preferenceName, resourceUri).value;
    }
    /**
     * Resolve the value for the given preference and resource URI.
     *
     * @param preferenceName the preference identifier.
     * @param resourceUri the URI of the resource for which this provider should resolve the preference. This is used to retrieve
     * a potentially different value for the same preference for different resources, for example `files.encoding`.
     *
     * @returns an object containing the value stored for the given preference and resourceUri if it exists,
     * otherwise `undefined`.
     */
    resolve(preferenceName, resourceUri) {
        // const value = this.getPreferences(resourceUri)[preferenceName];
        // if (value !== undefined) {
        //     return {
        //         value,
        //         configUri: this.getConfigUri(resourceUri)
        //     };
        // }
        return {};
    }
    /**
     * Retrieve the domain for this provider.
     *
     * @returns the domain or `undefined` if this provider is suitable for all domains.
     */
    getDomain() {
        return undefined;
    }
    /**
     * Retrieve the configuration URI for the given resource URI.
     * @param resourceUri the uri of the resource or `undefined`.
     * @param sectionName the section to return the URI for, e.g. `tasks` or `launch`. Defaults to settings.
     *
     * @returns the corresponding resource URI or `undefined` if there is no valid URI.
     */
    getConfigUri(resourceUri, sectionName) {
        return undefined;
    }
    /**
     * Informs the listeners that one or more preferences of this provider are changed.
     * The listeners are able to find what was changed from the emitted event.
     */
    emitPreferencesChangedEvent(changes) {
        if (Array.isArray(changes)) {
            for (const change of changes) {
                this.mergePreferenceProviderDataChange(change);
            }
        }
        else {
            for (const preferenceName of Object.keys(changes)) {
                this.mergePreferenceProviderDataChange(changes[preferenceName]);
            }
        }
        return this._pendingChanges = this.fireDidPreferencesChanged();
    }
    mergePreferenceProviderDataChange(change) {
        if (!this.deferredChanges) {
            this.deferredChanges = {};
        }
        const current = this.deferredChanges[change.preferenceName];
        const { newValue, scope, domain } = change;
        if (!current) {
            // new
            this.deferredChanges[change.preferenceName] = change;
        }
        else if (current.oldValue === newValue) {
            // delete
            delete this.deferredChanges[change.preferenceName];
        }
        else {
            // update
            Object.assign(current, { newValue, scope, domain });
        }
    }
    getParsedContent(jsonData) {
        const preferences = {};
        if (typeof jsonData !== 'object') {
            return preferences;
        }
        // eslint-disable-next-line guard-for-in
        for (const preferenceName in jsonData) {
            const preferenceValue = jsonData[preferenceName];
            if (this.preferenceOverrideService.testOverrideValue(preferenceName, preferenceValue)) {
                // eslint-disable-next-line guard-for-in
                for (const overriddenPreferenceName in preferenceValue) {
                    const overriddenValue = preferenceValue[overriddenPreferenceName];
                    preferences[`${preferenceName}.${overriddenPreferenceName}`] = overriddenValue;
                }
            }
            else {
                preferences[preferenceName] = preferenceValue;
            }
        }
        return preferences;
    }
};
__decorate([
    inject(PreferenceLanguageOverrideService)
], PreferenceProvider.prototype, "preferenceOverrideService", void 0);
PreferenceProvider = __decorate([
    injectable()
], PreferenceProvider);
export { PreferenceProvider };

//# sourceMappingURL=../../../lib/browser/preferences/preference-provider.js.map
