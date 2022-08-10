import { PreferenceProxy, PreferenceSchema, PreferenceService } from '@tart/core';
import { interfaces } from 'inversify';
export declare const workspacePreferenceSchema: PreferenceSchema;
export interface WorkspaceConfiguration {
    'workspace.preserveWindow': boolean;
    'workspace.supportMultiRootWorkspace': boolean;
}
export declare const WorkspacePreferenceContribution: unique symbol;
export declare const WorkspacePreferences: unique symbol;
export declare type WorkspacePreferences = PreferenceProxy<WorkspaceConfiguration>;
export declare function createWorkspacePreferences(preferences: PreferenceService, schema?: PreferenceSchema): WorkspacePreferences;
export declare function bindWorkspacePreferences(bind: interfaces.Bind): void;
