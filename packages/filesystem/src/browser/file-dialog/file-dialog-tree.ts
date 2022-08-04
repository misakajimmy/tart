import {injectable} from 'inversify';
import {DirNode, FileTree} from '../file-tree';
import {FileStat} from '../../common/files';
import {CompositeTreeNode} from '@tart/core/lib/browser';
import {TreeNode} from '@tart/core';

@injectable()
export class FileDialogTree extends FileTree {

    /**
     * Extensions for files to be shown
     */
    protected fileExtensions: string[] = [];

    /**
     * Sets extensions for filtering files
     *
     * @param fileExtensions array of extensions
     */
    setFilter(fileExtensions: string[]): void {
        this.fileExtensions = fileExtensions.slice();
        this.refresh();
    }

    protected async toNodes(fileStat: FileStat, parent: CompositeTreeNode): Promise<TreeNode[]> {
        if (!fileStat.children) {
            return [];
        }

        const result = await Promise.all(
            fileStat.children
                .filter(child => this.isVisible(child))
                .map(child => this.toNode(child, parent))
        );

        return result.sort(DirNode.compare);
    }

    /**
     * Determines whether file or folder can be shown
     *
     * @param fileStat resource to check
     */
    protected isVisible(fileStat: FileStat): boolean {
        if (fileStat.isDirectory) {
            return true;
        }

        if (this.fileExtensions.length === 0) {
            return true;
        }

        return !this.fileExtensions.every(value => fileStat.resource.path.ext !== '.' + value);
    }

}
