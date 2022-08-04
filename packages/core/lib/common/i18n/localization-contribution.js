var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '../contribution-provider';
import { LocalizationProvider } from './localization-provider';
export const LocalizationContribution = Symbol('LocalizationContribution');
let LocalizationRegistry = class LocalizationRegistry {
    localizationProvider;
    contributions;
    initialize() {
        this.contributions.getContributions().map(contribution => contribution.registerLocalizations(this));
    }
    registerLocalization(localization) {
        this.localizationProvider.addLocalizations(localization);
    }
    registerLocalizationFromRequire(locale, required) {
        const translations = this.flattenTranslations(required);
        const localization = {
            languageId: locale,
            translations
        };
        this.registerLocalization(localization);
    }
    flattenTranslations(localization) {
        if (typeof localization === 'object' && localization) {
            const record = {};
            for (const [key, value] of Object.entries(localization)) {
                if (typeof value === 'string') {
                    record[key] = value;
                }
                else if (value && typeof value === 'object') {
                    const flattened = this.flattenTranslations(value);
                    for (const [flatKey, flatValue] of Object.entries(flattened)) {
                        record[`${key}/${flatKey}`] = flatValue;
                    }
                }
            }
            return record;
        }
        else {
            return {};
        }
    }
    identifyLocale(localizationPath) {
        const regex = /nls\.(\w+)\.json$/i;
        const match = regex.exec(localizationPath);
        if (match) {
            return match[1];
        }
        return undefined;
    }
};
__decorate([
    inject(LocalizationProvider)
], LocalizationRegistry.prototype, "localizationProvider", void 0);
__decorate([
    inject(ContributionProvider),
    named(LocalizationContribution)
], LocalizationRegistry.prototype, "contributions", void 0);
LocalizationRegistry = __decorate([
    injectable()
], LocalizationRegistry);
export { LocalizationRegistry };

//# sourceMappingURL=../../../lib/common/i18n/localization-contribution.js.map
