import { FileTree } from '../file-tree';
import { FileStat } from '../../common/files';
import { CompositeTreeNode } from '@tart/core/lib/browser';
import { TreeNode } from '@tart/core';
export declare class FileDialogTree extends FileTree {
    /**
     * Extensions for files to be shown
     */
    protected fileExtensions: string[];
    /**
     * Sets extensions for filtering files
     *
     * @param fileExtensions array of extensions
     */
    setFilter(fileExtensions: string[]): void;
    protected toNodes(fileStat: FileStat, parent: CompositeTreeNode): Promise<TreeNode[]>;
    /**
     * Determines whether file or folder can be shown
     *
     * @param fileStat resource to check
     */
    protected isVisible(fileStat: FileStat): boolean;
}
