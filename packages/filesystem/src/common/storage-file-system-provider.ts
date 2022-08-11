import {injectable, postConstruct} from "inversify";
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
import URI from '@tartjs/core/lib/common/uri';
import type {TextDocumentContentChangeEvent} from 'vscode-languageserver-protocol';
import {newWriteableStream, ReadableStreamEvents} from '@tartjs/core/lib/common/stream';
import {CancellationToken, Disposable, DisposableCollection, Emitter, Event} from '@tartjs/core/lib/common';
import {Deferred} from "@tartjs/core/lib/common/promise-util";
import FileSystemAccess from "./storage/file-system-access";
import {BinaryBuffer} from "@tartjs/core/lib/common/buffer";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

@injectable()
export class StorageFileSystemProvider implements Required<FileSystemProvider>, Disposable {

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

  private _fs: FileSystemAccess;

  access(resource: URI, mode: number | undefined): Promise<void> {
    return Promise.resolve(undefined);
  }

  close(fd: number): Promise<void> {
    return Promise.resolve(undefined);
  }

  async copy(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
    const pointer = await this._fs.getPointer(from.path.toString());
    if (FileSystemAccess.IsFile(pointer)) {
      await this.writeFile(to, encoder.encode(await (await pointer['getFile']()).text()), {
        overwrite: true,
        create: true
      });
    } else if (FileSystemAccess.IsDirectory(pointer)) {

    }
    return Promise.resolve(undefined);
  }

  async delete(resource: URI, opts: FileDeleteOptions): Promise<void> {
    let pointer = await this._fs.getPointer(resource.path.toString());
    if (pointer !== undefined) {
      const parent = await this._fs.parentDir(resource.path.toString());
      await this._fs.delete(parent, resource.path.base);
      this.onDidChangeFileEmitter.fire([{type: FileChangeType.DELETED, resource: resource}]);
    }
    return Promise.resolve(undefined);
  }

  fsPath(resource: URI): Promise<string> {
    return Promise.resolve("");
  }

  async mkdir(resource: URI): Promise<void> {
    let pointer = await this._fs.getPointer(resource.path.toString());
    if (FileSystemAccess.IsFile(pointer)) {

    } else if (FileSystemAccess.IsDirectory(pointer)) {

    } else {
      pointer = await this._fs.parentDir(resource.path.toString());
      if (FileSystemAccess.IsDirectory(pointer)) {
        await this._fs.mkdir(pointer, resource.path.toString().split('/').pop());
        this.onDidChangeFileEmitter.fire([{type: FileChangeType.ADDED, resource: resource}]);
      }
    }
    return Promise.resolve(undefined);
  }

  open(resource: URI, opts: FileOpenOptions): Promise<number> {
    return Promise.resolve(0);
  }

  read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    return Promise.resolve(0);
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    const file = await this._fs.getFile(resource.path.toString());
    if (!!file) {
      return new Uint8Array(await file.arrayBuffer());
    }
    return Promise.resolve(undefined);
  }

  async readFileStream(resource: URI, opts: FileReadStreamOptions, token: CancellationToken): Promise<ReadableStreamEvents<Uint8Array>> {
    const stream = newWriteableStream<Uint8Array>(data => BinaryBuffer.concat(data.map(data => BinaryBuffer.wrap(data))).buffer);
    const file = await this._fs.getFile(resource.path.toString());
    const s = file.stream();
    const reader = s['getReader']() as ReadableStreamDefaultReader;
    let res = await reader.read();
    while (!res.done) {
      stream.write(res.value);
      res = await reader.read();
    }
    stream.end();
    return stream;
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    const dir = await this._fs.getDirHandlerFromRoot(resource.path.toString());
    const files = await this._fs.listDir(dir);
    return Promise.resolve(files.map(file => {
      return [file.name, file.kind === 'file' ? FileType.File : FileType.Directory];
    }));
  }

  async rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void> {
    let pointer = await this._fs.getPointer(from.path.toString());
    if (FileSystemAccess.IsFile(pointer)) {
      const dir = await this._fs.parentDir(to.path.toString());
      await this._fs.move(pointer, dir, to.path.base);
      this.onDidChangeFileEmitter.fire([{type: FileChangeType.UPDATED, resource: to}]);
    } else if (FileSystemAccess.IsDirectory(pointer)) {

    } else {

    }
    return Promise.resolve(undefined);
  }

  async stat(resource: URI): Promise<Stat> {
    return await this._fs.getStat(resource.path.toString());
  }

  async updateFile(resource: URI, changes: TextDocumentContentChangeEvent[], opts: FileUpdateOptions): Promise<FileUpdateResult> {
    return Promise.resolve({
      ...(await this._fs.getStat(resource.path.toString())),
      encoding: 'utf8'
    });
  }

  watch(resource: URI, opts: WatchOptions): Disposable {
    return undefined;
  }

  write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    return Promise.resolve(0);
  }

  async writeFile(resource: URI, content: Uint8Array, opts: FileWriteOptions): Promise<void> {
    let pointer = await this._fs.getPointer(resource.path.toString());

    if (FileSystemAccess.IsFile(pointer)) {
      await this._fs.writeFile(pointer, content.buffer);
    } else if (FileSystemAccess.IsDirectory(pointer)) {
    } else {
      const parent = await this._fs.parentDir(resource.path.toString());
      const file = await this._fs.mkFile(parent, resource.path.base);
      await this._fs.writeFile(file, content.buffer);
      this.onDidChangeFileEmitter.fire([{type: FileChangeType.UPDATED, resource: resource}]);
    }
    return Promise.resolve(undefined);
  }

  dispose(): void {
  }

  useLocal(): void {
    this._fs.localRoot();
  }

  @postConstruct()
  protected init(): void {
    this._capabilities = 16781342;
    this._fs = new FileSystemAccess();
    this._fs.setRoot().then(() => {
      this.readyDeferred.resolve();
    });
    this._fs.setNotifyDidChangeFile(({changes}) => {
      this.onDidChangeFileEmitter.fire(changes.map(event => ({
        resource: new URI(event.resource),
        type: event.type
      })));
    });
  }
}
