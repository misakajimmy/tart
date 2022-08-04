var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, postConstruct } from 'inversify';
import { FileType } from './files';
import { DisposableCollection, Emitter } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { newWriteableStream } from '@tart/core/lib/common/stream';
import { Deferred } from '@tart/core/lib/common/promise-util';
import { BinaryBuffer } from '@tart/core/lib/common/buffer';
import { add_dir_to_pointer, add_file_to_pointer, FS, get_child_list, get_pointer, get_root_pointer, movePointer, remove_pointer, setNotifyDidChangeFile, update_data_file_pointer } from './localstorage';
const decoder = new TextDecoder();
const encoder = new TextEncoder();
let VirtualFileSystemProvider = class VirtualFileSystemProvider {
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
    get root() {
        this._root = get_root_pointer();
        return this._root;
    }
    access(resource, mode) {
        return Promise.resolve(undefined);
    }
    close(fd) {
        return Promise.resolve(undefined);
    }
    copy(from, to, opts) {
        // console.log('copy');
        const pointer = get_pointer(this.root, from.path.toString());
        if (pointer.type === FS.Type.file) {
            this.writeFile(to, encoder.encode(pointer.data().toString()), { overwrite: true, create: true });
        }
        else if (pointer.type === FS.Type.directory) {
        }
        return Promise.resolve(undefined);
    }
    delete(resource, opts) {
        let pointer = get_pointer(this.root, resource.path.toString());
        if (pointer !== undefined) {
            remove_pointer(pointer, resource.toString());
        }
        return Promise.resolve(undefined);
    }
    fsPath(resource) {
        return Promise.resolve('');
    }
    mkdir(resource) {
        // console.log('mkdir');
        let pointer = get_pointer(this.root, resource.path.toString());
        switch (pointer.type) {
            case FS.Type.error:
                pointer = get_pointer(this.root, resource.path.toString().split('/').slice(0, -1).join('/'));
                if (pointer !== undefined && pointer.type !== FS.Type.error) {
                    add_dir_to_pointer(pointer, resource.path.name, '', resource.toString());
                }
                break;
            case FS.Type.file:
                break;
            case FS.Type.directory:
                break;
            default:
                break;
        }
        return Promise.resolve(undefined);
    }
    open(resource, opts) {
        // console.log('open')
        return Promise.resolve(0);
    }
    read(fd, pos, data, offset, length) {
        // console.log('read');
        return Promise.resolve(0);
    }
    readFile(resource) {
        // console.log('readFile');
        const pointer = get_pointer(this.root, resource.path.toString());
        if (pointer.type === FS.Type.file) {
            return Promise.resolve(encoder.encode(pointer.data().toString()));
        }
        return Promise.resolve(undefined);
    }
    readFileStream(resource, opts, token) {
        const pointer = get_pointer(this.root, resource.path.toString());
        const stream = newWriteableStream(data => BinaryBuffer.concat(data.map(data => BinaryBuffer.wrap(data))).buffer);
        if (pointer !== undefined && pointer.type !== FS.Type.error) {
            stream.write(new TextEncoder().encode(pointer.data().toString()));
        }
        stream.end();
        return Promise.resolve(stream);
    }
    readdir(resource) {
        const result = get_pointer(this.root, resource.path.toString());
        return Promise.resolve(result.type === FS.Type.directory ?
            get_child_list(result).map((c) => [c.name, c.type === FS.Type.file ? FileType.File : FileType.Directory]) : []);
    }
    rename(from, to, opts) {
        const fileName = to.path.toString().split('/').pop();
        const pointer = get_pointer(this.root, from.path.toString());
        const toPointer = get_pointer(this.root, to.path.toString().slice(0, -(fileName.length + 1)));
        if (pointer.type !== FS.Type.error) {
            movePointer(pointer, toPointer, fileName, to.toString());
        }
        return Promise.resolve(undefined);
    }
    stat(resource) {
        // console.log(resource);
        // console.log(this.getStat(resource));
        return Promise.resolve(this.getStat(resource));
    }
    updateFile(resource, changes, opts) {
        return Promise.resolve(Object.assign(Object.assign({}, this.getStat(resource)), { encoding: 'utf8' }));
    }
    watch(resource, opts) {
        return undefined;
    }
    write(fd, pos, data, offset, length) {
        // console.log('write');
        return Promise.resolve(0);
    }
    writeFile(resource, content, opts) {
        // console.log('write file');
        let pointer = get_pointer(this.root, resource.path.toString());
        switch (pointer.type) {
            case FS.Type.error:
                pointer = get_pointer(this.root, resource.path.toString().split('/').slice(0, -1).join('/'));
                if (pointer !== undefined && pointer.type !== FS.Type.error) {
                    add_file_to_pointer(pointer, resource.toString().split('/').slice(-1), decoder.decode(content), resource.toString());
                }
                break;
            case FS.Type.file:
                update_data_file_pointer(pointer, decoder.decode(content));
                break;
            case FS.Type.directory:
                break;
            default:
                break;
        }
        return Promise.resolve(undefined);
    }
    dispose() {
    }
    init() {
        this._capabilities = 16781342;
        setNotifyDidChangeFile(({ changes }) => {
            this.onDidChangeFileEmitter.fire(changes.map(event => ({
                resource: new URI(event.resource),
                type: event.type
            })));
        });
        this.readyDeferred.resolve();
        this._root = get_root_pointer();
    }
    getStat(resource) {
        const result = get_pointer(this.root, resource.path.toString());
        return result.type === FS.Type.error ? undefined :
            result.type === FS.Type.file ? {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.File,
            } : {
                ctime: 1637652983302,
                mtime: 1639099297702,
                size: 148,
                type: FileType.Directory,
            };
    }
};
__decorate([
    postConstruct()
], VirtualFileSystemProvider.prototype, "init", null);
VirtualFileSystemProvider = __decorate([
    injectable()
], VirtualFileSystemProvider);
export { VirtualFileSystemProvider };

//# sourceMappingURL=../../lib/common/virtual-file-system-provider.js.map
