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
import { ContextMenuRenderer, defaultTreeProps, open, OpenerService, TreeProps } from '@tart/core/lib/browser';
import { createFileTreeContainer, FileStatNode, FileTreeModel, FileTreeWidget } from '../file-tree';
const BREADCRUMBS_FILETREE_CLASS = 'tart-FilepathBreadcrumbFileTree';
export function createFileTreeBreadcrumbsContainer(parent) {
    const child = createFileTreeContainer(parent);
    child.unbind(FileTreeWidget);
    child.rebind(TreeProps).toConstantValue(Object.assign(Object.assign({}, defaultTreeProps), { virtualized: false }));
    child.bind(BreadcrumbsFileTreeWidget).toSelf();
    return child;
}
export function createFileTreeBreadcrumbsWidget(parent) {
    return createFileTreeBreadcrumbsContainer(parent).get(BreadcrumbsFileTreeWidget);
}
let BreadcrumbsFileTreeWidget = class BreadcrumbsFileTreeWidget extends FileTreeWidget {
    constructor(props, model, contextMenuRenderer) {
        super(props, model, contextMenuRenderer);
        this.props = props;
        this.model = model;
        this.addClass(BREADCRUMBS_FILETREE_CLASS);
    }
    createNodeAttributes(node, props) {
        const elementAttrs = super.createNodeAttributes(node, props);
        return Object.assign(Object.assign({}, elementAttrs), { draggable: false });
    }
    handleClickEvent(node, event) {
        if (FileStatNode.is(node) && !node.fileStat.isDirectory) {
            open(this.openerService, node.uri, { preview: true });
        }
        else {
            super.handleClickEvent(node, event);
        }
    }
};
__decorate([
    inject(OpenerService)
], BreadcrumbsFileTreeWidget.prototype, "openerService", void 0);
BreadcrumbsFileTreeWidget = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(FileTreeModel)),
    __param(2, inject(ContextMenuRenderer))
], BreadcrumbsFileTreeWidget);
export { BreadcrumbsFileTreeWidget };

//# sourceMappingURL=../../../lib/browser/breadcrumbs/filepath-breadcrumbs-container.js.map
