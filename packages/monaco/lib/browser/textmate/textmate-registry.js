var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { Disposable } from '@tart/core/lib/common';
let TextmateRegistry = class TextmateRegistry {
    constructor() {
        this.scopeToProvider = new Map();
        this.languageToConfig = new Map();
        this.languageIdToScope = new Map();
    }
    get languages() {
        return this.languageIdToScope.keys();
    }
    registerTextmateGrammarScope(scope, provider) {
        const providers = this.scopeToProvider.get(scope) || [];
        const existingProvider = providers[0];
        if (existingProvider) {
            Promise.all([existingProvider.getGrammarDefinition(), provider.getGrammarDefinition()]).then(([a, b]) => {
                if (a.location !== b.location || !a.location && !b.location) {
                    console.warn(`a registered grammar provider for '${scope}' scope is overridden`);
                }
            });
        }
        providers.unshift(provider);
        this.scopeToProvider.set(scope, providers);
        return Disposable.create(() => {
            const index = providers.indexOf(provider);
            if (index !== -1) {
                providers.splice(index, 1);
            }
        });
    }
    getProvider(scope) {
        const providers = this.scopeToProvider.get(scope);
        return providers && providers[0];
    }
    mapLanguageIdToTextmateGrammar(languageId, scope) {
        const scopes = this.languageIdToScope.get(languageId) || [];
        const existingScope = scopes[0];
        if (typeof existingScope === 'string') {
            console.warn(`'${languageId}' language is remapped from '${existingScope}' to '${scope}' scope`);
        }
        scopes.unshift(scope);
        this.languageIdToScope.set(languageId, scopes);
        return Disposable.create(() => {
            const index = scopes.indexOf(scope);
            if (index !== -1) {
                scopes.splice(index, 1);
            }
        });
    }
    getScope(languageId) {
        const scopes = this.languageIdToScope.get(languageId);
        return scopes && scopes[0];
    }
    getLanguageId(scope) {
        for (const languageId of this.languageIdToScope.keys()) {
            if (this.getScope(languageId) === scope) {
                return languageId;
            }
        }
        return undefined;
    }
    registerGrammarConfiguration(languageId, config) {
        const configs = this.languageToConfig.get(languageId) || [];
        const existingConfig = configs[0];
        if (existingConfig) {
            console.warn(`a registered grammar configuration for '${languageId}' language is overridden`);
        }
        configs.unshift(config);
        this.languageToConfig.set(languageId, configs);
        return Disposable.create(() => {
            const index = configs.indexOf(config);
            if (index !== -1) {
                configs.splice(index, 1);
            }
        });
    }
    getGrammarConfiguration(languageId) {
        const configs = this.languageToConfig.get(languageId);
        return configs && configs[0] || {};
    }
};
TextmateRegistry = __decorate([
    injectable()
], TextmateRegistry);
export { TextmateRegistry };

//# sourceMappingURL=../../../lib/browser/textmate/textmate-registry.js.map
