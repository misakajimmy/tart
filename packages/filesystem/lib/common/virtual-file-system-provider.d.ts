import { FileChange, FileChangeType, FileDeleteOptions, FileOpenOptions, FileOverwriteOptions, FileReadStreamOptions, FileSystemProvider, FileSystemProviderCapabilities, FileType, FileUpdateOptions, FileUpdateResult, FileWriteOptions, Stat, WatchOptions } from './files';
import { CancellationToken, Disposable, DisposableCollection, Event } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { ReadableStreamEvents } from '@tart/core/lib/common/stream';
import type { TextDocumentContentChangeEvent } from 'vscode-languageserver-protocol';
import { Deferred } from '@tart/core/lib/common/promise-util';
export interface VirtualFileChange {
    readonly type: FileChangeType;
    readonly resource: string;
}
export declare type VirtualFileChanges = VirtualFileChange[];
export declare class VirtualFileSystemProvider implements Required<FileSystemProvider>, Disposable {
    private readonly onDidChangeCapabilitiesEmitter;
    readonly onDidChangeCapabilities: Event<void>;
    readonly onFileWatchError: Event<void>;
    protected readonly readyDeferred: Deferred<void>;
    readonly ready: Promise<void>;
    private readonly onDidChangeFileEmitter;
    readonly onDidChangeFile: Event<readonly FileChange[]>;
    protected readonly toDispose: DisposableCollection;
    private _capabilities;
    get capabilities(): FileSystemProviderCapabilities;
    private _root;
    private get root();
    access(resource: URI, mode: number | undefined): Promise<void>;
    close(fd: number): Promise<void>;
    copy(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void>;
    delete(resource: URI, opts: FileDeleteOptions): Promise<void>;
    fsPath(resource: URI): Promise<string>;
    mkdir(resource: URI): Promise<void>;
    open(resource: URI, opts: FileOpenOptions): Promise<number>;
    read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
    readFile(resource: URI): Promise<Uint8Array>;
    readFileStream(resource: URI, opts: FileReadStreamOptions, token: CancellationToken): Promise<ReadableStreamEvents<Uint8Array>>;
    readdir(resource: URI): Promise<[string, FileType][]>;
    rename(from: URI, to: URI, opts: FileOverwriteOptions): Promise<void>;
    stat(resource: URI): Promise<Stat>;
    updateFile(resource: URI, changes: TextDocumentContentChangeEvent[], opts: FileUpdateOptions): Promise<FileUpdateResult>;
    watch(resource: URI, opts: WatchOptions): Disposable;
    write(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number>;
    writeFile(resource: URI, content: Uint8Array, opts: FileWriteOptions): Promise<void>;
    dispose(): void;
    protected init(): void;
    private getStat;
}
