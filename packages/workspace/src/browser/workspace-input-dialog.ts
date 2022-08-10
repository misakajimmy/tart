import URI from '@tartjs/core/lib/common/uri';
import {codiconArray, LabelProvider, SingleTextInputDialog, SingleTextInputDialogProps} from '@tartjs/core';
import {inject, injectable} from 'inversify';

@injectable()
export class WorkspaceInputDialogProps extends SingleTextInputDialogProps {
  /**
   * The parent `URI` for the selection present in the explorer.
   * Used to display the path in which the file/folder is created at.
   */
  parentUri: URI;
}

export class WorkspaceInputDialog extends SingleTextInputDialog {

  constructor(
      @inject(WorkspaceInputDialogProps) protected readonly props: WorkspaceInputDialogProps,
      @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
  ) {
    super(props);
    this.appendParentPath();
  }

  /**
   * Append the human-readable parent `path` to the dialog.
   * When possible, display the relative path, else display the full path (ex: workspace root).
   */
  protected appendParentPath(): void {
    // Compute the label for the parent URI.
    const label = this.labelProvider.getLongName(this.props.parentUri);
    const element = document.createElement('div');
    // Create the `folder` icon.
    const icon = document.createElement('i');
    icon.classList.add(...codiconArray('folder'));
    icon.style.marginRight = '0.5em';
    element.appendChild(icon);
    element.appendChild(document.createTextNode(label));
    // Add the path and icon div before the `inputField`.
    this.contentNode.insertBefore(element, this.inputField);
  }
}
