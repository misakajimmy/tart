import { interfaces } from 'inversify';
import { PreferenceConfigurations } from './preference-configurations';
import { PreferenceProvider, PreferenceProviderDataChange } from './preference-provider';
import { PreferenceDataProperty, PreferenceDataSchema, PreferenceItem, PreferenceSchema, PreferenceSchemaProperties } from '../../common/preferences/preference-schema';
import { ContributionProvider, Disposable, Emitter, Event } from '../../common';
import { PreferenceScope } from './preference-scope';
import { FrontendApplicationConfig } from '../application-props';
export { PreferenceSchema, PreferenceSchemaProperties, PreferenceDataSchema, PreferenceItem, PreferenceDataProperty };
export declare const PreferenceContribution: unique symbol;
export interface PreferenceContribution {
    readonly schema: PreferenceSchema;
}
export declare function bindPreferenceSchemaProvider(bind: interfaces.Bind): void;
/**
 * Specialized {@link FrontendApplicationConfig} to configure default
 * preference values for the {@link PreferenceSchemaProvider}.
 */
export interface FrontendApplicationPreferenceConfig extends FrontendApplicationConfig {
    preferences: {
        [preferenceName: string]: any;
    };
}
export declare namespace FrontendApplicationPreferenceConfig {
    function is(config: FrontendApplicationConfig): config is FrontendApplicationPreferenceConfig;
}
/**
 * The {@link PreferenceSchemaProvider} collects all {@link PreferenceContribution}s and combines
 * the preference schema provided by these contributions into one collective schema. The preferences which
 * are provided by this {@link PreferenceProvider} are derived from this combined schema.
 */
export declare class PreferenceSchemaProvider extends PreferenceProvider {
    protected readonly preferences: {
        [name: string]: any;
    };
    protected readonly combinedSchema: PreferenceDataSchema;
    protected readonly workspaceSchema: PreferenceDataSchema;
    protected readonly folderSchema: PreferenceDataSchema;
    protected readonly preferenceContributions: ContributionProvider<PreferenceContribution>;
    protected readonly configurations: PreferenceConfigurations;
    protected readonly onDidPreferenceSchemaChangedEmitter: Emitter<void>;
    readonly onDidPreferenceSchemaChanged: Event<void>;
    protected readonly overridePatternProperties: Required<Pick<PreferenceDataProperty, 'properties' | 'additionalProperties'>> & PreferenceDataProperty;
    getPreferences(): {
        [name: string]: any;
    };
    setSchema(schema: PreferenceSchema): Disposable;
    setPreference(): Promise<boolean>;
    isValidInScope(preferenceName: string, scope: PreferenceScope): boolean;
    getPreferenceNames(): IterableIterator<string>;
    getOverridePreferenceNames(preferenceName: string): IterableIterator<string>;
    getCombinedSchema(): PreferenceDataSchema;
    protected doUnsetSchema(changes: PreferenceProviderDataChange[]): PreferenceProviderDataChange[];
    protected fireDidPreferenceSchemaChanged(): void;
    protected removePropFromSchemas(key: string): void;
    protected init(): void;
    protected readConfiguredPreferences(): void;
    protected doSetSchema(schema: PreferenceSchema): PreferenceProviderDataChange[];
    protected doSetPreferenceValue(preferenceName: string, newValue: any, { scope, domain }: {
        scope: PreferenceScope;
        domain?: string[];
    }): PreferenceProviderDataChange;
    protected getDefaultValue(property: PreferenceItem): any;
    protected getConfiguredDefault(preferenceName: string): any;
    protected updateSchemaProps(key: string, property: PreferenceDataProperty): void;
}
