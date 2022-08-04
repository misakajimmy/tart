var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, postConstruct } from "inversify";
import { FileType } from './files';
import URI from '@tart/core/lib/common/uri';
import { newWriteableStream } from '@tart/core/lib/common/stream';
import { DisposableCollection, Emitter } from '@tart/core/lib/common';
import { Deferred } from "@tart/core/lib/common/promise-util";
import FileSystemAccess from "./storage/file-system-access";
import { BinaryBuffer } from "@tart/core/lib/common/buffer";
const decoder = new TextDecoder();
const encoder = new TextEncoder();
let StorageFileSystemProvider = class StorageFileSystemProvider {
    constructor() {
        this.onDidChangeCapabilitiesEmitter = new Emitter();
        this.onDidChangeCapabilities = this.onDidChangeCapabilitiesEmitter.event;
        this.readyDeferred = new Deferred();
        this.ready = this.readyDeferred.promise;
        this.onDidChangeFileEmitter = new Emitter();
        this.onDidChangeFile = this.onDidChangeFileEmitter.event;
        this.toDispose = new DisposableCollection(this.onDidChangeFileEmitter);
        this._capabilities = 0;
    }
    get capabilities() {
        return this._capabilities;
    }
    access(resource, mode) {
        return Promise.resolve(undefined);
    }
    close(fd) {
        return Promise.resolve(undefined);
    }
    async copy(from, to, opts) {
        const pointer = await this._fs.getPointer(from.path.toString());
        if (FileSystemAccess.IsFile(pointer)) {
            await this.writeFile(to, encoder.encode(await (await pointer['getFile']()).text()), {
                overwrite: true,
                create: true
            });
        }
        else if (FileSystemAccess.IsDirectory(pointer)) {
        }
        return Promise.resolve(undefined);
    }
    async delete(resource, opts) {
        let pointer = await this._fs.getPointer(resource.path.toString());
        if (pointer !== undefined) {
            const parent = await this._fs.parentDir(resource.path.toString());
            await this._fs.delete(parent, resource.path.base);
            this.onDidChangeFileEmitter.fire([{ type: 2 /* FileChangeType.DELETED */, resource: resource }]);
        }
        return Promise.resolve(undefined);
    }
    fsPath(resource) {
        return Promise.resolve("");
    }
    async mkdir(resource) {
        let pointer = await this._fs.getPointer(resource.path.toString());
        if (FileSystemAccess.IsFile(pointer)) {
        }
        else if (FileSystemAccess.IsDirectory(pointer)) {
        }
        else {
            pointer = await this._fs.parentDir(resource.path.toString());
            if (FileSystemAccess.IsDirectory(pointer)) {
                await this._fs.mkdir(pointer, resource.path.name);
                this.onDidChangeFileEmitter.fire([{ type: 1 /* FileChangeType.ADDED */, resource: resource }]);
            }
        }
        return Promise.resolve(undefined);
    }
    open(resource, opts) {
        return Promise.resolve(0);
    }
    read(fd, pos, data, offset, length) {
        return Promise.resolve(0);
    }
    async readFile(resource) {
        const file = await this._fs.getFile(resource.path.toString());
        if (!!file) {
            return new Uint8Array(await file.arrayBuffer());
        }
        return Promise.resolve(undefined);
    }
    async readFileStream(resource, opts, token) {
        const stream = newWriteableStream(data => BinaryBuffer.concat(data.map(data => BinaryBuffer.wrap(data))).buffer);
        const file = await this._fs.getFile(resource.path.toString());
        const s = file.stream();
        const reader = s['getReader']();
        let res = await reader.read();
        while (!res.done) {
            stream.write(res.value);
            res = await reader.read();
        }
        stream.end();
        return stream;
    }
    async readdir(resource) {
        const dir = await this._fs.getDirHandlerFromRoot(resource.path.toString());
        const files = await this._fs.listDir(dir);
        return Promise.resolve(files.map(file => {
            return [file.name, file.kind === 'file' ? FileType.File : FileType.Directory];
        }));
    }
    async rename(from, to, opts) {
        let pointer = await this._fs.getPointer(from.path.toString());
        if (FileSystemAccess.IsFile(pointer)) {
            const dir = await this._fs.parentDir(to.path.toString());
            await this._fs.move(pointer, dir, to.path.base);
            this.onDidChangeFileEmitter.fire([{ type: 0 /* FileChangeType.UPDATED */, resource: to }]);
        }
        else if (FileSystemAccess.IsDirectory(pointer)) {
        }
        else {
        }
        return Promise.resolve(undefined);
    }
    async stat(resource) {
        return await this._fs.getStat(resource.path.toString());
    }
    async updateFile(resource, changes, opts) {
        return Promise.resolve(Object.assign(Object.assign({}, (await this._fs.getStat(resource.path.toString()))), { encoding: 'utf8' }));
    }
    watch(resource, opts) {
        return undefined;
    }
    write(fd, pos, data, offset, length) {
        return Promise.resolve(0);
    }
    async writeFile(resource, content, opts) {
        let pointer = await this._fs.getPointer(resource.path.toString());
        if (FileSystemAccess.IsFile(pointer)) {
            await this._fs.writeFile(pointer, content.buffer);
        }
        else if (FileSystemAccess.IsDirectory(pointer)) {
        }
        else {
            const parent = await this._fs.parentDir(resource.path.toString());
            const file = await this._fs.mkFile(parent, resource.path.base);
            await this._fs.writeFile(file, content.buffer);
            this.onDidChangeFileEmitter.fire([{ type: 0 /* FileChangeType.UPDATED */, resource: resource }]);
        }
        return Promise.resolve(undefined);
    }
    dispose() {
    }
    useLocal() {
        this._fs.localRoot();
    }
    init() {
        this._capabilities = 16781342;
        this._fs = new FileSystemAccess();
        this._fs.setRoot().then(() => {
            this.readyDeferred.resolve();
        });
        this._fs.setNotifyDidChangeFile(({ changes }) => {
            this.onDidChangeFileEmitter.fire(changes.map(event => ({
                resource: new URI(event.resource),
                type: event.type
            })));
        });
    }
};
__decorate([
    postConstruct()
], StorageFileSystemProvider.prototype, "init", null);
StorageFileSystemProvider = __decorate([
    injectable()
], StorageFileSystemProvider);
export { StorageFileSystemProvider };

//# sourceMappingURL=../../lib/common/storage-file-system-provider.js.map
