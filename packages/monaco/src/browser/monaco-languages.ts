import {WorkspaceSymbolParams} from 'vscode-languageserver-protocol';
import {CancellationToken, Disposable, MaybePromise, Mutable} from '@tart/core/lib/common';
import {Diagnostic, SymbolInformation} from 'vscode-languageserver-types';
import {inject, injectable, postConstruct} from 'inversify';
import {Language, LanguageService} from '@tart/core/lib/browser/language-service';
import URI from '@tart/core/lib/common/uri';
import {MonacoDiagnosticCollection} from './monaco-diagnostic-collection';
import {ProtocolToMonacoConverter} from './protocol-to-monaco-converter';

export interface WorkspaceSymbolProvider {
    provideWorkspaceSymbols(params: WorkspaceSymbolParams, token: CancellationToken): MaybePromise<SymbolInformation[] | undefined>;

    resolveWorkspaceSymbol?(symbol: SymbolInformation, token: CancellationToken): Thenable<SymbolInformation | undefined>
}

@injectable()
export class MonacoLanguages implements LanguageService {

    readonly workspaceSymbolProviders: WorkspaceSymbolProvider[] = [];

    protected readonly makers = new Map<string, MonacoDiagnosticCollection>();

    // @inject(ProblemManager) protected readonly problemManager: ProblemManager;
    @inject(ProtocolToMonacoConverter) protected readonly p2m: ProtocolToMonacoConverter;

    get languages(): Language[] {
        return [...this.mergeLanguages(monaco.languages.getLanguages()).values()];
    }

    registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider): Disposable {
        this.workspaceSymbolProviders.push(provider);
        return Disposable.create(() => {
            const index = this.workspaceSymbolProviders.indexOf(provider);
            if (index !== -1) {
                this.workspaceSymbolProviders.splice(index, 1);
            }
        });
    }

    getLanguage(languageId: string): Language | undefined {
        return this.mergeLanguages(monaco.languages.getLanguages().filter(language => language.id === languageId)).get(languageId);
    }

    @postConstruct()
    protected init(): void {
        // for (const uri of this.problemManager.getUris()) {
        //     this.updateMarkers(new URI(uri));
        // }
        // this.problemManager.onDidChangeMarkers(uri => this.updateMarkers(uri));
    }

    protected updateMarkers(uri: URI): void {
        const uriString = uri.toString();
        const owners = new Map<string, Diagnostic[]>();
        // for (const marker of this.problemManager.findMarkers({ uri })) {
        //     const diagnostics = owners.get(marker.owner) || [];
        //     diagnostics.push(marker.data);
        //     owners.set(marker.owner, diagnostics);
        // }
        const toClean = new Set<string>(this.makers.keys());
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

    protected mergeLanguages(registered: monaco.languages.ILanguageExtensionPoint[]): Map<string, Mutable<Language>> {
        const languages = new Map<string, Mutable<Language>>();
        for (const {id, aliases, extensions, filenames} of registered) {
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

}
