import React from 'react';
import { FileTreeWidget } from '@tart/filesystem';
import { ApplicationShell, ContextMenuRenderer, NodeProps, OpenerService, TreeDecoration, TreeModel, TreeNode, TreeProps } from '@tart/core';
import { FileNavigatorModel } from './navigator-model';
import { CommandService } from '@tart/core/lib/common';
import { Message } from '@lumino/messaging';
import { NavigatorContextKeyService } from './navigator-context-key-service';
export declare const FILE_NAVIGATOR_ID = "files";
export declare const LABEL: string;
export declare const CLASS = "wm-Files";
export declare class FileNavigatorWidget extends FileTreeWidget {
    readonly props: TreeProps;
    readonly model: FileNavigatorModel;
    protected readonly commandService: CommandService;
    protected readonly shell: ApplicationShell;
    protected readonly contextKeyService: NavigatorContextKeyService;
    protected readonly openerService: OpenerService;
    constructor(props: TreeProps, model: FileNavigatorModel, commandService: CommandService, contextMenuRenderer: ContextMenuRenderer, shell: ApplicationShell);
    protected init(): void;
    protected renderTree(model: TreeModel): React.ReactNode;
    /**
     * When a multi-root workspace is opened, a user can remove all the folders from it.
     * Instead of displaying an empty navigator tree, this will show a button to add more folders.
     */
    protected renderEmptyMultiRootWorkspace(): React.ReactNode;
    protected readonly addFolder: () => void;
    protected doAddFolder(): void;
    protected readonly keyUpHandler: (e: React.KeyboardEvent) => void;
    protected doUpdateRows(): void;
    protected onAfterAttach(msg: Message): void;
    protected handleCopy(event: ClipboardEvent): void;
    protected handlePaste(event: ClipboardEvent): void;
    protected enableDndOnMainPanel(): void;
    protected getSelectedTreeNodesFromData(data: DataTransfer): TreeNode[];
    protected renderTailDecorations(node: TreeNode, props: NodeProps): React.ReactNode;
    protected renderTailDecorationsForDirectoryNode(node: TreeNode, props: NodeProps, tailDecorations: (TreeDecoration.TailDecoration | TreeDecoration.TailDecorationIcon | TreeDecoration.TailDecorationIconClass)[]): React.ReactNode;
    protected isEmptyMultiRootWorkspace(model: TreeModel): boolean;
    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void;
    protected onAfterShow(msg: Message): void;
    protected onAfterHide(msg: Message): void;
    protected updateSelectionContextKeys(): void;
}
