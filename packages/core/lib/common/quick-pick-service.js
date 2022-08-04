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
import * as fuzzy from 'fuzzy';
export const quickPickServicePath = '/services/quickPick';
export const QuickPickService = Symbol('QuickPickService');
export var QuickPickItem;
(function (QuickPickItem) {
    function is(item) {
        // if it's not a separator, it's an item
        return item.type !== 'separator';
    }
    QuickPickItem.is = is;
})(QuickPickItem || (QuickPickItem = {}));
export var QuickPickSeparator;
(function (QuickPickSeparator) {
    function is(item) {
        return item.type === 'separator';
    }
    QuickPickSeparator.is = is;
})(QuickPickSeparator || (QuickPickSeparator = {}));
export const QuickInputService = Symbol('QuickInputService');
/**
 * Filter the list of quick pick items based on the provided filter.
 * Items are filtered based on if:
 * - their `label` satisfies the filter using `fuzzy`.
 * - their `description` satisfies the filter using `fuzzy`.
 * - their `detail` satisfies the filter using `fuzzy`.
 * Filtered items are also updated to display proper highlights based on how they were filtered.
 * @param items the list of quick pick items.
 * @param filter the filter to search for.
 * @returns the list of quick pick items that satisfy the filter.
 */
export function filterItems(items, filter) {
    filter = filter.trim().toLowerCase();
    if (filter.length === 0) {
        for (const item of items) {
            item.highlights = undefined; // reset highlights from previous filtering.
        }
        return items;
    }
    const filteredItems = [];
    for (const item of items) {
        if (fuzzy.test(filter, item.label) ||
            (item.description && fuzzy.test(filter, item.description)) ||
            (item.detail && fuzzy.test(filter, item.detail))) {
            item.highlights = {
                label: findMatches(item.label, filter),
                description: item.description ? findMatches(item.description, filter) : undefined,
                detail: item.detail ? findMatches(item.detail, filter) : undefined
            };
            filteredItems.push(item);
        }
    }
    return filteredItems;
}
/**
 * Find match highlights when testing a word against a pattern.
 * @param word the word to test.
 * @param pattern the word to match against.
 * @returns the list of highlights if present.
 */
export function findMatches(word, pattern) {
    word = word.toLocaleLowerCase();
    pattern = pattern.toLocaleLowerCase();
    if (pattern.trim().length === 0) {
        return undefined;
    }
    const delimiter = '\u0000'; // null byte that shouldn't appear in the input and is used to denote matches.
    const matchResult = fuzzy.match(pattern.replace(/\u0000/gu, ''), word, { pre: delimiter, post: delimiter });
    if (!matchResult) {
        return undefined;
    }
    const match = matchResult.rendered;
    const highlights = [];
    let lastIndex = 0;
    /** We need to account for the extra markers by removing them from the range */
    let offset = 0;
    while (true) {
        const start = match.indexOf(delimiter, lastIndex);
        if (start === -1) {
            break;
        }
        const end = match.indexOf(delimiter, start + 1);
        if (end === -1) {
            break;
        }
        highlights.push({
            start: start - offset++,
            end: end - offset++
        });
        lastIndex = end + 1;
    }
    return highlights.length > 0 ? highlights : undefined;
}

//# sourceMappingURL=../../lib/common/quick-pick-service.js.map
