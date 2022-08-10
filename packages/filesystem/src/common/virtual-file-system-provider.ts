import {injectable, postConstruct} from 'inversify';
import {
    FileChange,
    FileChangeType,
    FileDeleteOptions,
    FileOpenOptions,
    FileOverwriteOptions,
    FileReadStreamOptions,
    FileSystemProvider,
    FileSystemProviderCapabilities,
    FileType,
    FileUpdateOptions,
    FileUpdateResult,
    FileWriteOptions,
    Stat,
    WatchOptions
} from './files';
import {CancellationToken, Disposable, DisposableCollection, Emitter, Event} from '@tartjs/core/lib/common';
import URI from '@tartjs/core/lib/common/uri';
import {newWriteableStream, ReadableStreamEvents} from '@tartjs/core/lib/common/stream';
import type {TextDocumentContentChangeEvent} from 'vscode-languageserver-protocol';
import {Deferred} from '@tartjs/core/lib/common/promise-util';
import {BinaryBuffer} from '@tartjs/core/lib/common/buffer';
import {
    add_dir_to_pointer,
    add_file_to_pointer,
    FS,
    get_child_list,
    get_pointer,
    get_root_pointer,
    movePointer,
    remove_pointer,
    setNotifyDidChangeFile,
    update_data_file_pointer
} from './localstorage';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export interface VirtualFileChange {
    readonly type: FileChangeType;
    readonly resource: string;
}

export type VirtualFileChanges = VirtualFileChange[];

@injectable()
export class VirtualFileSystemProvider implements Required<FileSystemProvider>, Disposable {

    private readonly onDidChangeCapabilitiesEmitter = new Emitter<void>();
    readonly onDidChangeCapabilities = this.onDidChangeCapabilitiesEmitter.event;

    readonly onFileWatchError: Event<void>;
    protected readonly readyDeferred = new Deferred<void>();
    readonly ready = this.readyDeferred.promise;
    private readonly onDidChangeFileEmitter = new Emitter<readonly FileChange[]>();
    readonly onDidChangeFile = this.onDidChangeFileEmitter.event;
    protected readonly toDispose = new DisposableCollection(
        this.onDidChangeFileEmitter,
    );

    private _capabilities: FileSystemProviderCapabilities = 0;

    get capabilities(): FileSystemProviderCapabilities {
        return this._capabilities;
    }

    private _root: FS.Directory;

    private get root() {
        this._root = get_root_pointer();
        return this._root;
    }

    access(resource: URI, mode: number | undefined): Promise<void> {
        return Promise.resolve(undefined);
    }

    close(fd: number): Promise<void> {
        return Promise.resolve(undefined);
    }

    copy(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
        // console.log('copy');
        const pointer = get_pointer(this.root, from.path.toString());
        if (pointer.type === FS.Type.file) {
            this.writeFile(to, encoder.encode(pointer.data().toString()), {overwrite: true, create: true});
        } else if (pointer.type === FS.Type.directory) {
        }

        return Promise.resolve(undefined);
    }

    delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
        let pointer = get_pointer(this.root, resource.path.toString());
        if (pointer !== undefined) {
            remove_pointer(pointer, resource.toString());
        }
        return Promise.resolve(undefined);
    }

    fsPath(resource: URI): Promise<string> {
        return Promise.resolve('');
    }

    mkdir(resource: URI): Promise<void> {
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

    open(resource: URI, opts: FileOpenOptions): Promise<number> {
        // console.log('open')
        return Promise.resolve(0);
    }

    read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
        // console.log('read');
        return Promise.resolve(0);
    }

    readFile(resource: URI): Promise<Uint8Array> {
        // console.log('readFile');
        const pointer = get_pointer(this.root, resource.path.toString());
        if (pointer.type === FS.Type.file) {
            return Promise.resolve(encoder.encode(pointer.data().toString()));
        }
        return Promise.resolve(undefined);
    }

    readFileStream(resource: URI, opts: FileReadStreamOptions, token: CancellationToken): Promise<ReadableStreamEvents<Uint8Array>> {
        const pointer = get_pointer(this.root, resource.path.toString());
        const stream = newWriteableStream<Uint8Array>(data => BinaryBuffer.concat(data.map(data => BinaryBuffer.wrap(data))).buffer);
        if (pointer !== undefined && pointer.type !== FS.Type.error) {
            stream.write(new TextEncoder().encode(pointer.data().toString()));
        }
        stream.end();
        return Promise.resolve(stream);
    }

    readdir(resource: URI): Promise<[string, FileType][]> {
        const result = get_pointer(this.root, resource.path.toString());

        return Promise.resolve(result.type === FS.Type.directory ?
            get_child_list(result).map((c) => [c.name, c.type === FS.Type.file ? FileType.File : FileType.Directory]) : []);
    }

    rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
        const fileName = to.path.toString().split('/').pop();
        const pointer = get_pointer(this.root, from.path.toString());
        const toPointer = get_pointer(this.root, to.path.toString().slice(0, -(fileName.length + 1)));

        if (pointer.type !== FS.Type.error) {
            movePointer(pointer, toPointer, fileName, to.toString());
        }
        return Promise.resolve(undefined);
    }

    stat(resource: URI): Promise<Stat> {
        // console.log(resource);
        // console.log(this.getStat(resource));
        return Promise.resolve(this.getStat(resource));
    }

    updateFile(resource: URI, changes: TextDocumentContentChangeEvent[], opts: FileUpdateOptions): Promise<FileUpdateResult> {
        return Promise.resolve({
            ...this.getStat(resource),
            encoding: 'utf8'
        });
    }

    watch(resource: URI, opts: WatchOptions): Disposable {
        return undefined;
    }

    write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
        // console.log('write');
        return Promise.resolve(0);
    }

    writeFile(resource: URI, content: Uint8Array, opts: FileWriteOptions): Promise<void> {
        // console.log('write file');
        let pointer = get_pointer(this.root, resource.path.toString());
        switch (pointer.type) {
            case FS.Type.error:
                pointer = get_pointer(this.root, resource.path.toString().split('/').slice(0, -1).join('/'));
                if (pointer !== undefined && pointer.type !== FS.Type.error) {
                    add_file_to_pointer(
                        pointer,
                        resource.toString().split('/').slice(-1),
                        decoder.decode(content),
                        resource.toString()
                    );
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

    dispose(): void {
    }

    @postConstruct()
    protected init(): void {
        this._capabilities = 16781342;
        setNotifyDidChangeFile(({changes}) => {
            this.onDidChangeFileEmitter.fire(changes.map(event => ({
                resource: new URI(event.resource),
                type: event.type
            })));
        });
        this.readyDeferred.resolve();
        this._root = get_root_pointer();
    }

    private getStat(resource: URI): Stat {
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

}
