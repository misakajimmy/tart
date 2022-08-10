/********************************************************************************
 * Copyright (C) 2018 Redhat, Ericsson and others.
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
import { IOnigLib, Registry } from 'vscode-textmate';
import { ContributionProvider, Disposable, DisposableCollection } from '@tart/core/lib/common';
import { FrontendApplicationContribution } from '@tart/core/lib/browser';
import { ThemeService } from '@tart/core/lib/browser/theming';
import { LanguageGrammarDefinitionContribution } from './textmate-contribution';
import { TokenizerOption } from './textmate-tokenizer';
import { TextmateRegistry } from './textmate-registry';
import { MonacoThemeRegistry } from './monaco-theme-registry';
export declare const OnigasmPromise: unique symbol;
export declare type OnigasmPromise = Promise<IOnigLib>;
export declare class MonacoTextmateService implements FrontendApplicationContribution {
    protected readonly tokenizerOption: TokenizerOption;
    protected readonly _activatedLanguages: Set<string>;
    protected grammarRegistry: Registry;
    protected readonly grammarProviders: ContributionProvider<LanguageGrammarDefinitionContribution>;
    protected readonly textmateRegistry: TextmateRegistry;
    protected readonly onigasmPromise: OnigasmPromise;
    protected readonly themeService: ThemeService;
    protected readonly monacoThemeRegistry: MonacoThemeRegistry;
    protected readonly toDisposeOnUpdateTheme: DisposableCollection;
    protected get currentEditorTheme(): string;
    initialize(): void;
    activateLanguage(language: string): Disposable;
    protected updateTheme(): void;
    protected doActivateLanguage(languageId: string, toDispose: DisposableCollection): Promise<void>;
    protected waitForLanguage(language: string, cb: () => {}): Disposable;
}
