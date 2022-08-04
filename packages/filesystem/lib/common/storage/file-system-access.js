var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FileSystemAccess_1;
import { FileType } from "../files";
import { injectable } from "inversify";
let FileSystemAccess = FileSystemAccess_1 = class FileSystemAccess {
    constructor() {
    }
    async setRoot() {
        this._root = await navigator.storage.getDirectory();
    }
    async localRoot() {
        // @ts-ignore
        this._root = await window.showDirectoryPicker();
    }
    setNotifyDidChangeFile(change) {
        this._notifyDidChangeFile = change;
    }
    async listDir(root) {
        let res = [];
        let it = root['values']();
        let result = await it.next();
        while (!result.done) {
            res.push(result.value);
            result = await it.next();
        }
        return res;
    }
    async getDirHandler(root, routes) {
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
                }
                else {
                    return undefined;
                }
            }
            catch (e) {
                return undefined;
            }
        }
        return current;
    }
    async getDirHandlerFromRoot(url) {
        return this.getDirHandler(this._root, url);
    }
    async getFileHandler(root, routes) {
        if (routes !== '/') {
            try {
                const dir = await this.parentDir(routes);
                const file = await dir.getFileHandle(routes.split('/').slice(-1)[0]);
                if (file !== undefined) {
                    return file;
                }
                else {
                    return undefined;
                }
            }
            catch (_a) {
                return undefined;
            }
        }
        else {
            return undefined;
        }
    }
    async getFileHandlerFromRoot(routes) {
        return this.getFileHandler(this._root, routes);
    }
    async getFile(url) {
        const file = await this.getFileHandlerFromRoot(url);
        if (FileSystemAccess_1.IsFile(file)) {
            return await file['getFile']();
        }
        else {
            return undefined;
        }
    }
    async getPointer(url) {
        const dir = await this.getDirHandlerFromRoot(url);
        if (dir !== undefined) {
            return dir;
        }
        const file = await this.getFileHandlerFromRoot(url);
        if (file !== undefined) {
            return file;
        }
        return undefined;
    }
    async getStat(url) {
        const file = await this.getFileHandlerFromRoot(url);
        if (file !== undefined) {
            return {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.File,
            };
        }
        const dir = await this.getDirHandlerFromRoot(url);
        if (dir !== undefined) {
            return {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.Directory,
            };
        }
        return undefined;
    }
    async mkdir(root, name) {
        return await root.getDirectoryHandle(name, { create: true });
    }
    async mkFile(root, name) {
        return await root.getFileHandle(name, { create: true });
    }
    async delete(root, name) {
        return await root.removeEntry(name, { recursive: true });
    }
    async parentDir(url) {
        return await this.getDirHandlerFromRoot(url.split('/').slice(0, -1).join('/'));
    }
    async writeFile(fileHandler, data) {
        const stream = await fileHandler['createWritable']();
        await stream.write(data);
        await stream.close();
    }
    async move(file, dir, name) {
        try {
            file['move'](dir, name);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
};
FileSystemAccess = FileSystemAccess_1 = __decorate([
    injectable()
], FileSystemAccess);
export { FileSystemAccess };
(function (FileSystemAccess) {
    function IsFile(arg) {
        return !!arg && ('kind' in arg) && ('name' in arg) && (arg['kind'] === 'file');
    }
    FileSystemAccess.IsFile = IsFile;
    function IsDirectory(arg) {
        return !!arg && ('kind' in arg) && ('name' in arg) && (arg['kind'] === 'directory');
    }
    FileSystemAccess.IsDirectory = IsDirectory;
})(FileSystemAccess || (FileSystemAccess = {}));
export default FileSystemAccess;

//# sourceMappingURL=../../../lib/common/storage/file-system-access.js.map
