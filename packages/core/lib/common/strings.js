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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Determines if haystack ends with needle.
 */
export function endsWith(haystack, needle) {
    const diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.indexOf(needle, diff) === diff;
    }
    else if (diff === 0) {
        return haystack === needle;
    }
    else {
        return false;
    }
}
export function isLowerAsciiLetter(code) {
    return code >= 97 /* CharCode.a */ && code <= 122 /* CharCode.z */;
}
export function isUpperAsciiLetter(code) {
    return code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */;
}
function isAsciiLetter(code) {
    return isLowerAsciiLetter(code) || isUpperAsciiLetter(code);
}
export function equalsIgnoreCase(a, b) {
    const len1 = a ? a.length : 0;
    const len2 = b ? b.length : 0;
    if (len1 !== len2) {
        return false;
    }
    return doEqualsIgnoreCase(a, b);
}
function doEqualsIgnoreCase(a, b, stopAt = a.length) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    for (let i = 0; i < stopAt; i++) {
        const codeA = a.charCodeAt(i);
        const codeB = b.charCodeAt(i);
        if (codeA === codeB) {
            continue;
        }
        // a-z A-Z
        if (isAsciiLetter(codeA) && isAsciiLetter(codeB)) {
            const diff = Math.abs(codeA - codeB);
            if (diff !== 0 && diff !== 32) {
                return false;
            }
        }
        // Any other charcode
        // tslint:disable-next-line:one-line
        else {
            if (String.fromCharCode(codeA).toLowerCase() !== String.fromCharCode(codeB).toLowerCase()) {
                return false;
            }
        }
    }
    return true;
}
/**
 * @returns the length of the common prefix of the two strings.
 */
export function commonPrefixLength(a, b) {
    let i;
    const len = Math.min(a.length, b.length);
    for (i = 0; i < len; i++) {
        if (a.charCodeAt(i) !== b.charCodeAt(i)) {
            return i;
        }
    }
    return len;
}
/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value) {
    return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\[\]\(\)\#]/g, '\\$&');
}
export function startsWithIgnoreCase(str, candidate) {
    const candidateLength = candidate.length;
    if (candidate.length > str.length) {
        return false;
    }
    return doEqualsIgnoreCase(str, candidate, candidateLength);
}
export function* split(s, splitter) {
    let start = 0;
    while (start < s.length) {
        let end = s.indexOf(splitter, start);
        if (end === -1) {
            end = s.length;
        }
        yield s.substring(start, end);
        start = end + splitter.length;
    }
}
export function escapeInvisibleChars(value) {
    return value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
export function unescapeInvisibleChars(value) {
    return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}
export function compare(a, b) {
    if (a < b) {
        return -1;
    }
    else if (a > b) {
        return 1;
    }
    else {
        return 0;
    }
}
export function compareSubstring(a, b, aStart = 0, aEnd = a.length, bStart = 0, bEnd = b.length) {
    for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
        const codeA = a.charCodeAt(aStart);
        const codeB = b.charCodeAt(bStart);
        if (codeA < codeB) {
            return -1;
        }
        else if (codeA > codeB) {
            return 1;
        }
    }
    const aLen = aEnd - aStart;
    const bLen = bEnd - bStart;
    if (aLen < bLen) {
        return -1;
    }
    else if (aLen > bLen) {
        return 1;
    }
    return 0;
}
export function compareIgnoreCase(a, b) {
    return compareSubstringIgnoreCase(a, b, 0, a.length, 0, b.length);
}
export function compareSubstringIgnoreCase(a, b, aStart = 0, aEnd = a.length, bStart = 0, bEnd = b.length) {
    for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
        const codeA = a.charCodeAt(aStart);
        const codeB = b.charCodeAt(bStart);
        if (codeA === codeB) {
            // equal
            continue;
        }
        const diff = codeA - codeB;
        if (diff === 32 && isUpperAsciiLetter(codeB)) { // codeB =[65-90] && codeA =[97-122]
            continue;
        }
        else if (diff === -32 && isUpperAsciiLetter(codeA)) { // codeB =[97-122] && codeA =[65-90]
            continue;
        }
        if (isLowerAsciiLetter(codeA) && isLowerAsciiLetter(codeB)) {
            //
            return diff;
        }
        else {
            return compareSubstring(a.toLowerCase(), b.toLowerCase(), aStart, aEnd, bStart, bEnd);
        }
    }
    const aLen = aEnd - aStart;
    const bLen = bEnd - bStart;
    if (aLen < bLen) {
        return -1;
    }
    else if (aLen > bLen) {
        return 1;
    }
    return 0;
}

//# sourceMappingURL=../../lib/common/strings.js.map
