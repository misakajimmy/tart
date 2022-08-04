/********************************************************************************
 * Copyright (C) 2021 TypeFox and others.
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
export const localizationPath = '/services/i18n';
export const AsyncLocalizationProvider = Symbol('AsyncLocalizationProvider');
export var Localization;
(function (Localization) {
    function format(message, args) {
        let result = message;
        if (args.length > 0) {
            result = message.replace(/\{(\d+)\}/g, (match, rest) => {
                const index = rest[0];
                const arg = args[index];
                let replacement = match;
                if (typeof arg === 'string') {
                    replacement = arg;
                }
                else if (typeof arg === 'number' || typeof arg === 'boolean' || !arg) {
                    replacement = String(arg);
                }
                return replacement;
            });
        }
        return result;
    }
    Localization.format = format;
    function localize(localization, key, defaultValue, ...args) {
        let value = defaultValue;
        if (localization) {
            const translation = localization.translations[key];
            if (translation) {
                value = normalize(translation);
            }
        }
        return format(value, args);
    }
    Localization.localize = localize;
    /**
     * This function normalizes values from VSCode's localizations, which often contain additional mnemonics (`&&`).
     * The normalization removes the mnemonics from the input string.
     *
     * @param value Localization value coming from VSCode
     * @returns A normalized localized value
     */
    function normalize(value) {
        return value.replace(/&&/g, '');
    }
    Localization.normalize = normalize;
    function transformKey(key) {
        let nlsKey = key;
        const keySlashIndex = key.lastIndexOf('/');
        if (keySlashIndex >= 0) {
            nlsKey = key.substring(keySlashIndex + 1);
        }
        return nlsKey;
    }
    Localization.transformKey = transformKey;
})(Localization || (Localization = {}));

//# sourceMappingURL=../../../lib/common/i18n/localization.js.map
