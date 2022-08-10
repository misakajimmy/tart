import { Command } from '@tart/core/lib/common';
export var NavigatorDiffCommands;
(function (NavigatorDiffCommands) {
    const COMPARE_CATEGORY = 'Compare';
    NavigatorDiffCommands.COMPARE_FIRST = Command.toDefaultLocalizedCommand({
        id: 'compare:first',
        category: COMPARE_CATEGORY,
        label: 'Select for Compare'
    });
    NavigatorDiffCommands.COMPARE_SECOND = Command.toDefaultLocalizedCommand({
        id: 'compare:second',
        category: COMPARE_CATEGORY,
        label: 'Compare with Selected'
    });
})(NavigatorDiffCommands || (NavigatorDiffCommands = {}));

//# sourceMappingURL=../../lib/browser/navigator-diff.js.map
