var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { DirNode, FileNode, FileStatNode, FileTreeWidget } from '@tart/filesystem';
import { ApplicationShell, ContextMenuRenderer, ExpandableTreeNode, Key, OpenerService, SelectableTreeNode, TREE_NODE_SEGMENT_CLASS, TREE_NODE_TAIL_CLASS, TreeDecoration, TreeProps } from '@tart/core';
import { FileNavigatorModel } from './navigator-model';
import { nls } from '@tart/core/lib/common/nls';
import { WorkspaceNode, WorkspaceRootNode } from './navigator-tree';
import { CommandService, isOSX, notEmpty } from '@tart/core/lib/common';
import { NavigatorContextKeyService } from './navigator-context-key-service';
import URI from '@tart/core/lib/common/uri';
import { FileNavigatorCommands } from './navigator-contribution';
export const FILE_NAVIGATOR_ID = 'files';
export const LABEL = nls.localizeByDefault('No Folder Opened');
export const CLASS = 'wm-Files';
let FileNavigatorWidget = class FileNavigatorWidget extends FileTreeWidget {
    constructor(props, model, commandService, contextMenuRenderer, shell) {
        super(props, model, contextMenuRenderer);
        this.props = props;
        this.model = model;
        this.commandService = commandService;
        this.shell = shell;
        this.addFolder = () => this.doAddFolder();
        this.keyUpHandler = (e) => {
            if (Key.ENTER.keyCode === e.keyCode) {
                e.target.click();
            }
        };
        console.log(model);
        this.id = FILE_NAVIGATOR_ID;
        this.addClass(CLASS);
    }
    init() {
        super.init();
        // This ensures that the context menu command to hide this widget receives the label 'Folders'
        // regardless of the name of workspace. See ViewContainer.updateToolbarItems.
        const dataset = Object.assign(Object.assign({}, this.title.dataset), { visibilityCommandLabel: nls.localizeByDefault('Folders') });
        this.title.dataset = dataset;
        this.updateSelectionContextKeys();
        this.toDispose.pushAll([
            this.model.onSelectionChanged(() => this.updateSelectionContextKeys()),
            this.model.onExpansionChanged(node => {
                if (node.expanded && node.children.length === 1) {
                    const child = node.children[0];
                    if (ExpandableTreeNode.is(child) && !child.expanded) {
                        this.model.expandNode(child);
                    }
                }
            })
        ]);
    }
    renderTree(model) {
        if (this.model.root && this.isEmptyMultiRootWorkspace(model)) {
            return this.renderEmptyMultiRootWorkspace();
        }
        return super.renderTree(model);
    }
    /**
     * When a multi-root workspace is opened, a user can remove all the folders from it.
     * Instead of displaying an empty navigator tree, this will show a button to add more folders.
     */
    renderEmptyMultiRootWorkspace() {
        // TODO: @msujew Implement a markdown renderer and use vscode/explorerViewlet/noFolderHelp
        return React.createElement("div", { className: 'wm-navigator-container' },
            React.createElement("div", { className: 'center' }, "You have not yet added a folder to the workspace."),
            React.createElement("div", { className: 'open-workspace-button-container' },
                React.createElement("button", { className: 'wm-button open-workspace-button', title: 'Add a folder to your workspace', onClick: this.addFolder, onKeyUp: this.keyUpHandler }, "Add Folder")));
    }
    doAddFolder() {
        // this.commandService.executeCommand(WorkspaceCommands.ADD_FOLDER.id);
    }
    doUpdateRows() {
        super.doUpdateRows();
        this.title.label = LABEL;
        if (WorkspaceNode.is(this.model.root)) {
            if (this.model.root.name === WorkspaceNode.name) {
                const rootNode = this.model.root.children[0];
                if (WorkspaceRootNode.is(rootNode)) {
                    this.title.label = this.toNodeName(rootNode);
                    this.title.caption = this.labelProvider.getLongName(rootNode.uri);
                }
            }
            else {
                this.title.label = this.toNodeName(this.model.root);
                this.title.caption = this.title.label;
            }
        }
        else {
            this.title.caption = this.title.label;
        }
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
        this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
        this.enableDndOnMainPanel();
    }
    handleCopy(event) {
        const uris = this.model.selectedFileStatNodes.map(node => node.uri.toString());
        if (uris.length > 0 && event.clipboardData) {
            event.clipboardData.setData('text/plain', uris.join('\n'));
            event.preventDefault();
        }
    }
    handlePaste(event) {
        if (event.clipboardData) {
            const raw = event.clipboardData.getData('text/plain');
            if (!raw) {
                return;
            }
            const target = this.model.selectedFileStatNodes[0];
            if (!target) {
                return;
            }
            for (const file of raw.split('\n')) {
                event.preventDefault();
                const source = new URI(file);
                this.model.copy(source, target);
            }
        }
    }
    enableDndOnMainPanel() {
        const mainPanelNode = this.shell.mainPanel.node;
        this.addEventListener(mainPanelNode, 'drop', async ({ dataTransfer }) => {
            var _a;
            const treeNodes = dataTransfer && this.getSelectedTreeNodesFromData(dataTransfer) || [];
            if (treeNodes.length > 0) {
                treeNodes.filter(FileNode.is).forEach(treeNode => {
                    if (!SelectableTreeNode.isSelected(treeNode)) {
                        this.model.toggleNode(treeNode);
                    }
                });
                this.commandService.executeCommand(FileNavigatorCommands.OPEN.id);
            }
            else if (dataTransfer && ((_a = dataTransfer.files) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                // the files were dragged from the outside the workspace
                // Array.from(dataTransfer.files).forEach(async file => {
                //     const fileUri = new URI(file.path);
                //     const opener = await this.openerService.getOpener(fileUri);
                //     opener.open(fileUri);
                // });
            }
        });
        const handler = (e) => {
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'link';
                e.preventDefault();
            }
        };
        this.addEventListener(mainPanelNode, 'dragover', handler);
        this.addEventListener(mainPanelNode, 'dragenter', handler);
    }
    getSelectedTreeNodesFromData(data) {
        const resources = data.getData('selected-tree-nodes');
        if (!resources) {
            return [];
        }
        const ids = JSON.parse(resources);
        return ids.map(id => this.model.getNode(id)).filter(node => node !== undefined);
    }
    renderTailDecorations(node, props) {
        const tailDecorations = this.getDecorationData(node, 'tailDecorations').filter(notEmpty).reduce((acc, current) => acc.concat(current), []);
        if (tailDecorations.length === 0) {
            return;
        }
        // Handle rendering of directories versus file nodes.
        if (FileStatNode.is(node) && node.fileStat.isDirectory) {
            return this.renderTailDecorationsForDirectoryNode(node, props, tailDecorations);
        }
        else {
            return this.renderTailDecorationsForNode(node, props, tailDecorations);
        }
    }
    renderTailDecorationsForDirectoryNode(node, props, tailDecorations) {
        // If the node represents a directory, we just want to use the decorationData with the highest priority (last element).
        const decoration = tailDecorations[tailDecorations.length - 1];
        const { tooltip, fontData } = decoration;
        const color = decoration.color;
        const className = [TREE_NODE_SEGMENT_CLASS, TREE_NODE_TAIL_CLASS].join(' ');
        const style = fontData ? this.applyFontStyles({}, fontData) : color ? { color } : undefined;
        const content = React.createElement("span", { className: this.getIconClass('circle', [TreeDecoration.Styles.DECORATOR_SIZE_CLASS]) });
        return React.createElement("div", { className: className, style: style, title: tooltip }, content);
    }
    isEmptyMultiRootWorkspace(model) {
        return WorkspaceNode.is(model.root) && model.root.children.length === 0;
    }
    handleClickEvent(node, event) {
        const modifierKeyCombined = isOSX ? (event.shiftKey || event.metaKey) : (event.shiftKey || event.ctrlKey);
        // if (!modifierKeyCombined && node && this.corePreferences['workbench.list.openMode'] === 'singleClick') {
        if (!modifierKeyCombined && node) {
            this.model.previewNode(node);
        }
        super.handleClickEvent(node, event);
    }
    onAfterShow(msg) {
        super.onAfterShow(msg);
        this.contextKeyService.explorerViewletVisible.set(true);
    }
    onAfterHide(msg) {
        super.onAfterHide(msg);
        this.contextKeyService.explorerViewletVisible.set(false);
    }
    updateSelectionContextKeys() {
        this.contextKeyService.explorerResourceIsFolder.set(DirNode.is(this.model.selectedNodes[0]));
    }
};
__decorate([
    inject(NavigatorContextKeyService)
], FileNavigatorWidget.prototype, "contextKeyService", void 0);
__decorate([
    inject(OpenerService)
], FileNavigatorWidget.prototype, "openerService", void 0);
__decorate([
    postConstruct()
], FileNavigatorWidget.prototype, "init", null);
FileNavigatorWidget = __decorate([
    injectable(),
    __param(0, inject(TreeProps)),
    __param(1, inject(FileNavigatorModel)),
    __param(2, inject(CommandService)),
    __param(3, inject(ContextMenuRenderer)),
    __param(4, inject(ApplicationShell))
], FileNavigatorWidget);
export { FileNavigatorWidget };

//# sourceMappingURL=../../lib/browser/navigator-widget.js.map
