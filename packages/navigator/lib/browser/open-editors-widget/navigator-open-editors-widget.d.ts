import React from 'react';
import { Container, interfaces } from 'inversify';
import { FileTreeWidget } from '@tart/filesystem';
import { ApplicationShell, ContextMenuRenderer, NavigatableWidget, NodeProps, TabBar, TreeProps, TreeWidget, Widget } from '@tart/core';
import { OpenEditorNode, OpenEditorsModel } from './navigator-open-editors-tree-model';
import { CommandService } from '@tart/core/lib/common';
export declare const OPEN_EDITORS_PROPS: TreeProps;
export interface OpenEditorsNodeRow extends TreeWidget.NodeRow {
    node: OpenEditorNode;
}
export declare class OpenEditorsWidget extends FileTreeWidget {
    readonly props: TreeProps;
    readonly model: OpenEditorsModel;
    protected readonly contextMenuRenderer: ContextMenuRenderer;
    static ID: string;
    static LABEL: string;
    protected readonly applicationShell: ApplicationShell;
    protected readonly commandService: CommandService;
    protected activeTreeNodePrefixElement: string | undefined | null;
    constructor(props: TreeProps, model: OpenEditorsModel, contextMenuRenderer: ContextMenuRenderer);
    get editorWidgets(): NavigatableWidget[];
    static createContainer(parent: interfaces.Container): Container;
    static createWidget(parent: interfaces.Container): OpenEditorsWidget;
    init(): void;
    protected renderNode(node: OpenEditorNode, props: NodeProps): React.ReactNode;
    protected isGroupNode(node: OpenEditorNode): boolean;
    protected isAreaNode(node: OpenEditorNode): boolean;
    protected doRenderNodeRow({ node, depth }: OpenEditorsNodeRow): React.ReactNode;
    protected renderInteractables(node: OpenEditorNode, props: NodeProps): React.ReactNode;
    protected getPrefixIconClass(node: OpenEditorNode): string;
    protected handleGroupActionIconClicked: (e: React.MouseEvent<HTMLAnchorElement>) => Promise<void>;
    protected doHandleGroupActionIconClicked(e: React.MouseEvent<HTMLAnchorElement>): Promise<void>;
    protected sanitizeInputFromClickHandler(groupFromTarget?: string): ApplicationShell.Area | TabBar<Widget> | undefined;
    protected renderPrefixIcon(node: OpenEditorNode): React.ReactNode;
    protected closeEditor: (e: React.MouseEvent<HTMLDivElement>) => Promise<void>;
    protected doCloseEditor(e: React.MouseEvent<HTMLDivElement>): Promise<void>;
}
