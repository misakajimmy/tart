var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { LabelProvider } from '@tart/core';
import { TreeLabelProvider } from '@tart/core/lib/browser/tree/tree-label-provider';
import { FileStatNode } from './file-tree';
let FileTreeLabelProvider = class FileTreeLabelProvider {
    canHandle(element) {
        return FileStatNode.is(element) ?
            this.treeLabelProvider.canHandle(element) + 1 :
            0;
    }
    getIcon(node) {
        return this.labelProvider.getIcon(node.fileStat);
    }
    getName(node) {
        return this.labelProvider.getName(node.fileStat);
    }
    getDescription(node) {
        return this.labelProvider.getLongName(node.fileStat);
    }
    affects(node, event) {
        return event.affects(node.fileStat);
    }
};
__decorate([
    inject(LabelProvider)
], FileTreeLabelProvider.prototype, "labelProvider", void 0);
__decorate([
    inject(TreeLabelProvider)
], FileTreeLabelProvider.prototype, "treeLabelProvider", void 0);
FileTreeLabelProvider = __decorate([
    injectable()
], FileTreeLabelProvider);
export { FileTreeLabelProvider };

//# sourceMappingURL=../../../lib/browser/file-tree/file-tree-label-provider.js.map
