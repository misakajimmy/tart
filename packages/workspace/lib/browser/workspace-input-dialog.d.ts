import URI from '@tart/core/lib/common/uri';
import { LabelProvider, SingleTextInputDialog, SingleTextInputDialogProps } from '@tart/core';
export declare class WorkspaceInputDialogProps extends SingleTextInputDialogProps {
    /**
     * The parent `URI` for the selection present in the explorer.
     * Used to display the path in which the file/folder is created at.
     */
    parentUri: URI;
}
export declare class WorkspaceInputDialog extends SingleTextInputDialog {
    protected readonly props: WorkspaceInputDialogProps;
    protected readonly labelProvider: LabelProvider;
    constructor(props: WorkspaceInputDialogProps, labelProvider: LabelProvider);
    /**
     * Append the human-readable parent `path` to the dialog.
     * When possible, display the relative path, else display the full path (ex: workspace root).
     */
    protected appendParentPath(): void;
}
