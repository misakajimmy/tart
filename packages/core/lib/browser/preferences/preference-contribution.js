var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named, postConstruct } from 'inversify';
import { bindPreferenceConfigurations, PreferenceConfigurations } from './preference-configurations';
import { PreferenceProvider } from './preference-provider';
import { PreferenceDataProperty, PreferenceSchema, PreferenceSchemaProperties } from '../../common/preferences/preference-schema';
import { bindContributionProvider, ContributionProvider, Disposable, Emitter } from '../../common';
import { PreferenceScope } from './preference-scope';
import { FrontendApplicationConfigProvider } from '../frontend-application-config-provider';
import { PreferenceLanguageOverrideService } from './preference-language-override-service';
export { PreferenceSchema, PreferenceSchemaProperties, PreferenceDataProperty };
export const PreferenceContribution = Symbol('PreferenceContribution');
export function bindPreferenceSchemaProvider(bind) {
    bindPreferenceConfigurations(bind);
    bind(PreferenceSchemaProvider).toSelf().inSingletonScope();
    bind(PreferenceLanguageOverrideService).toSelf().inSingletonScope();
    bindContributionProvider(bind, PreferenceContribution);
}
export var FrontendApplicationPreferenceConfig;
(function (FrontendApplicationPreferenceConfig) {
    function is(config) {
        return 'preferences' in config && typeof config['preferences'] === 'object';
    }
    FrontendApplicationPreferenceConfig.is = is;
})(FrontendApplicationPreferenceConfig || (FrontendApplicationPreferenceConfig = {}));
/**
 * The {@link PreferenceSchemaProvider} collects all {@link PreferenceContribution}s and combines
 * the preference schema provided by these contributions into one collective schema. The preferences which
 * are provided by this {@link PreferenceProvider} are derived from this combined schema.
 */
let PreferenceSchemaProvider = class PreferenceSchemaProvider extends PreferenceProvider {
    preferences = {};
    combinedSchema = { properties: {}, patternProperties: {} };
    workspaceSchema = { properties: {}, patternProperties: {} };
    folderSchema = { properties: {}, patternProperties: {} };
    preferenceContributions;
    configurations;
    onDidPreferenceSchemaChangedEmitter = new Emitter();
    onDidPreferenceSchemaChanged = this.onDidPreferenceSchemaChangedEmitter.event;
    overridePatternProperties = {
        type: 'object',
        description: 'Configure editor settings to be overridden for a language.',
        errorMessage: 'Unknown Identifier. Use language identifiers',
        properties: {},
        additionalProperties: false
    };
    getPreferences() {
        return this.preferences;
    }
    setSchema(schema) {
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
    async setPreference() {
        return false;
    }
    isValidInScope(preferenceName, scope) {
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
        }
        else {
            property = this.combinedSchema.properties[preferenceName];
        }
        return property && property.scope >= scope;
    }
    *getPreferenceNames() {
        for (const preferenceName in this.combinedSchema.properties) {
            yield preferenceName;
            for (const overridePreferenceName of this.getOverridePreferenceNames(preferenceName)) {
                yield overridePreferenceName;
            }
        }
    }
    getOverridePreferenceNames(preferenceName) {
        const preference = this.combinedSchema.properties[preferenceName];
        if (preference && preference.overridable) {
            return this.preferenceOverrideService.getOverridePreferenceNames(preferenceName);
        }
        return [][Symbol.iterator]();
    }
    getCombinedSchema() {
        return this.combinedSchema;
    }
    doUnsetSchema(changes) {
        const inverseChanges = [];
        for (const change of changes) {
            const preferenceName = change.preferenceName;
            const overridden = this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
            if (overridden) {
                delete this.overridePatternProperties.properties[`[${overridden.overrideIdentifier}]`];
                this.removePropFromSchemas(`[${overridden.overrideIdentifier}]`);
            }
            else {
                this.removePropFromSchemas(preferenceName);
            }
            const newValue = change.oldValue;
            const oldValue = change.newValue;
            const { scope, domain } = change;
            const inverseChange = { preferenceName, oldValue, scope, domain };
            if (typeof newValue === undefined) {
                delete this.preferences[preferenceName];
            }
            else {
                inverseChange.newValue = newValue;
                this.preferences[preferenceName] = newValue;
            }
            inverseChanges.push(inverseChange);
        }
        return inverseChanges;
    }
    fireDidPreferenceSchemaChanged() {
        this.onDidPreferenceSchemaChangedEmitter.fire(undefined);
    }
    removePropFromSchemas(key) {
        // If we remove a key from combined, it should also be removed from all narrower scopes.
        delete this.combinedSchema.properties[key];
        delete this.workspaceSchema.properties[key];
        delete this.folderSchema.properties[key];
    }
    init() {
        this.readConfiguredPreferences();
        this.preferenceContributions.getContributions().forEach(contrib => {
            this.doSetSchema(contrib.schema);
        });
        this.combinedSchema.additionalProperties = false;
        this._ready.resolve();
    }
    readConfiguredPreferences() {
        const config = FrontendApplicationConfigProvider.get();
        if (FrontendApplicationPreferenceConfig.is(config)) {
            try {
                const configuredDefaults = config.preferences;
                const parsedDefaults = this.getParsedContent(configuredDefaults);
                Object.assign(this.preferences, parsedDefaults);
                const scope = PreferenceScope.Default;
                const domain = this.getDomain();
                const changes = Object.keys(this.preferences)
                    .map((key) => ({
                    preferenceName: key,
                    oldValue: undefined,
                    newValue: this.preferences[key],
                    scope,
                    domain
                }));
                this.emitPreferencesChangedEvent(changes);
            }
            catch (e) {
                console.error('Failed to load preferences from frontend configuration.', e);
            }
        }
    }
    doSetSchema(schema) {
        // const ajv = new Ajv();
        // const valid = ajv.validateSchema(schema);
        // if (!valid) {
        //   const errors = !!ajv.errors ? ajv.errorsText(ajv.errors) : 'unknown validation error';
        //   console.warn('A contributed preference schema has validation issues : ' + errors);
        // }
        const scope = PreferenceScope.Default;
        const domain = this.getDomain();
        const changes = [];
        const defaultScope = PreferenceSchema.getDefaultScope(schema);
        const overridable = schema.overridable || false;
        for (const preferenceName of Object.keys(schema.properties)) {
            if (this.combinedSchema.properties[preferenceName]) {
                console.error('Preference name collision detected in the schema for property: ' + preferenceName);
            }
            else {
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
                        changes.push(this.doSetPreferenceValue(overridePreferenceName, overrideValue, { scope, domain }));
                    }
                }
                else {
                    schemaProps.defaultValue = configuredDefault === undefined ? schemaDefault : configuredDefault;
                    changes.push(this.doSetPreferenceValue(preferenceName, schemaProps.defaultValue, { scope, domain }));
                }
            }
        }
        return changes;
    }
    doSetPreferenceValue(preferenceName, newValue, { scope, domain }) {
        const oldValue = this.preferences[preferenceName];
        this.preferences[preferenceName] = newValue;
        return { preferenceName, oldValue, newValue, scope, domain };
    }
    getDefaultValue(property) {
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
    getConfiguredDefault(preferenceName) {
        // const config = FrontendApplicationConfigProvider.get();
        // if (preferenceName && FrontendApplicationPreferenceConfig.is(config) && preferenceName in config.preferences) {
        //     return config.preferences[preferenceName];
        // }
    }
    updateSchemaProps(key, property) {
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
};
__decorate([
    inject(ContributionProvider),
    named(PreferenceContribution)
], PreferenceSchemaProvider.prototype, "preferenceContributions", void 0);
__decorate([
    inject(PreferenceConfigurations)
], PreferenceSchemaProvider.prototype, "configurations", void 0);
__decorate([
    postConstruct()
], PreferenceSchemaProvider.prototype, "init", null);
PreferenceSchemaProvider = __decorate([
    injectable()
], PreferenceSchemaProvider);
export { PreferenceSchemaProvider };

//# sourceMappingURL=../../../lib/browser/preferences/preference-contribution.js.map
