import URI from '@tart/core/lib/common/uri';
import { EnvVariablesServer } from '@tart/core/lib/common/env-variables';
export declare const WM_EXT = "wm-workspace";
export declare const VSCODE_EXT = "code-workspace";
export declare function getTemporaryWorkspaceFileUri(envVariableServer: EnvVariablesServer): Promise<URI>;
