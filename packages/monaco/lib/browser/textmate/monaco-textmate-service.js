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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named } from 'inversify';
import { parseRawGrammar, Registry } from 'vscode-textmate';
import { ContributionProvider, Disposable, DisposableCollection } from '@tart/core/lib/common';
import { ThemeService } from '@tart/core/lib/browser/theming';
import { getEncodedLanguageId, LanguageGrammarDefinitionContribution } from './textmate-contribution';
import { createTextmateTokenizer } from './textmate-tokenizer';
import { TextmateRegistry } from './textmate-registry';
import { MonacoThemeRegistry } from './monaco-theme-registry';
export const OnigasmPromise = Symbol('OnigasmPromise');
let MonacoTextmateService = class MonacoTextmateService {
    constructor() {
        this.tokenizerOption = {
            lineLimit: 400
        };
        this._activatedLanguages = new Set();
        this.toDisposeOnUpdateTheme = new DisposableCollection();
    }
    get currentEditorTheme() {
        return this.themeService.getCurrentTheme().editorTheme || 'dark-wm';
    }
    initialize() {
        // if (!isBasicWasmSupported) {
        //     console.log('Textmate support deactivated because WebAssembly is not detected.');
        //     return;
        // }
        for (const grammarProvider of this.grammarProviders.getContributions()) {
            try {
                grammarProvider.registerTextmateLanguage(this.textmateRegistry);
            }
            catch (err) {
                console.error(err);
            }
        }
        this.grammarRegistry = new Registry({
            getOnigLib: () => this.onigasmPromise,
            theme: this.monacoThemeRegistry.getThemeData(this.currentEditorTheme),
            loadGrammar: async (scopeName) => {
                const provider = this.textmateRegistry.getProvider(scopeName);
                if (provider) {
                    const definition = await provider.getGrammarDefinition();
                    let rawGrammar;
                    if (typeof definition.content === 'string') {
                        rawGrammar = parseRawGrammar(definition.content, definition.format === 'json' ? 'grammar.json' : 'grammar.plist');
                    }
                    else {
                        rawGrammar = definition.content;
                    }
                    return rawGrammar;
                }
                return undefined;
            },
            getInjections: (scopeName) => {
                const provider = this.textmateRegistry.getProvider(scopeName);
                if (provider && provider.getInjections) {
                    return provider.getInjections(scopeName);
                }
                return [];
            }
        });
        // this.tokenizerOption.lineLimit = this.preferences['editor.maxTokenizationLineLength'];
        // this.preferences.onPreferenceChanged(e => {
        //     if (e.preferenceName === 'editor.maxTokenizationLineLength') {
        //         this.tokenizerOption.lineLimit = e.newValue;
        //     }
        // });
        this.updateTheme();
        this.themeService.onDidColorThemeChange(() => this.updateTheme());
        for (const id of this.textmateRegistry.languages) {
            this.activateLanguage(id);
        }
    }
    activateLanguage(language) {
        const toDispose = new DisposableCollection(Disposable.create(() => {
        }));
        toDispose.push(this.waitForLanguage(language, () => this.doActivateLanguage(language, toDispose)));
        return toDispose;
    }
    updateTheme() {
        this.toDisposeOnUpdateTheme.dispose();
        const currentEditorTheme = this.currentEditorTheme;
        document.body.classList.add(currentEditorTheme);
        this.toDisposeOnUpdateTheme.push(Disposable.create(() => document.body.classList.remove(currentEditorTheme)));
        // first update registry to run tokenization with the proper theme
        const theme = this.monacoThemeRegistry.getThemeData(currentEditorTheme);
        if (theme) {
            this.grammarRegistry.setTheme(theme);
        }
        // then trigger tokenization by setting monaco theme
        monaco.editor.setTheme(currentEditorTheme);
        monaco.services.StaticServices.standaloneThemeService.get().setTheme(currentEditorTheme);
    }
    async doActivateLanguage(languageId, toDispose) {
        if (this._activatedLanguages.has(languageId)) {
            return;
        }
        this._activatedLanguages.add(languageId);
        toDispose.push(Disposable.create(() => this._activatedLanguages.delete(languageId)));
        const scopeName = this.textmateRegistry.getScope(languageId);
        if (!scopeName) {
            return;
        }
        const provider = this.textmateRegistry.getProvider(scopeName);
        if (!provider) {
            return;
        }
        const configuration = this.textmateRegistry.getGrammarConfiguration(languageId);
        const initialLanguage = getEncodedLanguageId(languageId);
        await this.onigasmPromise;
        if (toDispose.disposed) {
            return;
        }
        try {
            const grammar = await this.grammarRegistry.loadGrammarWithConfiguration(scopeName, initialLanguage, configuration);
            if (toDispose.disposed) {
                return;
            }
            if (!grammar) {
                throw new Error(`no grammar for ${scopeName}, ${initialLanguage}, ${JSON.stringify(configuration)}`);
            }
            const options = configuration.tokenizerOption ? configuration.tokenizerOption : this.tokenizerOption;
            const tokenizer = createTextmateTokenizer(grammar, options);
            toDispose.push(monaco.languages.setTokensProvider(languageId, tokenizer));
            const support = monaco.modes.TokenizationRegistry.get(languageId);
            const themeService = monaco.services.StaticServices.standaloneThemeService.get();
            const languageIdentifier = monaco.services.StaticServices.modeService.get().getLanguageIdentifier(languageId);
            const adapter = new monaco.services.TokenizationSupport2Adapter(themeService, languageIdentifier, tokenizer);
            support.tokenize = adapter.tokenize.bind(adapter);
        }
        catch (error) {
            console.warn('No grammar for this language id', languageId, error);
        }
    }
    waitForLanguage(language, cb) {
        const modeService = monaco.services.StaticServices.modeService.get();
        for (const modeId of Object.keys(modeService['_instantiatedModes'])) {
            const mode = modeService['_instantiatedModes'][modeId];
            if (mode.getId() === language) {
                cb();
                return Disposable.NULL;
            }
        }
        return monaco.languages.onLanguage(language, cb);
    }
};
__decorate([
    inject(ContributionProvider),
    named(LanguageGrammarDefinitionContribution)
], MonacoTextmateService.prototype, "grammarProviders", void 0);
__decorate([
    inject(TextmateRegistry)
], MonacoTextmateService.prototype, "textmateRegistry", void 0);
__decorate([
    inject(OnigasmPromise)
], MonacoTextmateService.prototype, "onigasmPromise", void 0);
__decorate([
    inject(ThemeService)
], MonacoTextmateService.prototype, "themeService", void 0);
__decorate([
    inject(MonacoThemeRegistry)
], MonacoTextmateService.prototype, "monacoThemeRegistry", void 0);
MonacoTextmateService = __decorate([
    injectable()
], MonacoTextmateService);
export { MonacoTextmateService };

//# sourceMappingURL=../../../lib/browser/textmate/monaco-textmate-service.js.map
