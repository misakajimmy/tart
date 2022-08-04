import { ContributionProvider } from '../contribution-provider';
import { Localization } from './localization';
import { LocalizationProvider } from './localization-provider';
import { FrontendApplicationContribution } from '../../browser';
export declare const LocalizationContribution: unique symbol;
export interface LocalizationContribution {
    registerLocalizations(registry: LocalizationRegistry): void;
}
export declare class LocalizationRegistry implements FrontendApplicationContribution {
    protected readonly localizationProvider: LocalizationProvider;
    protected readonly contributions: ContributionProvider<LocalizationContribution>;
    initialize(): void;
    registerLocalization(localization: Localization): void;
    registerLocalizationFromRequire(locale: string, required: unknown): void;
    protected flattenTranslations(localization: unknown): Record<string, string>;
    protected identifyLocale(localizationPath: string): string | undefined;
}
