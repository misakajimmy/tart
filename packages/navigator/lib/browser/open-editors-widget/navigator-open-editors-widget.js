var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OpenEditorsWidget_1;
import React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { createFileTreeContainer, FileTreeWidget } from '@tart/filesystem';
import { nls } from '@tart/core/lib/common/nls';
import { ApplicationShell, ContextMenuRenderer, defaultTreeProps, Saveable, TREE_NODE_CONTENT_CLASS, TreeDecoratorService, TreeModel, TreeNode, TreeProps } from '@tart/core';
import { OpenEditorsModel } from './navigator-open-editors-tree-model';
import { OpenEditorsCommands } from './navigator-open-editors-commands';
import { CommandService } from '@tart/core/lib/common';
import { OpenEditorsTreeDecoratorService } from './navigator-open-editors-decorator-service';
import { OPEN_EDITORS_CONTEXT_MENU } from './navigator-open-editors-menus';
export const OPEN_EDITORS_PROPS = Object.assign(Object.assign({}, defaultTreeProps), { virtualized: false, contextMenuPath: OPEN_EDITORS_CONTEXT_MENU });
let OpenEditorsWidget = OpenEditorsWidget_1 = class OpenEditorsWidget extends FileTreeWidget {
    constructor(props, model, contextMenuRenderer) {
        super(props, model, contextMenuRenderer);
        this.props = props;
        this.model = model;
        this.contextMenuRenderer = contextMenuRenderer;
        this.handleGroupActionIconClicked = async (e) => this.doHandleGroupActionIconClicked(e);
        this.closeEditor = async (e) => {
            this.doCloseEditor(e);
        };
    }
    get editorWidgets() {
        return this.model.editorWidgets;
    }
    static createContainer(parent) {
        const child = createFileTreeContainer(parent);
        child.bind(OpenEditorsModel).toSelf();
        child.rebind(TreeModel).toService(OpenEditorsModel);
        child.bind(OpenEditorsWidget_1).toSelf();
        child.rebind(TreeProps).toConstantValue(OPEN_EDITORS_PROPS);
        child.bind(OpenEditorsTreeDecoratorService).toSelf().inSingletonScope();
        child.rebind(TreeDecoratorService).toService(OpenEditorsTreeDecoratorService);
        return child;
    }
    static createWidget(parent) {
        return OpenEditorsWidget_1.createContainer(parent).get(OpenEditorsWidget_1);
    }
    init() {
        super.init();
        this.id = OpenEditorsWidget_1.ID;
        this.title.label = OpenEditorsWidget_1.LABEL;
        this.addClass(OpenEditorsWidget_1.ID);
        this.update();
    }
    renderNode(node, props) {
        if (!TreeNode.isVisible(node)) {
            return undefined;
        }
        const attributes = this.createNodeAttributes(node, props);
        const isEditorNode = !(node.id.startsWith(OpenEditorsModel.GROUP_NODE_ID_PREFIX) || node.id.startsWith(OpenEditorsModel.AREA_NODE_ID_PREFIX));
        const content = React.createElement("div", { className: `${TREE_NODE_CONTENT_CLASS}` },
            this.renderExpansionToggle(node, props),
            isEditorNode && this.renderPrefixIcon(node),
            this.decorateIcon(node, this.renderIcon(node, props)),
            this.renderCaptionAffixes(node, props, 'captionPrefixes'),
            this.renderCaption(node, props),
            this.renderCaptionAffixes(node, props, 'captionSuffixes'),
            this.renderTailDecorations(node, props),
            (this.isGroupNode(node) || this.isAreaNode(node)) && this.renderInteractables(node, props));
        return React.createElement('div', attributes, content);
    }
    isGroupNode(node) {
        return node.id.startsWith(OpenEditorsModel.GROUP_NODE_ID_PREFIX);
    }
    isAreaNode(node) {
        return node.id.startsWith(OpenEditorsModel.AREA_NODE_ID_PREFIX);
    }
    doRenderNodeRow({ node, depth }) {
        let groupClass = '';
        if (this.isGroupNode(node)) {
            groupClass = 'group-node';
        }
        else if (this.isAreaNode(node)) {
            groupClass = 'area-node';
        }
        return React.createElement("div", { className: `open-editors-node-row ${this.getPrefixIconClass(node)}${groupClass}` }, this.renderNode(node, { depth }));
    }
    renderInteractables(node, props) {
        return (React.createElement("div", { className: 'open-editors-inline-actions-container' },
            React.createElement("div", { className: 'open-editors-inline-action' },
                React.createElement("a", { className: 'codicon codicon-save-all', title: OpenEditorsCommands.SAVE_ALL_IN_GROUP_FROM_ICON.label, onClick: this.handleGroupActionIconClicked, "data-id": node.id, id: OpenEditorsCommands.SAVE_ALL_IN_GROUP_FROM_ICON.id })),
            React.createElement("div", { className: 'open-editors-inline-action' },
                React.createElement("a", { className: 'codicon codicon-close-all', title: OpenEditorsCommands.CLOSE_ALL_EDITORS_IN_GROUP_FROM_ICON.label, onClick: this.handleGroupActionIconClicked, "data-id": node.id, id: OpenEditorsCommands.CLOSE_ALL_EDITORS_IN_GROUP_FROM_ICON.id }))));
    }
    getPrefixIconClass(node) {
        const saveable = Saveable.get(node.widget);
        if (saveable) {
            return saveable.dirty ? 'dirty' : '';
        }
        return '';
    }
    async doHandleGroupActionIconClicked(e) {
        e.stopPropagation();
        const groupName = e.currentTarget.getAttribute('data-id');
        const command = e.currentTarget.id;
        if (groupName && command) {
            const groupFromTarget = groupName.split(':').pop();
            const areaOrTabBar = this.sanitizeInputFromClickHandler(groupFromTarget);
            if (areaOrTabBar) {
                return this.commandService.executeCommand(command, areaOrTabBar);
            }
        }
    }
    sanitizeInputFromClickHandler(groupFromTarget) {
        let areaOrTabBar;
        if (groupFromTarget) {
            if (ApplicationShell.isValidArea(groupFromTarget)) {
                areaOrTabBar = groupFromTarget;
            }
            else {
                const groupAsNum = parseInt(groupFromTarget);
                if (!isNaN(groupAsNum)) {
                    areaOrTabBar = this.model.getTabBarForGroup(groupAsNum);
                }
            }
        }
        return areaOrTabBar;
    }
    renderPrefixIcon(node) {
        return (React.createElement("div", { className: 'open-editors-prefix-icon-container' },
            React.createElement("div", { "data-id": node.id, className: 'open-editors-prefix-icon dirty codicon codicon-circle-filled' }),
            React.createElement("div", { "data-id": node.id, onClick: this.closeEditor, className: 'open-editors-prefix-icon close codicon codicon-close' })));
    }
    async doCloseEditor(e) {
        const widgetId = e.currentTarget.getAttribute('data-id');
        if (widgetId) {
            await this.applicationShell.closeWidget(widgetId);
        }
    }
};
OpenEditorsWidget.ID = 'wm-open-editors-widget';
OpenEditorsWidget.LABEL = nls.localizeByDefault('Open Editors');
__decorate([
    inject(ApplicationShell)
], OpenEditorsWidget.prototype, "applicationShell", void 0);
__decorate([
    inject(CommandService)
], OpenEditorsWidget.prototype, "commandService", void 0);
__decorate([
    postConstruct()
], OpenEditorsWidget.prototype, "init", null);
OpenEditorsWidget = OpenEditorsWidget_1 = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(OpenEditorsModel)),
    __param(2, inject(ContextMenuRenderer))
], OpenEditorsWidget);
export { OpenEditorsWidget };

//# sourceMappingURL=../../../lib/browser/open-editors-widget/navigator-open-editors-widget.js.map
