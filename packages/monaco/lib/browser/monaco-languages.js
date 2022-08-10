var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Disposable } from '@tart/core/lib/common';
import { inject, injectable, postConstruct } from 'inversify';
import { MonacoDiagnosticCollection } from './monaco-diagnostic-collection';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
let MonacoLanguages = class MonacoLanguages {
    constructor() {
        this.workspaceSymbolProviders = [];
        this.makers = new Map();
    }
    get languages() {
        return [...this.mergeLanguages(monaco.languages.getLanguages()).values()];
    }
    registerWorkspaceSymbolProvider(provider) {
        this.workspaceSymbolProviders.push(provider);
        return Disposable.create(() => {
            const index = this.workspaceSymbolProviders.indexOf(provider);
            if (index !== -1) {
                this.workspaceSymbolProviders.splice(index, 1);
            }
        });
    }
    getLanguage(languageId) {
        return this.mergeLanguages(monaco.languages.getLanguages().filter(language => language.id === languageId)).get(languageId);
    }
    init() {
        // for (const uri of this.problemManager.getUris()) {
        //     this.updateMarkers(new URI(uri));
        // }
        // this.problemManager.onDidChangeMarkers(uri => this.updateMarkers(uri));
    }
    updateMarkers(uri) {
        const uriString = uri.toString();
        const owners = new Map();
        // for (const marker of this.problemManager.findMarkers({ uri })) {
        //     const diagnostics = owners.get(marker.owner) || [];
        //     diagnostics.push(marker.data);
        //     owners.set(marker.owner, diagnostics);
        // }
        const toClean = new Set(this.makers.keys());
        for (const [owner, diagnostics] of owners) {
            toClean.delete(owner);
            const collection = this.makers.get(owner) || new MonacoDiagnosticCollection(owner, this.p2m);
            collection.set(uriString, diagnostics);
            this.makers.set(owner, collection);
        }
        for (const owner of toClean) {
            const collection = this.makers.get(owner);
            if (collection) {
                collection.set(uriString, []);
            }
        }
    }
    mergeLanguages(registered) {
        const languages = new Map();
        for (const { id, aliases, extensions, filenames } of registered) {
            const merged = languages.get(id) || {
                id,
                name: '',
                extensions: new Set(),
                filenames: new Set()
            };
            if (!merged.name && aliases && aliases.length) {
                merged.name = aliases[0];
            }
            if (extensions && extensions.length) {
                for (const extension of extensions) {
                    merged.extensions.add(extension);
                }
            }
            if (filenames && filenames.length) {
                for (const filename of filenames) {
                    merged.filenames.add(filename);
                }
            }
            languages.set(id, merged);
        }
        for (const [id, language] of languages) {
            if (!language.name) {
                language.name = id;
            }
        }
        return languages;
    }
};
__decorate([
    inject(ProtocolToMonacoConverter)
], MonacoLanguages.prototype, "p2m", void 0);
__decorate([
    postConstruct()
], MonacoLanguages.prototype, "init", null);
MonacoLanguages = __decorate([
    injectable()
], MonacoLanguages);
export { MonacoLanguages };

//# sourceMappingURL=../../lib/browser/monaco-languages.js.map
