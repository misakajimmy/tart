import * as React from 'react';
import { CommandRegistry } from '../../common';
import { ContextKeyService } from '../context-key-service';
import { WindowService } from '../window';
import { TreeModel } from './tree-model';
import { TreeWidget } from './tree-widget';
interface ViewWelcome {
    readonly view: string;
    readonly content: string;
    readonly when?: string;
    readonly order: number;
}
interface IItem {
    readonly welcomeInfo: ViewWelcome;
    visible: boolean;
}
interface ILink {
    readonly label: string;
    readonly href: string;
    readonly title?: string;
}
declare type LinkedTextItem = string | ILink;
export declare class TreeViewWelcomeWidget extends TreeWidget {
    protected readonly commands: CommandRegistry;
    protected readonly contextService: ContextKeyService;
    protected readonly windowService: WindowService;
    protected viewWelcomeNodes: React.ReactNode[];
    protected defaultItem: IItem | undefined;
    protected items: IItem[];
    get visibleItems(): ViewWelcome[];
    handleViewWelcomeContentChange(viewWelcomes: ViewWelcome[]): void;
    handleWelcomeContextChange(): void;
    protected renderTree(model: TreeModel): React.ReactNode;
    protected shouldShowWelcomeView(): boolean;
    protected renderViewWelcome(): React.ReactNode;
    protected updateViewWelcomeNodes(): void;
    protected renderButtonNode(node: ILink, lineKey: string): React.ReactNode;
    protected renderTextNode(node: string, textKey: string): React.ReactNode;
    protected renderCommandLinkNode(node: ILink, linkKey: string): React.ReactNode;
    protected getLinkClassName(href: string): string;
    protected isEnabledClick(href: string): boolean;
    protected openLinkOrCommand: (event: React.MouseEvent, href: string) => void;
    protected parseLinkedText(text: string): LinkedTextItem[];
}
export {};
