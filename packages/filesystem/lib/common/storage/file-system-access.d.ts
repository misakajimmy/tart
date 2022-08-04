import { Stat } from "../files";
export declare class FileSystemAccess {
    private _root;
    private _notifyDidChangeFile;
    setRoot(): Promise<void>;
    localRoot(): Promise<void>;
    setNotifyDidChangeFile(change: ({ changes: any }: {
        changes: any;
    }) => any): void;
    constructor();
    listDir(root: FileSystemDirectoryHandle): Promise<FileSystemAccess.FileSystemChildrenType[]>;
    getDirHandler(root: FileSystemDirectoryHandle, routes: string): Promise<FileSystemDirectoryHandle>;
    getDirHandlerFromRoot(url: string): Promise<FileSystemDirectoryHandle>;
    getFileHandler(root: FileSystemDirectoryHandle, routes: string): Promise<FileSystemHandle>;
    getFileHandlerFromRoot(routes: string): Promise<FileSystemHandle>;
    getFile(url: string): Promise<File | undefined>;
    getPointer(url: string): Promise<FileSystemAccess.FileSystemChildrenType>;
    getStat(url: string): Promise<Stat>;
    mkdir(root: FileSystemDirectoryHandle, name: string): Promise<any>;
    mkFile(root: FileSystemDirectoryHandle, name: string): Promise<any>;
    delete(root: FileSystemDirectoryHandle, name: string): Promise<any>;
    parentDir(url: string): Promise<FileSystemDirectoryHandle>;
    writeFile(fileHandler: FileSystemHandle, data: any): Promise<void>;
    move(file: FileSystemHandle, dir: FileSystemDirectoryHandle, name: string): Promise<boolean>;
}
export declare namespace FileSystemAccess {
    type FileSystemChildrenType = FileSystemHandle | FileSystemDirectoryHandle | undefined;
    function IsFile(arg: any): arg is FileSystemHandle;
    function IsDirectory(arg: any): arg is FileSystemDirectoryHandle;
}
export default FileSystemAccess;
