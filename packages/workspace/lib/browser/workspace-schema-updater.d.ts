export declare const workspaceSchemaId = "vscode://schemas/workspace";
export declare const workspaceSchema: {
    $id: string;
    type: string;
    title: string;
    required: string[];
    default: {
        folders: {
            path: string;
        }[];
        settings: {};
    };
    properties: {
        folders: {
            description: string;
            type: string;
            items: {
                type: string;
                properties: {
                    path: {
                        type: string;
                    };
                };
                required: string[];
            };
        };
    };
};
