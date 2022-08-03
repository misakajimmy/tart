import {inject, injectable, named} from 'inversify';
import {ContributionProvider} from '../contribution-provider';
import {Localization} from './localization';
import {LocalizationProvider} from './localization-provider';
import {FrontendApplicationContribution} from '../../browser';

export const LocalizationContribution = Symbol('LocalizationContribution');

export interface LocalizationContribution {
  registerLocalizations(registry: LocalizationRegistry): void;
}

@injectable()
export class LocalizationRegistry implements FrontendApplicationContribution {

  @inject(LocalizationProvider)
  protected readonly localizationProvider: LocalizationProvider;

  @inject(ContributionProvider) @named(LocalizationContribution)
  protected readonly contributions: ContributionProvider<LocalizationContribution>;

  initialize(): void {
    this.contributions.getContributions().map(
        contribution => contribution.registerLocalizations(this)
    )
  }

  registerLocalization(localization: Localization): void {
    this.localizationProvider.addLocalizations(localization);
  }

  registerLocalizationFromRequire(locale: string, required: unknown): void {
    const translations = this.flattenTranslations(required);
    const localization: Localization = {
      languageId: locale,
      translations
    };
    this.registerLocalization(localization);
  }

  protected flattenTranslations(localization: unknown): Record<string, string> {
    if (typeof localization === 'object' && localization) {
      const record: Record<string, string> = {};
      for (const [key, value] of Object.entries(localization)) {
        if (typeof value === 'string') {
          record[key] = value;
        } else if (value && typeof value === 'object') {
          const flattened = this.flattenTranslations(value);
          for (const [flatKey, flatValue] of Object.entries(flattened)) {
            record[`${key}/${flatKey}`] = flatValue;
          }
        }
      }
      return record;
    } else {
      return {};
    }
  }

  protected identifyLocale(localizationPath: string): string | undefined {
    const regex = /nls\.(\w+)\.json$/i;
    const match = regex.exec(localizationPath);
    if (match) {
      return match[1];
    }
    return undefined;
  }
}
