import {FileType, Stat} from "../files";
import {injectable} from "inversify";

@injectable()
export class FileSystemAccess {
    private _root: FileSystemDirectoryHandle;
    private _notifyDidChangeFile: ({changes: any}) => any;

    async setRoot() {
        this._root = await navigator.storage.getDirectory();
    }

    async localRoot() {
        // @ts-ignore
        this._root = await window.showDirectoryPicker();
    }

    setNotifyDidChangeFile(change: ({changes: any}) => any) {
        this._notifyDidChangeFile = change;
    }

    constructor() {
    }

    async listDir(root: FileSystemDirectoryHandle): Promise<FileSystemAccess.FileSystemChildrenType[]> {
        let res = [];
        let it = root['values']();
        let result = await it.next();
        while (!result.done) {
            res.push(result.value);
            result = await it.next();
        }
        return res;
    }

    async getDirHandler(root: FileSystemDirectoryHandle, routes: string): Promise<FileSystemDirectoryHandle> {
        let current = root;
        if (routes.startsWith('/')) {
            routes = routes.slice(1);
        }
        if (routes === '' || !routes) {
            return current;
        }
        for (let route of routes.split('/')) {
            try {
                let res = await current.getDirectoryHandle(route);
                if (res !== undefined) {
                    current = res;
                } else {
                    return undefined;
                }
            } catch (e) {
                return undefined;
            }
        }
        return current;
    }

    async getDirHandlerFromRoot(url: string): Promise<FileSystemDirectoryHandle> {
        return this.getDirHandler(this._root, url);
    }

    async getFileHandler(root: FileSystemDirectoryHandle, routes: string): Promise<FileSystemHandle> {
        if (routes !== '/') {
            try {
                const dir = await this.parentDir(routes);
                const file = await dir.getFileHandle(routes.split('/').slice(-1)[0]);
                if (file !== undefined) {
                    return file;
                } else {
                    return undefined;
                }
            } catch {
                return undefined
            }
        } else {
            return undefined;
        }
    }

    async getFileHandlerFromRoot(routes: string): Promise<FileSystemHandle> {
        return this.getFileHandler(this._root, routes);
    }

    async getFile(url: string): Promise<File | undefined> {
        const file = await this.getFileHandlerFromRoot(url);
        if (FileSystemAccess.IsFile(file)) {
            return await file['getFile']();
        } else {
            return undefined;
        }
    }

    async getPointer(url: string): Promise<FileSystemAccess.FileSystemChildrenType> {
        const dir = await this.getDirHandlerFromRoot(url);
        if (dir !== undefined) {
            return dir
        }
        const file = await this.getFileHandlerFromRoot(url);
        if (file !== undefined) {
            return file
        }
        return undefined;
    }

    async getStat(url: string): Promise<Stat> {
        const file = await this.getFileHandlerFromRoot(url);
        if (file !== undefined) {
            return {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.File,
            }
        }
        const dir = await this.getDirHandlerFromRoot(url);
        if (dir !== undefined) {
            return {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.Directory,
            }
        }
        return undefined;
    }

    async mkdir(root: FileSystemDirectoryHandle, name: string): Promise<any> {
        return await root.getDirectoryHandle(name, {create: true});
    }

    async mkFile(root: FileSystemDirectoryHandle, name: string): Promise<any> {
        return await root.getFileHandle(name, {create: true});
    }

    async delete(root: FileSystemDirectoryHandle, name: string): Promise<any> {
        return await root.removeEntry(name, {recursive: true});
    }

    async parentDir(url: string): Promise<FileSystemDirectoryHandle> {
        return await this.getDirHandlerFromRoot(url.split('/').slice(0, -1).join('/'));
    }

    async writeFile(fileHandler: FileSystemHandle, data: any) {
        const stream = await fileHandler['createWritable']();
        await stream.write(data);
        await stream.close();
    }

    async move(file: FileSystemHandle, dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
        try {
            file['move'](dir, name);
            return true;
        } catch {
            return false;
        }
    }
}

export namespace FileSystemAccess {
    export type FileSystemChildrenType = FileSystemHandle | FileSystemDirectoryHandle | undefined;

    export function IsFile(arg: any): arg is FileSystemHandle {
        return !!arg && ('kind' in arg) && ('name' in arg) && (arg['kind'] === 'file');
    }

    export function IsDirectory(arg: any): arg is FileSystemDirectoryHandle {
        return !!arg && ('kind' in arg) && ('name' in arg) && (arg['kind'] === 'directory');
    }
}

export default FileSystemAccess;
