var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'inversify';
import { FileStatNode, FileTreeWidget } from '../file-tree';
import { FOCUS_CLASS, SELECTED_CLASS, TreeProps } from '@tart/core/lib/browser';
import { FileDialogModel } from './file-dialog-model';
import { ContextMenuRenderer } from '@tart/core';
export const FILE_DIALOG_CLASS = 'tart-FileDialog';
export const NOT_SELECTABLE_CLASS = 'tart-mod-not-selectable';
let FileDialogWidget = class FileDialogWidget extends FileTreeWidget {
    constructor(props, model, contextMenuRenderer) {
        super(props, model, contextMenuRenderer);
        this.props = props;
        this.model = model;
        this._disableFileSelection = false;
        this.addClass(FILE_DIALOG_CLASS);
    }
    set disableFileSelection(isSelectable) {
        this._disableFileSelection = isSelectable;
        this.model.disableFileSelection = isSelectable;
    }
    createNodeAttributes(node, props) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attr = super.createNodeAttributes(node, props);
        if (this.shouldDisableSelection(node)) {
            const keys = Object.keys(attr);
            keys.forEach(k => {
                if (['className', 'style', 'title'].indexOf(k) < 0) {
                    delete attr[k];
                }
            });
        }
        return attr;
    }
    createNodeClassNames(node, props) {
        const classNames = super.createNodeClassNames(node, props);
        if (this.shouldDisableSelection(node)) {
            [SELECTED_CLASS, FOCUS_CLASS].forEach(name => {
                const ind = classNames.indexOf(name);
                if (ind >= 0) {
                    classNames.splice(ind, 1);
                }
            });
            classNames.push(NOT_SELECTABLE_CLASS);
        }
        return classNames;
    }
    shouldDisableSelection(node) {
        return FileStatNode.is(node) && !node.fileStat.isDirectory && this._disableFileSelection;
    }
};
FileDialogWidget = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(FileDialogModel)),
    __param(2, inject(ContextMenuRenderer))
], FileDialogWidget);
export { FileDialogWidget };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-widget.js.map
