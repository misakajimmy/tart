/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PreferenceScope } from './preference-scope';
export var PreferenceSchema;
(function (PreferenceSchema) {
    function is(obj) {
        return !!obj && ('properties' in obj) && PreferenceSchemaProperties.is(obj['properties']);
    }
    PreferenceSchema.is = is;
    function getDefaultScope(schema) {
        let defaultScope;
        // let defaultScope: PreferenceScope = PreferenceScope.Workspace;
        if (!PreferenceScope.is(schema.scope)) {
            defaultScope = PreferenceScope.fromString(schema.scope);
            // defaultScope = PreferenceScope.fromString(<string>schema.scope) || PreferenceScope.Workspace;
        }
        else {
            defaultScope = schema.scope;
        }
        return defaultScope;
    }
    PreferenceSchema.getDefaultScope = getDefaultScope;
})(PreferenceSchema || (PreferenceSchema = {}));
export var PreferenceSchemaProperties;
(function (PreferenceSchemaProperties) {
    function is(obj) {
        return !!obj && typeof obj === 'object';
    }
    PreferenceSchemaProperties.is = is;
})(PreferenceSchemaProperties || (PreferenceSchemaProperties = {}));
export var PreferenceDataProperty;
(function (PreferenceDataProperty) {
    function fromPreferenceSchemaProperty(schemaProps, defaultScope) {
        // export function fromPreferenceSchemaProperty(schemaProps: PreferenceSchemaProperty, defaultScope: PreferenceScope = PreferenceScope.Workspace): PreferenceDataProperty {
        if (!schemaProps.scope) {
            schemaProps.scope = defaultScope;
        }
        else if (typeof schemaProps.scope === 'string') {
            return Object.assign(schemaProps, { scope: PreferenceScope.fromString(schemaProps.scope) || defaultScope });
        }
        return schemaProps;
    }
    PreferenceDataProperty.fromPreferenceSchemaProperty = fromPreferenceSchemaProperty;
})(PreferenceDataProperty || (PreferenceDataProperty = {}));

//# sourceMappingURL=../../../lib/common/preferences/preference-schema.js.map
