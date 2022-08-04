import { CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode, TreeImpl, TreeNode } from '@tart/core';
import { MessageService, Mutable, UriSelection } from '@tart/core/lib/common';
import { FileSelection } from '../file-selection';
import { FileStat as DeprecatedFileStat } from '../../common/filesystem';
import { FileStat, FileType, Stat } from '../../common/files';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '../file-service';
export declare class FileTree extends TreeImpl {
    protected readonly fileService: FileService;
    protected readonly messagingService: MessageService;
    resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]>;
    protected resolveFileStat(node: FileStatNode): Promise<FileStat | undefined>;
    protected toNodes(fileStat: FileStat, parent: CompositeTreeNode): Promise<TreeNode[]>;
    protected toNode(fileStat: FileStat, parent: CompositeTreeNode): FileNode | DirNode;
    protected toNodeId(uri: URI, parent: CompositeTreeNode): string;
}
export interface FileStatNode extends SelectableTreeNode, Mutable<UriSelection>, FileSelection {
}
export declare namespace FileStatNode {
    function is(node: object | undefined): node is FileStatNode;
    function getUri(node: TreeNode | undefined): string | undefined;
}
export declare type FileStatNodeData = Omit<FileStatNode, 'uri' | 'fileStat'> & {
    uri: string;
    stat?: Stat | {
        type: FileType;
    } & Partial<Stat>;
    fileStat?: DeprecatedFileStat;
};
export declare namespace FileStatNodeData {
    function is(node: object | undefined): node is FileStatNodeData;
}
export declare type FileNode = FileStatNode;
export declare namespace FileNode {
    function is(node: Object | undefined): node is FileNode;
}
export declare type DirNode = FileStatNode & ExpandableTreeNode;
export declare namespace DirNode {
    function is(node: Object | undefined): node is DirNode;
    function compare(node: TreeNode, node2: TreeNode): number;
    function uriCompare(node: TreeNode, node2: TreeNode): number;
    function dirCompare(node: TreeNode, node2: TreeNode): number;
    function createRoot(fileStat: FileStat): DirNode;
    function getContainingDir(node: TreeNode | undefined): DirNode | undefined;
}
