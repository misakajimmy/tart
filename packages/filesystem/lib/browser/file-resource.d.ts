import { DisposableCollection, Emitter, Event, Resource, ResourceResolver, ResourceSaveOptions, ResourceVersion } from '@tart/core/lib/common';
import URI from '@tart/core/lib/common/uri';
import { FileService } from './file-service';
import { FileReadStreamOptions } from '../common/files';
import { LabelProvider } from '@tart/core';
import { Readable, ReadableStream } from '@tart/core/lib/common/stream';
export interface FileResourceVersion extends ResourceVersion {
    readonly encoding: string;
    readonly mtime: number;
    readonly etag: string;
}
export declare namespace FileResourceVersion {
    function is(version: ResourceVersion | undefined): version is FileResourceVersion;
}
export interface FileResourceOptions {
    shouldOverwrite: () => Promise<boolean>;
    shouldOpenAsText: (error: string) => Promise<boolean>;
}
export declare class FileResource implements Resource {
    readonly uri: URI;
    protected readonly fileService: FileService;
    protected readonly options: FileResourceOptions;
    saveContentChanges?: Resource['saveContentChanges'];
    protected acceptTextOnly: boolean;
    protected limits: FileReadStreamOptions['limits'];
    protected readonly toDispose: DisposableCollection;
    protected readonly onDidChangeContentsEmitter: Emitter<void>;
    readonly onDidChangeContents: Event<void>;
    constructor(uri: URI, fileService: FileService, options: FileResourceOptions);
    protected _version: FileResourceVersion | undefined;
    get version(): FileResourceVersion | undefined;
    get encoding(): string | undefined;
    dispose(): void;
    readContents(options?: {
        encoding?: string;
    }): Promise<string>;
    readStream(options?: {
        encoding?: string;
    }): Promise<ReadableStream<string>>;
    saveContents(content: string, options?: ResourceSaveOptions): Promise<void>;
    saveStream(content: Readable<string>, options?: ResourceSaveOptions): Promise<void>;
    protected doWrite(content: string | Readable<string>, options?: ResourceSaveOptions): Promise<void>;
    protected updateSavingContentChanges(): void;
    protected doSaveContentChanges: Resource['saveContentChanges'];
    protected sync(): Promise<void>;
    protected isInSync(): Promise<boolean>;
    protected shouldOverwrite(): Promise<boolean>;
    protected shouldOpenAsText(error: string): Promise<boolean>;
}
export declare class FileResourceResolver implements ResourceResolver {
    protected readonly fileService: FileService;
    protected readonly labelProvider: LabelProvider;
    resolve(uri: URI): Promise<FileResource>;
    protected shouldOverwrite(uri: URI): Promise<boolean>;
    protected shouldOpenAsText(uri: URI, error: string): Promise<boolean>;
}
