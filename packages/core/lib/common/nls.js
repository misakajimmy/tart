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
import { Localization } from './i18n/localization';
import bundle from '../assets/i18n/nls.metadata.json';
export var nls;
(function (nls) {
    nls.localeId = 'localeId';
    nls.locale = typeof window === 'object' && window && window.localStorage.getItem(nls.localeId) || 'zh-cn';
    let keyProvider;
    /**
     * Automatically localizes a text if that text also exists in the vscode repository.
     */
    function localizeByDefault(defaultValue, ...args) {
        const key = getDefaultKey(defaultValue);
        if (key) {
            return localize(key, defaultValue, ...args);
        }
        return Localization.format(defaultValue, args);
    }
    nls.localizeByDefault = localizeByDefault;
    function getDefaultKey(defaultValue) {
        if (nls.localization) {
            if (!keyProvider) {
                keyProvider = new LocalizationKeyProvider();
            }
            const key = keyProvider.get(defaultValue);
            if (key) {
                return key;
            }
            else {
                // console.warn(`Could not find translation key for default value: "${defaultValue}"`);
            }
        }
        return '';
    }
    nls.getDefaultKey = getDefaultKey;
    function localize(key, defaultValue, ...args) {
        return Localization.localize(nls.localization, key, defaultValue, ...args);
    }
    nls.localize = localize;
})(nls || (nls = {}));
class LocalizationKeyProvider {
    data = this.buildData();
    get(defaultValue) {
        return this.data.get(defaultValue);
    }
    /**
     * Transforms the data coming from the `nls.metadata.json` file into a map.
     * The original data contains arrays of keys and messages.
     * The result is a map that matches each message to the key that belongs to it.
     *
     * This allows us to skip the key in the localization process and map the original english default values to their translations in different languages.json.
     */
    buildData() {
        const bundles = bundle;
        const keys = bundles.keys;
        const messages = bundles.messages;
        const data = new Map();
        for (const [fileKey, messageBundle] of Object.entries(messages)) {
            const keyBundle = keys[fileKey];
            for (let i = 0; i < messageBundle.length; i++) {
                const message = Localization.normalize(messageBundle[i]);
                const key = keyBundle[i];
                const localizationKey = this.buildKey(typeof key === 'string' ? key : key.key, fileKey);
                data.set(message, localizationKey);
            }
        }
        return data;
    }
    buildKey(key, filepath) {
        return `vscode/${filepath}/${key}`;
    }
}

//# sourceMappingURL=../../lib/common/nls.js.map
