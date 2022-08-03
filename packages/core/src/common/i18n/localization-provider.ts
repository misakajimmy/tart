import {Localization} from './localization';
import {injectable} from 'inversify';

@injectable()
export class LocalizationProvider {

  protected localizations = new Map<string, Localization>();
  protected currentLanguage = 'en';

  addLocalizations(...localizations: Localization[]): void {
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

  setCurrentLanguage(languageId: string): void {
    this.currentLanguage = languageId;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getAvailableLanguages(all?: boolean): string[] {
    const languageIds: string[] = [];
    for (const localization of this.localizations.values()) {
      if (all || localization.languagePack) {
        languageIds.push(localization.languageId);
      }
    }
    return languageIds.sort((a, b) => a.localeCompare(b));
  }

  loadLocalization(languageId: string): Localization {
    return this.localizations.get(languageId) || {
      languageId,
      translations: {}
    };
  }

}
