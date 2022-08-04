import { ContributionProvider, Disposable, Event, WaitUntilEvent } from '@tart/core/lib/common';
import { BaseStatWithMetadata, CopyFileOptions, CreateFileOptions, FileChangesEvent, FileContent, FileDeleteOptions, FileOperation, FileOperationError, FileOperationEvent, FileOperationOptions, FileStat, FileStatWithMetadata, FileStreamContent, FileSystemProvider, FileSystemProviderCapabilities, MoveFileOptions, ReadFileOptions, ResolveFileOptions, ResolveMetadataFileOptions, Stat, WatchOptions, WriteFileOptions } from '../common/files';
import URI from '@tart/core/lib/common/uri';
import type { TextDocumentContentChangeEvent } from 'vscode-languageserver-protocol';
import { LabelProvider } from '@tart/core';
import { EncodingRegistry } from '@tart/core/lib/browser/encoding-registry';
import { Readable, ReadableStream } from '@tart/core/lib/common/stream';
import { EncodingService, ResourceEncoding } from '@tart/core/lib/common/encoding-service';
import { FileSystemPreferences } from './filesystem-preferences';
import { BinaryBuffer, BinaryBufferReadable, BinaryBufferReadableStream } from '@tart/core/lib/common/buffer';
export declare const FileServiceContribution: unique symbol;
/**
 * A {@link FileServiceContribution} can be used to add custom {@link FileSystemProvider}s.
 * For this, the contribution has to listen to the {@link FileSystemProviderActivationEvent} and register
 * the custom {@link FileSystemProvider}s according to the scheme when this event is fired.
 *
 * ### Example usage
 * ```ts
 * export class MyFileServiceContribution implements FileServiceContribution {
 *     registerFileSystemProviders(service: FileService): void {
 *         service.onWillActivateFileSystemProvider(event => {
 *             if (event.scheme === 'mySyncProviderScheme') {
 *                 service.registerProvider('mySyncProviderScheme', this.mySyncProvider);
 *             }
 *             if (event.scheme === 'myAsyncProviderScheme') {
 *                 event.waitUntil((async () => {
 *                     const myAsyncProvider = await this.createAsyncProvider();
 *                     service.registerProvider('myAsyncProviderScheme', myAsyncProvider);
 *                 })());
 *             }
 *         });
 *
 *     }
 *```
 */
export interface FileServiceContribution {
    /**
     * Register custom file system providers for the given {@link FileService}.
     * @param service The file service for which the providers should be registered.
     */
    registerFileSystemProviders(service: FileService): void;
}
/**
 * Represents the `FileSystemProviderActivation` event.
 * This event is fired by the {@link FileService} if it wants to activate the
 * {@link FileSystemProvider} for a specific scheme.
 */
export interface FileSystemProviderActivationEvent extends WaitUntilEvent {
    /** The (uri) scheme for which the provider should be activated */
    scheme: string;
}
/**
 * Represents the `FileSystemProviderCapabilitiesChange` event.
 * This event is fired by the {@link FileService} if the capabilities of one of its managed
 * {@link FileSystemProvider}s have changed.
 */
export interface FileSystemProviderCapabilitiesChangeEvent {
    /** The affected file system provider for which this event was fired. */
    provider: FileSystemProvider;
    /** The (uri) scheme for which the provider is registered */
    scheme: string;
}
/**
 * Represents the `FileSystemProviderRegistration` event.
 * This event is fired by the {@link FileService} if a {@link FileSystemProvider} is
 * registered to or unregistered from the service.
 */
export interface FileSystemProviderRegistrationEvent {
    /** `True` if a new provider has been registered, `false` if a provider has been unregistered. */
    added: boolean;
    /** The (uri) scheme for which the provider was (previously) registered */
    scheme: string;
    /** The affected file system provider for which this event was fired. */
    provider?: FileSystemProvider;
}
export interface ReadEncodingOptions {
    /**
     * The optional encoding parameter allows to specify the desired encoding when resolving
     * the contents of the file.
     */
    encoding?: string;
    /**
     * The optional guessEncoding parameter allows to guess encoding from content of the file.
     */
    autoGuessEncoding?: boolean;
}
interface BaseTextFileContent extends BaseStatWithMetadata {
    /**
     * The encoding of the content if known.
     */
    encoding: string;
}
export interface TextFileStreamContent extends BaseTextFileContent {
    /**
     * The line grouped content of a text file.
     */
    value: ReadableStream<string>;
}
export interface TextFileContent extends BaseTextFileContent {
    /**
     * The content of a text file.
     */
    value: string;
}
export interface WriteEncodingOptions {
    /**
     * The encoding to use when updating a file.
     */
    encoding?: string;
    /**
     * If set to true, will enforce the selected encoding and not perform any detection using BOMs.
     */
    overwriteEncoding?: boolean;
}
export interface ReadTextFileOptions extends ReadEncodingOptions, ReadFileOptions {
    /**
     * The optional acceptTextOnly parameter allows to fail this request early if the file
     * contents are not textual.
     */
    acceptTextOnly?: boolean;
}
export interface CreateTextFileOptions extends WriteEncodingOptions, CreateFileOptions {
}
export interface WriteTextFileOptions extends WriteEncodingOptions, WriteFileOptions {
}
export interface UpdateTextFileOptions extends WriteEncodingOptions, WriteFileOptions {
    readEncoding: string;
}
export interface UserFileOperationEvent extends WaitUntilEvent {
    /**
     * An identifier to correlate the operation through the
     * different event types (before, after, error).
     */
    readonly correlationId: number;
    /**
     * The file operation that is taking place.
     */
    readonly operation: FileOperation;
    /**
     * The resource the event is about.
     */
    readonly target: URI;
    /**
     * A property that is defined for move operations.
     */
    readonly source?: URI;
}
export declare const enum TextFileOperationResult {
    FILE_IS_BINARY = 0
}
export declare class TextFileOperationError extends FileOperationError {
    textFileOperationResult: TextFileOperationResult;
    options?: ReadTextFileOptions & WriteTextFileOptions;
    constructor(message: string, textFileOperationResult: TextFileOperationResult, options?: ReadTextFileOptions & WriteTextFileOptions);
}
/**
 * The {@link FileService} is the common facade responsible for all interactions with file systems.
 * It manages all registered {@link FileSystemProvider}s and
 *  forwards calls to the responsible {@link FileSystemProvider}, determined by the scheme.
 * For additional documentation regarding the provided functions see also {@link FileSystemProvider}.
 */
export declare class FileService {
    protected readonly labelProvider: LabelProvider;
    protected readonly preferences: FileSystemPreferences;
    protected readonly encodingRegistry: EncodingRegistry;
    protected readonly encodingService: EncodingService;
    protected readonly contributions: ContributionProvider<FileServiceContribution>;
    private readonly BUFFER_SIZE;
    private onWillActivateFileSystemProviderEmitter;
    /**
     * See `FileServiceContribution.registerProviders`.
     */
    readonly onWillActivateFileSystemProvider: Event<FileSystemProviderActivationEvent>;
    private onDidChangeFileSystemProviderRegistrationsEmitter;
    private readonly providers;
    private readonly activations;
    private correlationIds;
    private readonly onWillRunUserOperationEmitter;
    /**
     * An event that is emitted when file operation is being performed.
     * This event is triggered by user gestures.
     */
    readonly onWillRunUserOperation: Event<UserFileOperationEvent>;
    private readonly onDidFailUserOperationEmitter;
    /**
     * An event that is emitted when file operation is failed.
     * This event is triggered by user gestures.
     */
    readonly onDidFailUserOperation: Event<UserFileOperationEvent>;
    private readonly onDidRunUserOperationEmitter;
    /**
     * An event that is emitted when file operation is finished.
     * This event is triggered by user gestures.
     */
    readonly onDidRunUserOperation: Event<UserFileOperationEvent>;
    private onDidRunOperationEmitter;
    /**
     * An event that is emitted when operation is finished.
     * This event is triggered by user gestures and programmatically.
     */
    readonly onDidRunOperation: Event<FileOperationEvent>;
    private writeQueues;
    private onDidFilesChangeEmitter;
    private activeWatchers;
    private onDidChangeFileSystemProviderCapabilitiesEmitter;
    readonly onDidChangeFileSystemProviderCapabilities: Event<FileSystemProviderCapabilitiesChangeEvent>;
    /**
     * An event that is emitted when files are changed on the disk.
     */
    get onDidFilesChange(): Event<FileChangesEvent>;
    /**
     * Try to resolve file information and metadata for the given resource.
     * @param resource `URI` of the resource that should be resolved.
     * @param options  Options to customize the resolvement process.
     *
     * @return A promise that resolves if the resource could be successfully resolved.
     */
    resolve(resource: URI, options: ResolveMetadataFileOptions): Promise<FileStatWithMetadata>;
    resolve(resource: URI, options?: ResolveFileOptions | undefined): Promise<FileStat>;
    write(resource: URI, value: string | Readable<string>, options?: WriteTextFileOptions): Promise<FileStatWithMetadata & {
        encoding: string;
    }>;
    runFileOperationParticipants(target: URI, source: URI | undefined, operation: FileOperation): Promise<void>;
    copy(source: URI, target: URI, options?: CopyFileOptions): Promise<FileStatWithMetadata>;
    delete(resource: URI, options?: FileOperationOptions & Partial<FileDeleteOptions>): Promise<void>;
    move(source: URI, target: URI, options?: MoveFileOptions): Promise<FileStatWithMetadata>;
    createFolder(resource: URI, options?: FileOperationOptions): Promise<FileStatWithMetadata>;
    writeFile(resource: URI, bufferOrReadableOrStream: BinaryBuffer | BinaryBufferReadable | BinaryBufferReadableStream, options?: WriteFileOptions): Promise<FileStatWithMetadata>;
    /**
     * Tests if the given resource exists in the filesystem.
     * @param resource `URI` of the resource which should be tested.
     * @throws Will throw an error if no {@link FileSystemProvider} is registered for the given resource.
     *
     * @returns A promise that resolves to `true` if the resource exists.
     */
    exists(resource: URI): Promise<boolean>;
    create(resource: URI, value?: string | Readable<string>, options?: CreateTextFileOptions): Promise<FileStatWithMetadata>;
    createFile(resource: URI, bufferOrReadableOrStream?: BinaryBuffer | BinaryBufferReadable | BinaryBufferReadableStream, options?: CreateFileOptions): Promise<FileStatWithMetadata>;
    update(resource: URI, changes: TextDocumentContentChangeEvent[], options: UpdateTextFileOptions): Promise<FileStatWithMetadata & {
        encoding: string;
    }>;
    /**
     * Try to activate the registered provider for the given scheme
     * @param scheme  The uri scheme for which the responsible provider should be activated.
     *
     * @returns A promise of the activated file system provider. Only resolves if a provider is available for this scheme, gets rejected otherwise.
     */
    activateProvider(scheme: string): Promise<FileSystemProvider>;
    /**
     * Tests if the service (i.e the {@link FileSystemProvider} registered for the given uri scheme) provides the given capability.
     * @param resource `URI` of the resource to test.
     * @param capability The required capability.
     *
     * @returns `true` if the resource can be handled and the required capability can be provided.
     */
    hasCapability(resource: URI, capability: FileSystemProviderCapabilities): boolean;
    watch(resource: URI, options?: WatchOptions): Disposable;
    doWatch(resource: URI, options: WatchOptions): Promise<Disposable>;
    /**
     * Registers a new {@link FileSystemProvider} for the given scheme.
     * @param scheme The (uri) scheme for which the provider should be registered.
     * @param provider The file system provider that should be registered.
     *
     * @returns A `Disposable` that can be invoked to unregister the given provider.
     */
    registerProvider(scheme: string, provider: FileSystemProvider): Disposable;
    read(resource: URI, options?: ReadTextFileOptions): Promise<TextFileContent>;
    readFileStream(resource: URI, options?: ReadFileOptions): Promise<FileStreamContent>;
    readStream(resource: URI, options?: ReadTextFileOptions): Promise<TextFileStreamContent>;
    readFile(resource: URI, options?: ReadFileOptions): Promise<FileContent>;
    protected init(): void;
    /**
     * Dirty write prevention: if the file on disk has been changed and does not match our expected
     * mtime and etag, we bail out to prevent dirty writing.
     *
     * First, we check for a mtime that is in the future before we do more checks. The assumption is
     * that only the mtime is an indicator for a file that has changed on disk.
     *
     * Second, if the mtime has advanced, we compare the size of the file on disk with our previous
     * one using the etag() function. Relying only on the mtime check has proven to produce false
     * positives due to file system weirdness (especially around remote file systems). As such, the
     * check for size is a weaker check because it can return a false negative if the file has changed
     * but to the same length. This is a compromise we take to avoid having to produce checksums of
     * the file content for comparison which would be much slower to compute.
     */
    protected modifiedSince(stat: Stat, options?: WriteFileOptions): boolean;
    protected getWriteEncoding(resource: URI, options?: WriteEncodingOptions): Promise<ResourceEncoding>;
    protected doCopy(source: URI, target: URI, overwrite?: boolean): Promise<FileStatWithMetadata>;
    protected doMove(source: URI, target: URI, overwrite?: boolean): Promise<FileStatWithMetadata>;
    protected doDelete(resource: URI, options?: Partial<FileDeleteOptions>): Promise<void>;
    protected doCreate(resource: URI, value?: string | Readable<string>, options?: CreateTextFileOptions): Promise<FileStatWithMetadata>;
    protected rethrowAsFileOperationError(message: string, resource: URI, error: Error, options?: ReadFileOptions & WriteFileOptions & CreateFileOptions): never;
    protected asFileOperationError(message: string, resource: URI, error: Error, options?: ReadFileOptions & WriteFileOptions & CreateFileOptions): FileOperationError;
    protected throwIfFileSystemIsReadonly<T extends FileSystemProvider>(provider: T, resource: URI): T;
    protected withProvider(resource: URI): Promise<FileSystemProvider>;
    protected getEncodingForResource(resource: URI, preferredEncoding?: string): Promise<string>;
    protected getReadEncoding(resource: URI, options?: ReadEncodingOptions, detectedEncoding?: string): Promise<string>;
    protected resolveReadOptions(options?: ReadTextFileOptions): ReadTextFileOptions;
    private resourceForError;
    private doResolveFile;
    private toFileStat;
    private validateWriteFile;
    private doMoveCopy;
    private doCopyFile;
    private doPipeUnbuffered;
    private doPipeUnbufferedQueued;
    private doCopyFolder;
    private doValidateMoveCopy;
    private doWriteBuffered;
    private doWriteStreamBufferedQueued;
    private doWriteReadableBufferedQueued;
    private doWriteBuffer;
    private doWriteUnbuffered;
    private doPipeBuffered;
    private doPipeBufferedQueued;
    private doWriteUnbufferedQueued;
    private doPipeUnbufferedToBuffered;
    private doPipeUnbufferedToBufferedQueued;
    private doPipeBufferedToUnbuffered;
    private ensureWriteQueue;
    private mkdirp;
    private withWriteProvider;
    private toWatchKey;
    private toMapKey;
    private doRead;
    private validateReadFileLimits;
    private validateReadFile;
    private readFileStreamed;
    private readFileUnbuffered;
    private readFileBuffered;
    private doReadAsFileStream;
    private withReadProvider;
    protected useLocalFileSystem(): Promise<any>;
}
export {};
