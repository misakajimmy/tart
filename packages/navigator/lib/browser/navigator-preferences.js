import { createPreferenceProxy, PreferenceContribution, PreferenceService } from '@tart/core';
import { nls } from '@tart/core/lib/common/nls';
export const FileNavigatorConfigSchema = {
    'type': 'object',
    properties: {
        'explorer.autoReveal': {
            type: 'boolean',
            description: nls.localizeByDefault('Controls whether the explorer should automatically reveal and select files when opening them.'),
            default: true
        }
    }
};
export const FileNavigatorPreferenceContribution = Symbol('FileNavigatorPreferenceContribution');
export const FileNavigatorPreferences = Symbol('NavigatorPreferences');
export function createNavigatorPreferences(preferences, schema = FileNavigatorConfigSchema) {
    return createPreferenceProxy(preferences, schema);
}
export function bindFileNavigatorPreferences(bind) {
    bind(FileNavigatorPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get(PreferenceService);
        const contribution = ctx.container.get(FileNavigatorPreferenceContribution);
        return createNavigatorPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(FileNavigatorPreferenceContribution).toConstantValue({ schema: FileNavigatorConfigSchema });
    bind(PreferenceContribution).toService(FileNavigatorPreferenceContribution);
}

//# sourceMappingURL=../../lib/browser/navigator-preferences.js.map
