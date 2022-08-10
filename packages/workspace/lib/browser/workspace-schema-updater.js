export const workspaceSchemaId = 'vscode://schemas/workspace';
export const workspaceSchema = {
    $id: workspaceSchemaId,
    type: 'object',
    title: 'Workspace File',
    required: ['folders'],
    default: { folders: [{ path: '' }], settings: {} },
    properties: {
        folders: {
            description: 'Root folders in the workspace',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                    }
                },
                required: ['path']
            }
        }
    },
};

//# sourceMappingURL=../../lib/browser/workspace-schema-updater.js.map
