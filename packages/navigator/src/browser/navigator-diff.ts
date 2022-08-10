import {Command} from '@tartjs/core/lib/common';

export namespace NavigatorDiffCommands {
  const COMPARE_CATEGORY = 'Compare';
  export const COMPARE_FIRST = Command.toDefaultLocalizedCommand({
    id: 'compare:first',
    category: COMPARE_CATEGORY,
    label: 'Select for Compare'
  });
  export const COMPARE_SECOND = Command.toDefaultLocalizedCommand({
    id: 'compare:second',
    category: COMPARE_CATEGORY,
    label: 'Compare with Selected'
  });
}
