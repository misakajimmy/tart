import {injectable} from 'inversify';

// import { MonacoWorkspace } from './monaco-workspace';

@injectable()
export class MonacoBulkEditService implements monaco.editor.IBulkEditService {

    // @inject(MonacoWorkspace)
    // protected readonly workspace: MonacoWorkspace;

    private _previewHandler?: monaco.editor.IBulkEditPreviewHandler;

    async apply(edits: monaco.editor.ResourceEdit[], options?: monaco.editor.IBulkEditOptions): Promise<monaco.editor.IBulkEditResult & { success: boolean }> {
        if (this._previewHandler && (options?.showPreview || edits.some(value => value.metadata?.needsConfirmation))) {
            edits = await this._previewHandler(edits, options);
            return {ariaSummary: '', success: true};
        } else {
            // return this.workspace.applyBulkEdit(edits);
        }
    }

    hasPreviewHandler(): boolean {
        return Boolean(this._previewHandler);
    }

    setPreviewHandler(handler: monaco.editor.IBulkEditPreviewHandler): monaco.IDisposable {
        this._previewHandler = handler;

        const disposePreviewHandler = () => {
            if (this._previewHandler === handler) {
                this._previewHandler = undefined;
            }
        };

        return {
            dispose(): void {
                disposePreviewHandler();
            }
        };
    }
}
