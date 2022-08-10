import {
  createPreferenceProxy,
  PreferenceContribution,
  PreferenceProxy,
  PreferenceSchema,
  PreferenceService
} from '@tart/core';
import {nls} from '@tart/core/lib/common/nls';
import {interfaces} from 'inversify';

export const workspacePreferenceSchema: PreferenceSchema = {
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

export interface WorkspaceConfiguration {
  'workspace.preserveWindow': boolean,
  'workspace.supportMultiRootWorkspace': boolean
}

export const WorkspacePreferenceContribution = Symbol('WorkspacePreferenceContribution');
export const WorkspacePreferences = Symbol('WorkspacePreferences');
export type WorkspacePreferences = PreferenceProxy<WorkspaceConfiguration>;

export function createWorkspacePreferences(preferences: PreferenceService, schema: PreferenceSchema = workspacePreferenceSchema): WorkspacePreferences {
  return createPreferenceProxy(preferences, schema);
}

export function bindWorkspacePreferences(bind: interfaces.Bind): void {
  bind(WorkspacePreferences).toDynamicValue(ctx => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    const contribution = ctx.container.get<PreferenceContribution>(WorkspacePreferenceContribution);
    return createWorkspacePreferences(preferences, contribution.schema);
  }).inSingletonScope();
  bind(WorkspacePreferenceContribution).toConstantValue({schema: workspacePreferenceSchema});
  bind(PreferenceContribution).toService(WorkspacePreferenceContribution);
}
