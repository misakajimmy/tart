import {nls} from '../common/nls';
import zhcn from '../assets/i18n/vscode-language-pack-zh-hans/translations/main.i18n.json';

export async function loadTranslations(): Promise<void> {
  zhcn['vscode'] = zhcn['contents'];
  delete zhcn['contents'];
  nls.localization = {
    languageId: 'zh-cn',
    translations: flattenTranslations(zhcn),
  };
}


function flattenTranslations(localization: unknown): Record<string, string> {
  if (typeof localization === 'object' && localization) {
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(localization)) {
      if (typeof value === 'string') {
        record[key] = value;
      } else if (value && typeof value === 'object') {
        const flattened = flattenTranslations(value);
        for (const [flatKey, flatValue] of Object.entries(flattened)) {
          // @ts-ignore
          record[`${key}/${flatKey}`] = flatValue;
        }
      }
    }
    return record;
  } else {
    return {};
  }
}
