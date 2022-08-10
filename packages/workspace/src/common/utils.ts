import URI from '@tart/core/lib/common/uri';
import {EnvVariablesServer} from '@tart/core/lib/common/env-variables';

export const WM_EXT = 'wm-workspace';
export const VSCODE_EXT = 'code-workspace';

export async function getTemporaryWorkspaceFileUri(envVariableServer: EnvVariablesServer): Promise<URI> {
  const configDirUri = await envVariableServer.getConfigDirUri();
  return new URI(configDirUri).resolve(`Untitled.${WM_EXT}`);
}
