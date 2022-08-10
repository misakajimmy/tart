import {inject, injectable} from 'inversify';
import {DidChangeLabelEvent, LabelProvider, LabelProviderContribution} from '@tartjs/core';
import {TreeLabelProvider} from '@tartjs/core/lib/browser/tree/tree-label-provider';
import {FileStatNode} from './file-tree';

@injectable()
export class FileTreeLabelProvider implements LabelProviderContribution {

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(TreeLabelProvider)
    protected readonly treeLabelProvider: TreeLabelProvider;

    canHandle(element: object): number {
        return FileStatNode.is(element) ?
            this.treeLabelProvider.canHandle(element) + 1 :
            0;
    }

    getIcon(node: FileStatNode): string {
        return this.labelProvider.getIcon(node.fileStat);
    }

    getName(node: FileStatNode): string {
        return this.labelProvider.getName(node.fileStat);
    }

    getDescription(node: FileStatNode): string {
        return this.labelProvider.getLongName(node.fileStat);
    }

    affects(node: FileStatNode, event: DidChangeLabelEvent): boolean {
        return event.affects(node.fileStat);
    }

}
