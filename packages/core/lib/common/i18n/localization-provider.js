var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
let LocalizationProvider = class LocalizationProvider {
    localizations = new Map();
    currentLanguage = 'en';
    addLocalizations(...localizations) {
        for (const localization of localizations) {
            let merged = this.localizations.get(localization.languageId);
            if (!merged) {
                this.localizations.set(localization.languageId, merged = {
                    languageId: localization.languageId,
                    languageName: localization.languageName,
                    localizedLanguageName: localization.localizedLanguageName,
                    translations: {}
                });
            }
            merged.languagePack = merged.languagePack || localization.languagePack;
            Object.assign(merged.translations, localization.translations);
        }
    }
    setCurrentLanguage(languageId) {
        this.currentLanguage = languageId;
    }
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    getAvailableLanguages(all) {
        const languageIds = [];
        for (const localization of this.localizations.values()) {
            if (all || localization.languagePack) {
                languageIds.push(localization.languageId);
            }
        }
        return languageIds.sort((a, b) => a.localeCompare(b));
    }
    loadLocalization(languageId) {
        return this.localizations.get(languageId) || {
            languageId,
            translations: {}
        };
    }
};
LocalizationProvider = __decorate([
    injectable()
], LocalizationProvider);
export { LocalizationProvider };

//# sourceMappingURL=../../../lib/common/i18n/localization-provider.js.map
