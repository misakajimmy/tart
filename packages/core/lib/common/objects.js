/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
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
export function deepClone(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof RegExp) {
        return obj;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prop = obj[key];
        if (prop && typeof prop === 'object') {
            result[key] = deepClone(prop);
        }
        else {
            result[key] = prop;
        }
    });
    return result;
}
export function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack = [obj];
    while (stack.length > 0) {
        const objectToFreeze = stack.shift();
        Object.freeze(objectToFreeze);
        for (const key in objectToFreeze) {
            if (_hasOwnProperty.call(objectToFreeze, key)) {
                const prop = objectToFreeze[key];
                if (typeof prop === 'object' && !Object.isFrozen(prop)) {
                    stack.push(prop);
                }
            }
        }
    }
    return obj;
}
const _hasOwnProperty = Object.prototype.hasOwnProperty;
export function notEmpty(arg) {
    // eslint-disable-next-line no-null/no-null
    return arg !== undefined && arg !== null;
}
/**
 * `true` if the argument is an empty object. Otherwise, `false`.
 */
export function isEmpty(arg) {
    return Object.keys(arg).length === 0 && arg.constructor === Object;
}

//# sourceMappingURL=../../lib/common/objects.js.map