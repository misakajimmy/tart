import { LabelProvider, TreeModelImpl, TreeNode } from '@tart/core';
import { FileService } from '../file-service';
import { FileStatNode } from './file-tree';
import URI from '@tart/core/lib/common/uri';
import { MessageService } from '@tart/core/lib/common';
import { FileChange, FileChangesEvent, FileOperationEvent } from '../../common/files';
import { LocationService } from '../location';
import { CompositeTreeNode } from '@tart/core/lib/browser';
export declare class FileTreeModel extends TreeModelImpl implements LocationService {
    protected readonly labelProvider: LabelProvider;
    protected readonly fileService: FileService;
    protected readonly messageService: MessageService;
    get location(): URI | undefined;
    set location(uri: URI | undefined);
    get selectedFileStatNodes(): Readonly<FileStatNode>[];
    drives(): Promise<URI[]>;
    getNodesByUri(uri: URI): IterableIterator<TreeNode>;
    copy(source: URI, target: Readonly<FileStatNode>): Promise<URI>;
    /**
     * Move the given source file or directory to the given target directory.
     */
    move(source: TreeNode, target: TreeNode): Promise<URI | undefined>;
    protected init(): void;
    /**
     * to workaround https://github.com/Axosoft/nsfw/issues/42
     */
    protected onDidMove(event: FileOperationEvent): void;
    protected onFilesChanged(changes: FileChangesEvent): void;
    protected isRootAffected(changes: FileChangesEvent): boolean;
    protected getAffectedUris(changes: FileChangesEvent): URI[];
    protected isFileContentChanged(change: FileChange): boolean;
    protected refreshAffectedNodes(uris: URI[]): boolean;
    protected getAffectedNodes(uris: URI[]): Map<string, CompositeTreeNode>;
    protected shouldReplace(fileName: string): Promise<boolean>;
}
