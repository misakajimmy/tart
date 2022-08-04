var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Emitter } from '@tart/core/lib/common';
import { inject, injectable } from 'inversify';
import { CompositeTreeNode, LabelProvider, SelectableTreeNode, Widget } from '@tart/core/lib/browser';
import { FilepathBreadcrumb } from './filepath-breadcrumb';
import { BreadcrumbsFileTreeWidget } from './filepath-breadcrumbs-container';
import { DirNode } from '../file-tree';
import { FileService } from '../file-service';
export const FilepathBreadcrumbType = Symbol('FilepathBreadcrumb');
let FilepathBreadcrumbsContribution = class FilepathBreadcrumbsContribution {
    constructor() {
        this.type = FilepathBreadcrumbType;
        this.priority = 100;
        this.onDidChangeBreadcrumbsEmitter = new Emitter();
    }
    get onDidChangeBreadcrumbs() {
        return this.onDidChangeBreadcrumbsEmitter.event;
    }
    async computeBreadcrumbs(uri) {
        if (uri.scheme !== 'file') {
            return [];
        }
        const getContainerClass = this.getContainerClassCreator(uri);
        const getIconClass = this.getIconClassCreator(uri);
        return uri.allLocations
            .map((location, index) => {
            const icon = getIconClass(location, index);
            const containerClass = getContainerClass(location, index);
            return new FilepathBreadcrumb(location, this.labelProvider.getName(location), this.labelProvider.getLongName(location), icon, containerClass);
        })
            .filter(b => this.filterBreadcrumbs(uri, b))
            .reverse();
    }
    async attachPopupContent(breadcrumb, parent) {
        if (!FilepathBreadcrumb.is(breadcrumb)) {
            return undefined;
        }
        const folderFileStat = await this.fileSystem.resolve(breadcrumb.uri.parent);
        if (folderFileStat) {
            const rootNode = await this.createRootNode(folderFileStat);
            if (rootNode) {
                const { model } = this.breadcrumbsFileTreeWidget;
                await model.navigateTo(Object.assign(Object.assign({}, rootNode), { visible: false }));
                Widget.attach(this.breadcrumbsFileTreeWidget, parent);
                const toDisposeOnTreePopulated = model.onChanged(() => {
                    if (CompositeTreeNode.is(model.root) && model.root.children.length > 0) {
                        toDisposeOnTreePopulated.dispose();
                        const targetNode = model.getNode(breadcrumb.uri.path.toString());
                        if (targetNode && SelectableTreeNode.is(targetNode)) {
                            model.selectNode(targetNode);
                        }
                        this.breadcrumbsFileTreeWidget.activate();
                    }
                });
                return {
                    dispose: () => {
                        // Clear model otherwise the next time a popup is opened the old model is rendered first
                        // and is shown for a short time period.
                        toDisposeOnTreePopulated.dispose();
                        this.breadcrumbsFileTreeWidget.model.root = undefined;
                        Widget.detach(this.breadcrumbsFileTreeWidget);
                    }
                };
            }
        }
    }
    getContainerClassCreator(fileURI) {
        return (location, index) => location.isEqual(fileURI) ? 'file' : 'folder';
    }
    getIconClassCreator(fileURI) {
        return (location, index) => location.isEqual(fileURI) ? this.labelProvider.getIcon(location) + ' file-icon' : '';
    }
    filterBreadcrumbs(_, breadcrumb) {
        return !breadcrumb.uri.path.isRoot;
    }
    async createRootNode(folderToOpen) {
        const folderUri = folderToOpen.resource;
        const rootUri = folderToOpen.isDirectory ? folderUri : folderUri.parent;
        const rootStat = await this.fileSystem.resolve(rootUri);
        if (rootStat) {
            return DirNode.createRoot(rootStat);
        }
    }
};
__decorate([
    inject(LabelProvider)
], FilepathBreadcrumbsContribution.prototype, "labelProvider", void 0);
__decorate([
    inject(FileService)
], FilepathBreadcrumbsContribution.prototype, "fileSystem", void 0);
__decorate([
    inject(BreadcrumbsFileTreeWidget)
], FilepathBreadcrumbsContribution.prototype, "breadcrumbsFileTreeWidget", void 0);
FilepathBreadcrumbsContribution = __decorate([
    injectable()
], FilepathBreadcrumbsContribution);
export { FilepathBreadcrumbsContribution };

//# sourceMappingURL=../../../lib/browser/breadcrumbs/filepath-breadcrumbs-contribution.js.map
