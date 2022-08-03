import {inject, injectable, interfaces, named, postConstruct} from 'inversify';
import {bindPreferenceConfigurations, PreferenceConfigurations} from './preference-configurations';
import {PreferenceProvider, PreferenceProviderDataChange} from './preference-provider';
import {
  PreferenceDataProperty,
  PreferenceDataSchema,
  PreferenceItem,
  PreferenceSchema,
  PreferenceSchemaProperties
} from '../../common/preferences/preference-schema';
import {bindContributionProvider, ContributionProvider, Disposable, Emitter, Event, Mutable} from '../../common';
import {PreferenceScope} from './preference-scope';
import {FrontendApplicationConfigProvider} from '../frontend-application-config-provider';
import {FrontendApplicationConfig} from '../application-props';
import {PreferenceLanguageOverrideService} from './preference-language-override-service';

export {PreferenceSchema, PreferenceSchemaProperties, PreferenceDataSchema, PreferenceItem, PreferenceDataProperty};

export const PreferenceContribution = Symbol('PreferenceContribution');

export interface PreferenceContribution {
  readonly schema: PreferenceSchema;
}

export function bindPreferenceSchemaProvider(bind: interfaces.Bind): void {
  bindPreferenceConfigurations(bind);
  bind(PreferenceSchemaProvider).toSelf().inSingletonScope();
  bind(PreferenceLanguageOverrideService).toSelf().inSingletonScope();
  bindContributionProvider(bind, PreferenceContribution);
}

/**
 * Specialized {@link FrontendApplicationConfig} to configure default
 * preference values for the {@link PreferenceSchemaProvider}.
 */
export interface FrontendApplicationPreferenceConfig extends FrontendApplicationConfig {
  preferences: {
    [preferenceName: string]: any
  }
}

export namespace FrontendApplicationPreferenceConfig {
  export function is(config: FrontendApplicationConfig): config is FrontendApplicationPreferenceConfig {
    return 'preferences' in config && typeof config['preferences'] === 'object';
  }
}


/**
 * The {@link PreferenceSchemaProvider} collects all {@link PreferenceContribution}s and combines
 * the preference schema provided by these contributions into one collective schema. The preferences which
 * are provided by this {@link PreferenceProvider} are derived from this combined schema.
 */
@injectable()
export class PreferenceSchemaProvider extends PreferenceProvider {

  protected readonly preferences: { [name: string]: any } = {};
  protected readonly combinedSchema: PreferenceDataSchema = {properties: {}, patternProperties: {}};
  protected readonly workspaceSchema: PreferenceDataSchema = {properties: {}, patternProperties: {}};
  protected readonly folderSchema: PreferenceDataSchema = {properties: {}, patternProperties: {}};

  @inject(ContributionProvider) @named(PreferenceContribution)
  protected readonly preferenceContributions: ContributionProvider<PreferenceContribution>;

  @inject(PreferenceConfigurations)
  protected readonly configurations: PreferenceConfigurations;

  protected readonly onDidPreferenceSchemaChangedEmitter = new Emitter<void>();
  readonly onDidPreferenceSchemaChanged: Event<void> = this.onDidPreferenceSchemaChangedEmitter.event;
  protected readonly overridePatternProperties: Required<Pick<PreferenceDataProperty, 'properties' | 'additionalProperties'>> & PreferenceDataProperty = {
    type: 'object',
    description: 'Configure editor settings to be overridden for a language.',
    errorMessage: 'Unknown Identifier. Use language identifiers',
    properties: {},
    additionalProperties: false
  };

  getPreferences(): { [name: string]: any } {
    return this.preferences;
  }

  setSchema(schema: PreferenceSchema): Disposable {
    const changes = this.doSetSchema(schema);
    if (!changes.length) {
      return Disposable.NULL;
    }
    this.fireDidPreferenceSchemaChanged();
    this.emitPreferencesChangedEvent(changes);
    return Disposable.create(() => {
      const inverseChanges = this.doUnsetSchema(changes);
      if (!inverseChanges.length) {
        return;
      }
      this.fireDidPreferenceSchemaChanged();
      this.emitPreferencesChangedEvent(inverseChanges);
    });
  }

  async setPreference(): Promise<boolean> {
    return false;
  }

  isValidInScope(preferenceName: string, scope: PreferenceScope): boolean {
    let property;
    const overridden = this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
    if (overridden) {
      // try from overridden schema
      property = this.overridePatternProperties[`[${overridden.overrideIdentifier}]`];
      property = property && property[overridden.preferenceName];
      if (!property) {
        // try from overridden identifier
        property = this.overridePatternProperties[overridden.preferenceName];
      }
      if (!property) {
        // try from overridden value
        property = this.combinedSchema.properties[overridden.preferenceName];
      }
    } else {
      property = this.combinedSchema.properties[preferenceName];
    }
    return property && property.scope! >= scope;
  }

  * getPreferenceNames(): IterableIterator<string> {
    for (const preferenceName in this.combinedSchema.properties) {
      yield preferenceName;
      for (const overridePreferenceName of this.getOverridePreferenceNames(preferenceName)) {
        yield overridePreferenceName;
      }
    }
  }

  getOverridePreferenceNames(preferenceName: string): IterableIterator<string> {
    const preference = this.combinedSchema.properties[preferenceName];
    if (preference && preference.overridable) {
      return this.preferenceOverrideService.getOverridePreferenceNames(preferenceName);
    }
    return [][Symbol.iterator]();
  }

  getCombinedSchema(): PreferenceDataSchema {
    return this.combinedSchema;
  }

  protected doUnsetSchema(changes: PreferenceProviderDataChange[]): PreferenceProviderDataChange[] {
    const inverseChanges: PreferenceProviderDataChange[] = [];
    for (const change of changes) {
      const preferenceName = change.preferenceName;
      const overridden = this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
      if (overridden) {
        delete this.overridePatternProperties.properties[`[${overridden.overrideIdentifier}]`];
        this.removePropFromSchemas(`[${overridden.overrideIdentifier}]`);
      } else {
        this.removePropFromSchemas(preferenceName);
      }
      const newValue = change.oldValue;
      const oldValue = change.newValue;
      const {scope, domain} = change;
      const inverseChange: Mutable<PreferenceProviderDataChange> = {preferenceName, oldValue, scope, domain};
      if (typeof newValue === undefined) {
        delete this.preferences[preferenceName];
      } else {
        inverseChange.newValue = newValue;
        this.preferences[preferenceName] = newValue;
      }
      inverseChanges.push(inverseChange);
    }
    return inverseChanges;
  }

  protected fireDidPreferenceSchemaChanged(): void {
    this.onDidPreferenceSchemaChangedEmitter.fire(undefined);
  }

  protected removePropFromSchemas(key: string): void {
    // If we remove a key from combined, it should also be removed from all narrower scopes.
    delete this.combinedSchema.properties[key];
    delete this.workspaceSchema.properties[key];
    delete this.folderSchema.properties[key];
  }

  @postConstruct()
  protected init(): void {
    this.readConfiguredPreferences();
    this.preferenceContributions.getContributions().forEach(contrib => {
      this.doSetSchema(contrib.schema);
    });
    this.combinedSchema.additionalProperties = false;
    this._ready.resolve();
  }

  protected readConfiguredPreferences(): void {
    const config = FrontendApplicationConfigProvider.get();
    if (FrontendApplicationPreferenceConfig.is(config)) {
      try {
        const configuredDefaults = config.preferences;
        const parsedDefaults = this.getParsedContent(configuredDefaults);
        Object.assign(this.preferences, parsedDefaults);
        const scope = PreferenceScope.Default;
        const domain = this.getDomain();
        const changes: PreferenceProviderDataChange[] = Object.keys(this.preferences)
            .map((key): PreferenceProviderDataChange => ({
              preferenceName: key,
              oldValue: undefined,
              newValue: this.preferences[key],
              scope,
              domain
            }));
        this.emitPreferencesChangedEvent(changes);
      } catch (e) {
        console.error('Failed to load preferences from frontend configuration.', e);
      }
    }
  }

  protected doSetSchema(schema: PreferenceSchema): PreferenceProviderDataChange[] {
    // const ajv = new Ajv();
    // const valid = ajv.validateSchema(schema);
    // if (!valid) {
    //   const errors = !!ajv.errors ? ajv.errorsText(ajv.errors) : 'unknown validation error';
    //   console.warn('A contributed preference schema has validation issues : ' + errors);
    // }
    const scope = PreferenceScope.Default;
    const domain = this.getDomain();
    const changes: PreferenceProviderDataChange[] = [];
    const defaultScope = PreferenceSchema.getDefaultScope(schema);
    const overridable = schema.overridable || false;
    for (const preferenceName of Object.keys(schema.properties)) {
      if (this.combinedSchema.properties[preferenceName]) {
        console.error('Preference name collision detected in the schema for property: ' + preferenceName);
      } else {
        const schemaProps = PreferenceDataProperty.fromPreferenceSchemaProperty(schema.properties[preferenceName], defaultScope);
        if (typeof schemaProps.overridable !== 'boolean' && overridable) {
          schemaProps.overridable = true;
        }
        if (schemaProps.overridable) {
          this.overridePatternProperties.properties[preferenceName] = schemaProps;
        }
        this.updateSchemaProps(preferenceName, schemaProps);

        const schemaDefault = this.getDefaultValue(schemaProps);
        const configuredDefault = this.getConfiguredDefault(preferenceName);
        if (this.preferenceOverrideService.testOverrideValue(preferenceName, schemaDefault)) {
          schemaProps.defaultValue = PreferenceSchemaProperties.is(configuredDefault)
              ? PreferenceProvider.merge(schemaDefault, configuredDefault)
              : schemaDefault;
          for (const overriddenPreferenceName in schemaProps.defaultValue) {
            const overrideValue = schemaDefault[overriddenPreferenceName];
            const overridePreferenceName = `${preferenceName}.${overriddenPreferenceName}`;
            changes.push(this.doSetPreferenceValue(overridePreferenceName, overrideValue, {scope, domain}));
          }
        } else {
          schemaProps.defaultValue = configuredDefault === undefined ? schemaDefault : configuredDefault;
          changes.push(this.doSetPreferenceValue(preferenceName, schemaProps.defaultValue, {scope, domain}));
        }
      }
    }
    return changes;
  }

  protected doSetPreferenceValue(preferenceName: string, newValue: any, {scope, domain}: {
    scope: PreferenceScope,
    domain?: string[]
  }): PreferenceProviderDataChange {
    const oldValue = this.preferences[preferenceName];
    this.preferences[preferenceName] = newValue;
    return {preferenceName, oldValue, newValue, scope, domain};
  }

  protected getDefaultValue(property: PreferenceItem): any {
    if (property.defaultValue !== undefined) {
      return property.defaultValue;
    }
    if (property.default !== undefined) {
      return property.default;
    }
    const type = Array.isArray(property.type) ? property.type[0] : property.type;
    switch (type) {
      case 'boolean':
        return false;
      case 'integer':
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'array':
        return [];
      case 'object':
        return {};
    }
    // eslint-disable-next-line no-null/no-null
    return null;
  }

  protected getConfiguredDefault(preferenceName: string): any {
    // const config = FrontendApplicationConfigProvider.get();
    // if (preferenceName && FrontendApplicationPreferenceConfig.is(config) && preferenceName in config.preferences) {
    //     return config.preferences[preferenceName];
    // }
  }

  protected updateSchemaProps(key: string, property: PreferenceDataProperty): void {
    this.combinedSchema.properties[key] = property;

    // switch (property.scope) {
    //     case PreferenceScope.Folder:
    //         this.folderSchema.properties[key] = property;
    //     // Fall through. isValidInScope implies that User ⊃ Workspace ⊃ Folder,
    //     // so anything we add to folder should be added to workspace, but not vice versa.
    //     case PreferenceScope.Workspace:
    //         this.workspaceSchema.properties[key] = property;
    //         break;
    // }
  }
}
