import { Localization } from './localization';
export declare class LocalizationProvider {
    protected localizations: Map<string, Localization>;
    protected currentLanguage: string;
    addLocalizations(...localizations: Localization[]): void;
    setCurrentLanguage(languageId: string): void;
    getCurrentLanguage(): string;
    getAvailableLanguages(all?: boolean): string[];
    loadLocalization(languageId: string): Localization;
}
