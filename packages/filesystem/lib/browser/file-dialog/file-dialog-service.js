var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { OpenFileDialogFactory, SaveFileDialogFactory } from './file-dialog';
import URI from '@tart/core/lib/common/uri';
import { inject, injectable } from 'inversify';
import { FileService } from '../file-service';
import { LabelProvider } from '@tart/core/lib/browser';
import { DirNode } from '../file-tree';
export const FileDialogService = Symbol('FileDialogService');
let DefaultFileDialogService = class DefaultFileDialogService {
    async showOpenDialog(props, folder) {
        const title = props.title || 'Open';
        const rootNode = await this.getRootNode(folder);
        if (rootNode) {
            const dialog = this.openFileDialogFactory(Object.assign(props, { title }));
            await dialog.model.navigateTo(rootNode);
            const value = await dialog.open();
            if (value) {
                if (!Array.isArray(value)) {
                    return value.uri;
                }
                return value.map(node => node.uri);
            }
        }
        return undefined;
    }
    async showSaveDialog(props, folder) {
        const title = props.title || 'Save';
        const rootNode = await this.getRootNode(folder);
        if (rootNode) {
            const dialog = this.saveFileDialogFactory(Object.assign(props, { title }));
            await dialog.model.navigateTo(rootNode);
            return dialog.open();
        }
        return undefined;
    }
    async getRootNode(folderToOpen) {
        const folderExists = folderToOpen && await this.fileService.exists(folderToOpen.resource);
        const folder = folderToOpen && folderExists ? folderToOpen : {
            // resource: new URI(await this.environments.getHomeDirUri()),
            resource: new URI(),
            isDirectory: true
        };
        const folderUri = folder.resource;
        const rootUri = folder.isDirectory ? folderUri : folderUri.parent;
        try {
            const rootStat = await this.fileService.resolve(rootUri);
            return DirNode.createRoot(rootStat);
        }
        catch (_a) {
        }
        return undefined;
    }
};
__decorate([
    inject(FileService)
], DefaultFileDialogService.prototype, "fileService", void 0);
__decorate([
    inject(OpenFileDialogFactory)
], DefaultFileDialogService.prototype, "openFileDialogFactory", void 0);
__decorate([
    inject(LabelProvider)
], DefaultFileDialogService.prototype, "labelProvider", void 0);
__decorate([
    inject(SaveFileDialogFactory)
], DefaultFileDialogService.prototype, "saveFileDialogFactory", void 0);
DefaultFileDialogService = __decorate([
    injectable()
], DefaultFileDialogService);
export { DefaultFileDialogService };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-service.js.map
