var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { DirNode, FileTree } from '../file-tree';
let FileDialogTree = class FileDialogTree extends FileTree {
    constructor() {
        super(...arguments);
        /**
         * Extensions for files to be shown
         */
        this.fileExtensions = [];
    }
    /**
     * Sets extensions for filtering files
     *
     * @param fileExtensions array of extensions
     */
    setFilter(fileExtensions) {
        this.fileExtensions = fileExtensions.slice();
        this.refresh();
    }
    async toNodes(fileStat, parent) {
        if (!fileStat.children) {
            return [];
        }
        const result = await Promise.all(fileStat.children
            .filter(child => this.isVisible(child))
            .map(child => this.toNode(child, parent)));
        return result.sort(DirNode.compare);
    }
    /**
     * Determines whether file or folder can be shown
     *
     * @param fileStat resource to check
     */
    isVisible(fileStat) {
        if (fileStat.isDirectory) {
            return true;
        }
        if (this.fileExtensions.length === 0) {
            return true;
        }
        return !this.fileExtensions.every(value => fileStat.resource.path.ext !== '.' + value);
    }
};
FileDialogTree = __decorate([
    injectable()
], FileDialogTree);
export { FileDialogTree };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-tree.js.map
