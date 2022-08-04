import { DidChangeLabelEvent, LabelProvider, LabelProviderContribution } from '@tart/core';
import { TreeLabelProvider } from '@tart/core/lib/browser/tree/tree-label-provider';
import { FileStatNode } from './file-tree';
export declare class FileTreeLabelProvider implements LabelProviderContribution {
    protected readonly labelProvider: LabelProvider;
    protected readonly treeLabelProvider: TreeLabelProvider;
    canHandle(element: object): number;
    getIcon(node: FileStatNode): string;
    getName(node: FileStatNode): string;
    getDescription(node: FileStatNode): string;
    affects(node: FileStatNode, event: DidChangeLabelEvent): boolean;
}
