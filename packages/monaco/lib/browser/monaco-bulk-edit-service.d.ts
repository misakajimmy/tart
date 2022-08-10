/// <reference types="@theia/monaco-editor-core/monaco" />
export declare class MonacoBulkEditService implements monaco.editor.IBulkEditService {
    private _previewHandler?;
    apply(edits: monaco.editor.ResourceEdit[], options?: monaco.editor.IBulkEditOptions): Promise<monaco.editor.IBulkEditResult & {
        success: boolean;
    }>;
    hasPreviewHandler(): boolean;
    setPreviewHandler(handler: monaco.editor.IBulkEditPreviewHandler): monaco.IDisposable;
}
