/// <reference types="@theia/monaco-editor-core/monaco" />
import { WorkspaceSymbolParams } from 'vscode-languageserver-protocol';
import { CancellationToken, Disposable, MaybePromise, Mutable } from '@tart/core/lib/common';
import { SymbolInformation } from 'vscode-languageserver-types';
import { Language, LanguageService } from '@tart/core/lib/browser/language-service';
import URI from '@tart/core/lib/common/uri';
import { MonacoDiagnosticCollection } from './monaco-diagnostic-collection';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
export interface WorkspaceSymbolProvider {
    provideWorkspaceSymbols(params: WorkspaceSymbolParams, token: CancellationToken): MaybePromise<SymbolInformation[] | undefined>;
    resolveWorkspaceSymbol?(symbol: SymbolInformation, token: CancellationToken): Thenable<SymbolInformation | undefined>;
}
export declare class MonacoLanguages implements LanguageService {
    readonly workspaceSymbolProviders: WorkspaceSymbolProvider[];
    protected readonly makers: Map<string, MonacoDiagnosticCollection>;
    protected readonly p2m: ProtocolToMonacoConverter;
    get languages(): Language[];
    registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider): Disposable;
    getLanguage(languageId: string): Language | undefined;
    protected init(): void;
    protected updateMarkers(uri: URI): void;
    protected mergeLanguages(registered: monaco.languages.ILanguageExtensionPoint[]): Map<string, Mutable<Language>>;
}
