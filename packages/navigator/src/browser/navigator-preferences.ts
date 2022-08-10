import {interfaces} from 'inversify';
import {
  createPreferenceProxy,
  PreferenceContribution,
  PreferenceProxy,
  PreferenceSchema,
  PreferenceService
} from '@tartjs/core';
import {nls} from '@tartjs/core/lib/common/nls';

export const FileNavigatorConfigSchema: PreferenceSchema = {
  'type': 'object',
  properties: {
    'explorer.autoReveal': {
      type: 'boolean',
      description: nls.localizeByDefault('Controls whether the explorer should automatically reveal and select files when opening them.'),
      default: true
    }
  }
};

export interface FileNavigatorConfiguration {
  'explorer.autoReveal': boolean;
}

export const FileNavigatorPreferenceContribution = Symbol('FileNavigatorPreferenceContribution');
export const FileNavigatorPreferences = Symbol('NavigatorPreferences');
export type FileNavigatorPreferences = PreferenceProxy<FileNavigatorConfiguration>;

export function createNavigatorPreferences(preferences: PreferenceService, schema: PreferenceSchema = FileNavigatorConfigSchema): FileNavigatorPreferences {
  return createPreferenceProxy(preferences, schema);
}

export function bindFileNavigatorPreferences(bind: interfaces.Bind): void {
  bind(FileNavigatorPreferences).toDynamicValue(ctx => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    const contribution = ctx.container.get<PreferenceContribution>(FileNavigatorPreferenceContribution);
    return createNavigatorPreferences(preferences, contribution.schema);
  }).inSingletonScope();
  bind(FileNavigatorPreferenceContribution).toConstantValue({schema: FileNavigatorConfigSchema});
  bind(PreferenceContribution).toService(FileNavigatorPreferenceContribution);
}
