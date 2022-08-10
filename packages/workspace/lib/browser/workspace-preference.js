import { createPreferenceProxy, PreferenceContribution, PreferenceService } from '@tart/core';
import { nls } from '@tart/core/lib/common/nls';
export const workspacePreferenceSchema = {
    type: 'object',
    properties: {
        'workspace.preserveWindow': {
            description: nls.localize('theia/workspace/preserveWindow', 'Enable opening workspaces in current window.'),
            type: 'boolean',
            default: false
        },
        'workspace.supportMultiRootWorkspace': {
            description: nls.localize('theia/workspace/supportMultiRootWorkspace', 'Controls whether multi-root workspace support is enabled.'),
            type: 'boolean',
            default: true
        }
    }
};
export const WorkspacePreferenceContribution = Symbol('WorkspacePreferenceContribution');
export const WorkspacePreferences = Symbol('WorkspacePreferences');
export function createWorkspacePreferences(preferences, schema = workspacePreferenceSchema) {
    return createPreferenceProxy(preferences, schema);
}
export function bindWorkspacePreferences(bind) {
    bind(WorkspacePreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get(PreferenceService);
        const contribution = ctx.container.get(WorkspacePreferenceContribution);
        return createWorkspacePreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(WorkspacePreferenceContribution).toConstantValue({ schema: workspacePreferenceSchema });
    bind(PreferenceContribution).toService(WorkspacePreferenceContribution);
}

//# sourceMappingURL=../../lib/browser/workspace-preference.js.map
