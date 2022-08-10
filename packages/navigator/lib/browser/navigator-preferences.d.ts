import { interfaces } from 'inversify';
import { PreferenceProxy, PreferenceSchema, PreferenceService } from '@tart/core';
export declare const FileNavigatorConfigSchema: PreferenceSchema;
export interface FileNavigatorConfiguration {
    'explorer.autoReveal': boolean;
}
export declare const FileNavigatorPreferenceContribution: unique symbol;
export declare const FileNavigatorPreferences: unique symbol;
export declare type FileNavigatorPreferences = PreferenceProxy<FileNavigatorConfiguration>;
export declare function createNavigatorPreferences(preferences: PreferenceService, schema?: PreferenceSchema): FileNavigatorPreferences;
export declare function bindFileNavigatorPreferences(bind: interfaces.Bind): void;
