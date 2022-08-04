/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
import { PreferenceSchema } from './preference-contribution';
import { PreferenceScope } from './preference-scope';
import { OverridePreferenceName } from './preference-language-override-service';
/**
 * Creates a preference proxy for typesafe preference handling.
 *
 * @param preferences the underlying preference service to use for preference handling.
 * @param promisedSchema the JSON Schema which describes which preferences are available including types and descriptions. Can be a promise.
 * @param options configuration options.
 *
 * @returns the created preference proxy.
 *
 * ### Usage
 *
 *  1. Create JSON Schema specifying your preferences
 *  2. Create Configuration type based on the JSON Schema
 *  3. Bind the return value of `createPreferenceProxy` to make your preferences available wherever needed.
 *
 * See {@link CorePreferences} for an example.
 *
 * Note that if `schema` is a Promise, most actions will be no-ops until the promise is resolved.
 */
export function createPreferenceProxy(preferences, promisedSchema, options) {
    const opts = options || {};
    const prefix = opts.prefix || '';
    const style = opts.style || 'flat';
    const isDeep = style === 'deep' || style === 'both';
    const isFlat = style === 'both' || style === 'flat';
    let schema;
    if (PreferenceSchema.is(promisedSchema)) {
        schema = promisedSchema;
    }
    else {
        promisedSchema.then(s => schema = s);
    }
    const onPreferenceChanged = (listener, thisArgs, disposables) => preferences.onPreferencesChanged(changes => {
        if (schema) {
            for (const key of Object.keys(changes)) {
                const e = changes[key];
                const overridden = preferences.overriddenPreferenceName(e.preferenceName);
                const preferenceName = overridden ? overridden.preferenceName : e.preferenceName;
                if (preferenceName.startsWith(prefix) && (!overridden || !opts.overrideIdentifier || overridden.overrideIdentifier === opts.overrideIdentifier)) {
                    if (schema.properties[preferenceName]) {
                        const { newValue, oldValue } = e;
                        listener({
                            newValue, oldValue, preferenceName,
                            affects: (resourceUri, overrideIdentifier) => {
                                if (overrideIdentifier !== undefined) {
                                    if (overridden && overridden.overrideIdentifier !== overrideIdentifier) {
                                        return false;
                                    }
                                }
                                return e.affects(resourceUri);
                            }
                        });
                    }
                }
            }
        }
    }, thisArgs, disposables);
    const unsupportedOperation = (_, __) => {
        throw new Error('Unsupported operation');
    };
    const getValue = (arg, defaultValue, resourceUri) => {
        const preferenceName = OverridePreferenceName.is(arg) ?
            preferences.overridePreferenceName(arg) :
            arg;
        return preferences.get(preferenceName, defaultValue, resourceUri || opts.resourceUri);
    };
    const ownKeys = () => {
        const properties = [];
        if (schema) {
            for (const p of Object.keys(schema.properties)) {
                if (p.startsWith(prefix)) {
                    const idx = p.indexOf('.', prefix.length);
                    if (idx !== -1 && isDeep) {
                        const pre = p.substr(prefix.length, idx - prefix.length);
                        if (properties.indexOf(pre) === -1) {
                            properties.push(pre);
                        }
                    }
                    const prop = p.substr(prefix.length);
                    if (isFlat || prop.indexOf('.') === -1) {
                        properties.push(prop);
                    }
                }
            }
        }
        return properties;
    };
    const set = (_, property, value) => {
        if (typeof property !== 'string') {
            throw new Error(`unexpected property: ${String(property)}`);
        }
        if (style === 'deep' && property.indexOf('.') !== -1) {
            return false;
        }
        if (schema) {
            const fullProperty = prefix ? prefix + property : property;
            if (schema.properties[fullProperty]) {
                preferences.set(fullProperty, value, PreferenceScope.Default);
                return true;
            }
            const newPrefix = fullProperty + '.';
            for (const p of Object.keys(schema.properties)) {
                if (p.startsWith(newPrefix)) {
                    const subProxy = createPreferenceProxy(preferences, schema, {
                        prefix: newPrefix,
                        resourceUri: opts.resourceUri,
                        overrideIdentifier: opts.overrideIdentifier,
                        style
                    });
                    for (const k of Object.keys(value)) {
                        subProxy[k] = value[k];
                    }
                }
            }
        }
        return false;
    };
    const get = (_, property) => {
        if (typeof property !== 'string') {
            throw new Error(`unexpected property: ${String(property)}`);
        }
        const fullProperty = prefix ? prefix + property : property;
        if (schema) {
            if (isFlat || property.indexOf('.') === -1) {
                if (schema.properties[fullProperty]) {
                    let value;
                    if (opts.overrideIdentifier) {
                        value = preferences.get(preferences.overridePreferenceName({
                            overrideIdentifier: opts.overrideIdentifier,
                            preferenceName: fullProperty
                        }), undefined, opts.resourceUri);
                    }
                    if (value === undefined) {
                        value = preferences.get(fullProperty, undefined, opts.resourceUri);
                    }
                    if (value === undefined) {
                        value = schema.properties[fullProperty].default;
                    }
                    return value;
                }
            }
        }
        if (property === 'onPreferenceChanged') {
            return onPreferenceChanged;
        }
        if (property === 'dispose') {
            return () => {
            };
        }
        if (property === 'ready') {
            return preferences.ready;
        }
        if (property === 'get') {
            return getValue;
        }
        if (property === 'toJSON') {
            return toJSON();
        }
        if (schema && isDeep) {
            const newPrefix = fullProperty + '.';
            for (const p of Object.keys(schema.properties)) {
                if (p.startsWith(newPrefix)) {
                    return createPreferenceProxy(preferences, schema, {
                        prefix: newPrefix,
                        resourceUri: opts.resourceUri,
                        overrideIdentifier: opts.overrideIdentifier,
                        style
                    });
                }
            }
            let value;
            let parentSegment = fullProperty;
            const segments = [];
            do {
                const index = parentSegment.lastIndexOf('.');
                segments.push(parentSegment.substring(index + 1));
                parentSegment = parentSegment.substring(0, index);
                if (parentSegment in schema.properties) {
                    value = get(_, parentSegment);
                }
            } while (parentSegment && value === undefined);
            let segment;
            while (typeof value === 'object' && (segment = segments.pop())) {
                value = value[segment];
            }
            return segments.length ? undefined : value;
        }
        return undefined;
    };
    const toJSON = () => {
        const result = {};
        for (const k of ownKeys()) {
            result[k] = get(undefined, k);
        }
        return result;
    };
    return new Proxy({}, {
        get,
        ownKeys,
        getOwnPropertyDescriptor: (_, property) => {
            if (ownKeys().indexOf(property) !== -1) {
                return {
                    enumerable: true,
                    configurable: true
                };
            }
            return {};
        },
        set,
        deleteProperty: unsupportedOperation,
        defineProperty: unsupportedOperation
    });
}

//# sourceMappingURL=../../../lib/browser/preferences/preference-proxy.js.map
