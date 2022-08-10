var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { codiconArray, LabelProvider, SingleTextInputDialog, SingleTextInputDialogProps } from '@tart/core';
import { inject, injectable } from 'inversify';
let WorkspaceInputDialogProps = class WorkspaceInputDialogProps extends SingleTextInputDialogProps {
};
WorkspaceInputDialogProps = __decorate([
    injectable()
], WorkspaceInputDialogProps);
export { WorkspaceInputDialogProps };
let WorkspaceInputDialog = class WorkspaceInputDialog extends SingleTextInputDialog {
    constructor(props, labelProvider) {
        super(props);
        this.props = props;
        this.labelProvider = labelProvider;
        this.appendParentPath();
    }
    /**
     * Append the human-readable parent `path` to the dialog.
     * When possible, display the relative path, else display the full path (ex: workspace root).
     */
    appendParentPath() {
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
};
WorkspaceInputDialog = __decorate([
    __param(0, inject(WorkspaceInputDialogProps)),
    __param(1, inject(LabelProvider))
], WorkspaceInputDialog);
export { WorkspaceInputDialog };

//# sourceMappingURL=../../lib/browser/workspace-input-dialog.js.map
