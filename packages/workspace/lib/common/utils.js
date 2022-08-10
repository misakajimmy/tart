import URI from '@tart/core/lib/common/uri';
export const WM_EXT = 'wm-workspace';
export const VSCODE_EXT = 'code-workspace';
export async function getTemporaryWorkspaceFileUri(envVariableServer) {
    const configDirUri = await envVariableServer.getConfigDirUri();
    return new URI(configDirUri).resolve(`Untitled.${WM_EXT}`);
}

//# sourceMappingURL=../../lib/common/utils.js.map
