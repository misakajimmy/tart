var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named, postConstruct } from 'inversify';
import { AsyncEmitter, CancellationToken, CancellationTokenSource, ContributionProvider, Disposable, DisposableCollection, Emitter, WaitUntilEvent } from '@tart/core/lib/common';
import { ensureFileSystemProviderError, etag, ETAG_DISABLED, FileChangesEvent, FileOperationError, FileOperationEvent, FileStat, FileSystemProviderErrorCode, FileType, hasFileFolderCopyCapability, hasFileReadStreamCapability, hasOpenReadWriteCloseCapability, hasReadWriteCapability, hasUpdateCapability, toFileOperationResult, toFileSystemProviderErrorCode } from '../common/files';
import { Deferred } from '@tart/core/lib/common/promise-util';
import { TernarySearchTree } from '@tart/core/lib/common/ternary-search-tree';
import { LabelProvider } from '@tart/core';
import { EncodingRegistry } from '@tart/core/lib/browser/encoding-registry';
import { consumeStream, isReadableBufferedStream, isReadableStream, peekReadable, peekStream, transform } from '@tart/core/lib/common/stream';
import { EncodingService } from '@tart/core/lib/common/encoding-service';
import { UTF8, UTF8_with_bom } from '@tart/core/lib/common/encodings';
import { FileSystemPreferences } from './filesystem-preferences';
import { BinaryBuffer, BinaryBufferReadable, BinaryBufferReadableBufferedStream, BinaryBufferReadableStream, BinaryBufferWriteableStream } from '@tart/core/lib/common/buffer';
import { readFileIntoStream } from '../common/io';
import { FileSystemUtils } from './file-tree/filesystem-utils';
export const FileServiceContribution = Symbol('FileServiceContribution');
export class TextFileOperationError extends FileOperationError {
    constructor(message, textFileOperationResult, options) {
        super(message, 11 /* FileOperationResult.FILE_OTHER_ERROR */);
        this.textFileOperationResult = textFileOperationResult;
        this.options = options;
        Object.setPrototypeOf(this, TextFileOperationError.prototype);
    }
}
/**
 * The {@link FileService} is the common facade responsible for all interactions with file systems.
 * It manages all registered {@link FileSystemProvider}s and
 *  forwards calls to the responsible {@link FileSystemProvider}, determined by the scheme.
 * For additional documentation regarding the provided functions see also {@link FileSystemProvider}.
 */
let FileService = class FileService {
    constructor() {
        this.BUFFER_SIZE = 64 * 1024;
        this.onWillActivateFileSystemProviderEmitter = new Emitter();
        /**
         * See `FileServiceContribution.registerProviders`.
         */
        this.onWillActivateFileSystemProvider = this.onWillActivateFileSystemProviderEmitter.event;
        this.onDidChangeFileSystemProviderRegistrationsEmitter = new Emitter();
        this.providers = new Map();
        this.activations = new Map();
        this.correlationIds = 0;
        // #region Events
        this.onWillRunUserOperationEmitter = new AsyncEmitter();
        /**
         * An event that is emitted when file operation is being performed.
         * This event is triggered by user gestures.
         */
        this.onWillRunUserOperation = this.onWillRunUserOperationEmitter.event;
        this.onDidFailUserOperationEmitter = new AsyncEmitter();
        /**
         * An event that is emitted when file operation is failed.
         * This event is triggered by user gestures.
         */
        this.onDidFailUserOperation = this.onDidFailUserOperationEmitter.event;
        this.onDidRunUserOperationEmitter = new AsyncEmitter();
        /**
         * An event that is emitted when file operation is finished.
         * This event is triggered by user gestures.
         */
        this.onDidRunUserOperation = this.onDidRunUserOperationEmitter.event;
        this.onDidRunOperationEmitter = new Emitter();
        /**
         * An event that is emitted when operation is finished.
         * This event is triggered by user gestures and programmatically.
         */
        this.onDidRunOperation = this.onDidRunOperationEmitter.event;
        this.writeQueues = new Map();
        this.onDidFilesChangeEmitter = new Emitter();
        this.activeWatchers = new Map();
        this.onDidChangeFileSystemProviderCapabilitiesEmitter = new Emitter();
        this.onDidChangeFileSystemProviderCapabilities = this.onDidChangeFileSystemProviderCapabilitiesEmitter.event;
        /**
         * Converts to an underlying fs provider resource format.
         *
         * For example converting `user-storage` resources to `file` resources under a user home:
         * user-storage:/user/settings.json => file://home/.tart/settings.json
         */
        // async toUnderlyingResource(resource: URI): Promise<URI> {
        //     let provider = await this.withProvider(resource);
        //     while (provider instanceof DelegatingFileSystemProvider) {
        //         resource = provider.toUnderlyingResource(resource);
        //         provider = await this.withProvider(resource);
        //     }
        //     return resource;
        // }
        // protected handleFileWatchError(): void {
        //     this.watcherErrorHandler.handleError();
        // }
    }
    /**
     * An event that is emitted when files are changed on the disk.
     */
    get onDidFilesChange() {
        return this.onDidFilesChangeEmitter.event;
    }
    async resolve(resource, options) {
        try {
            return await this.doResolveFile(resource, options);
        }
        catch (error) {
            // Specially handle file not found case as file operation result
            if (toFileSystemProviderErrorCode(error) === FileSystemProviderErrorCode.FileNotFound) {
                throw new FileOperationError(`Unable to resolve non-existing file ''`, 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            // Bubble up any other error as is
            throw ensureFileSystemProviderError(error);
        }
    }
    async write(resource, value, options) {
        const encoding = await this.getWriteEncoding(resource, options);
        const encoded = await this.encodingService.encodeStream(value, encoding);
        return Object.assign(await this.writeFile(resource, encoded, options), { encoding: encoding.encoding });
    }
    async runFileOperationParticipants(target, source, operation) {
        const participantsTimeout = this.preferences['files.participants.timeout'];
        if (participantsTimeout <= 0) {
            return;
        }
        const cancellationTokenSource = new CancellationTokenSource();
        // return this.progressService.withProgress(this.progressLabel(operation), 'window', async () => {
        //     for (const participant of this.participants) {
        //         if (cancellationTokenSource.token.isCancellationRequested) {
        //             break;
        //         }
        //
        //         try {
        //             const promise = participant.participate(target, source, operation, participantsTimeout, cancellationTokenSource.token);
        //             await Promise.race([
        //                 promise,
        //                 timeout(participantsTimeout, cancellationTokenSource.token).then(() => cancellationTokenSource.dispose(), () => { /* no-op if cancelled */ })
        //             ]);
        //         } catch (err) {
        //             console.warn(err);
        //         }
        //     }
        // });
    }
    async copy(source, target, options) {
        if ((options === null || options === void 0 ? void 0 : options.fromUserGesture) === false) {
            return this.doCopy(source, target, options.overwrite);
        }
        await this.runFileOperationParticipants(target, source, 3 /* FileOperation.COPY */);
        const event = { correlationId: this.correlationIds++, operation: 3 /* FileOperation.COPY */, target, source };
        await this.onWillRunUserOperationEmitter.fire(event);
        let stat;
        try {
            stat = await this.doCopy(source, target, options === null || options === void 0 ? void 0 : options.overwrite);
        }
        catch (error) {
            await this.onDidFailUserOperationEmitter.fire(event);
            throw error;
        }
        await this.onDidRunUserOperationEmitter.fire(event);
        return stat;
    }
    async delete(resource, options) {
        if ((options === null || options === void 0 ? void 0 : options.fromUserGesture) === false) {
            return this.doDelete(resource, options);
        }
        await this.runFileOperationParticipants(resource, undefined, 1 /* FileOperation.DELETE */);
        const event = { correlationId: this.correlationIds++, operation: 1 /* FileOperation.DELETE */, target: resource };
        await this.onWillRunUserOperationEmitter.fire(event);
        try {
            await this.doDelete(resource, options);
        }
        catch (error) {
            await this.onDidFailUserOperationEmitter.fire(event);
            throw error;
        }
        await this.onDidRunUserOperationEmitter.fire(event);
    }
    async move(source, target, options) {
        if ((options === null || options === void 0 ? void 0 : options.fromUserGesture) === false) {
            return this.doMove(source, target, options.overwrite);
        }
        await this.runFileOperationParticipants(target, source, 2 /* FileOperation.MOVE */);
        const event = { correlationId: this.correlationIds++, operation: 2 /* FileOperation.MOVE */, target, source };
        await this.onWillRunUserOperationEmitter.fire(event);
        let stat;
        try {
            stat = await this.doMove(source, target, options === null || options === void 0 ? void 0 : options.overwrite);
        }
        catch (error) {
            await this.onDidFailUserOperationEmitter.fire(event);
            throw error;
        }
        await this.onDidRunUserOperationEmitter.fire(event);
        return stat;
    }
    async createFolder(resource, options = {}) {
        const { fromUserGesture = true, } = options;
        const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
        // mkdir recursively
        await this.mkdirp(provider, resource);
        // events
        const fileStat = await this.resolve(resource, { resolveMetadata: true });
        if (fromUserGesture) {
            this.onDidRunUserOperationEmitter.fire({
                correlationId: this.correlationIds++,
                operation: 0 /* FileOperation.CREATE */,
                target: resource
            });
        }
        else {
            this.onDidRunOperationEmitter.fire(new FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
        }
        return fileStat;
    }
    async writeFile(resource, bufferOrReadableOrStream, options) {
        const provider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(resource), resource);
        try {
            // validate write
            const stat = await this.validateWriteFile(provider, resource, options);
            // mkdir recursively as needed
            if (!stat) {
                await this.mkdirp(provider, resource.parent);
            }
            // optimization: if the provider has unbuffered write capability and the data
            // to write is a Readable, we consume up to 3 chunks and try to write the data
            // unbuffered to reduce the overhead. If the Readable has more data to provide
            // we continue to write buffered.
            let bufferOrReadableOrStreamOrBufferedStream;
            if (hasReadWriteCapability(provider) && !(bufferOrReadableOrStream instanceof BinaryBuffer)) {
                if (isReadableStream(bufferOrReadableOrStream)) {
                    const bufferedStream = await peekStream(bufferOrReadableOrStream, 3);
                    if (bufferedStream.ended) {
                        bufferOrReadableOrStreamOrBufferedStream = BinaryBuffer.concat(bufferedStream.buffer);
                    }
                    else {
                        bufferOrReadableOrStreamOrBufferedStream = bufferedStream;
                    }
                }
                else {
                    bufferOrReadableOrStreamOrBufferedStream = peekReadable(bufferOrReadableOrStream, data => BinaryBuffer.concat(data), 3);
                }
            }
            else {
                bufferOrReadableOrStreamOrBufferedStream = bufferOrReadableOrStream;
            }
            // write file: unbuffered (only if data to write is a buffer, or the provider has no buffered write capability)
            if (!hasOpenReadWriteCloseCapability(provider) || (hasReadWriteCapability(provider) && bufferOrReadableOrStreamOrBufferedStream instanceof BinaryBuffer)) {
                await this.doWriteUnbuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream);
            }
            // write file: buffered
            else {
                await this.doWriteBuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream instanceof BinaryBuffer ? BinaryBufferReadable.fromBuffer(bufferOrReadableOrStreamOrBufferedStream) : bufferOrReadableOrStreamOrBufferedStream);
            }
        }
        catch (error) {
            this.rethrowAsFileOperationError('Unable to write file', resource, error, options);
        }
        return this.resolve(resource, { resolveMetadata: true });
    }
    /**
     * Tests if the given resource exists in the filesystem.
     * @param resource `URI` of the resource which should be tested.
     * @throws Will throw an error if no {@link FileSystemProvider} is registered for the given resource.
     *
     * @returns A promise that resolves to `true` if the resource exists.
     */
    async exists(resource) {
        const provider = await this.withProvider(resource);
        try {
            const stat = await provider.stat(resource);
            return !!stat;
        }
        catch (error) {
            return false;
        }
    }
    async create(resource, value, options) {
        if ((options === null || options === void 0 ? void 0 : options.fromUserGesture) === false) {
            return this.doCreate(resource, value, options);
        }
        await this.runFileOperationParticipants(resource, undefined, 0 /* FileOperation.CREATE */);
        const event = { correlationId: this.correlationIds++, operation: 0 /* FileOperation.CREATE */, target: resource };
        await this.onWillRunUserOperationEmitter.fire(event);
        let stat;
        try {
            stat = await this.doCreate(resource, value, options);
        }
        catch (error) {
            await this.onDidFailUserOperationEmitter.fire(event);
            throw error;
        }
        await this.onDidRunUserOperationEmitter.fire(event);
        return stat;
    }
    async createFile(resource, bufferOrReadableOrStream = BinaryBuffer.fromString(''), options) {
        // validate overwrite
        if (!(options === null || options === void 0 ? void 0 : options.overwrite) && await this.exists(resource)) {
            throw new FileOperationError(`Unable to create file '${this.resourceForError(resource)}' that already exists when overwrite flag is not set`, 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
        }
        // do write into file (this will create it too)
        const fileStat = await this.writeFile(resource, bufferOrReadableOrStream);
        // events
        this.onDidRunOperationEmitter.fire(new FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
        return fileStat;
    }
    async update(resource, changes, options) {
        const provider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(resource), resource);
        try {
            await this.validateWriteFile(provider, resource, options);
            if (hasUpdateCapability(provider)) {
                const encoding = await this.getEncodingForResource(resource, options ? options.encoding : undefined);
                const stat = await provider.updateFile(resource, changes, {
                    readEncoding: options.readEncoding,
                    writeEncoding: encoding,
                    overwriteEncoding: options.overwriteEncoding || false
                });
                return Object.assign(FileStat.fromStat(resource, stat), { encoding: stat.encoding });
            }
            else {
                throw new Error('incremental file update is not supported');
            }
        }
        catch (error) {
            this.rethrowAsFileOperationError('Unable to write file', resource, error, options);
        }
    }
    /**
     * Try to activate the registered provider for the given scheme
     * @param scheme  The uri scheme for which the responsible provider should be activated.
     *
     * @returns A promise of the activated file system provider. Only resolves if a provider is available for this scheme, gets rejected otherwise.
     */
    async activateProvider(scheme) {
        let provider = this.providers.get(scheme);
        if (provider) {
            return provider;
        }
        let activation = this.activations.get(scheme);
        if (!activation) {
            const deferredActivation = new Deferred();
            this.activations.set(scheme, activation = deferredActivation.promise);
            WaitUntilEvent.fire(this.onWillActivateFileSystemProviderEmitter, { scheme }).then(() => {
                provider = this.providers.get(scheme);
                if (!provider) {
                    const error = new Error();
                    error.name = 'ENOPRO';
                    error.message = `No file system provider found for scheme ${scheme}`;
                    throw error;
                }
                else {
                    deferredActivation.resolve(provider);
                }
            }).catch(e => deferredActivation.reject(e));
        }
        return activation;
    }
    /**
     * Tests if the service (i.e the {@link FileSystemProvider} registered for the given uri scheme) provides the given capability.
     * @param resource `URI` of the resource to test.
     * @param capability The required capability.
     *
     * @returns `true` if the resource can be handled and the required capability can be provided.
     */
    hasCapability(resource, capability) {
        const provider = this.providers.get(resource.scheme);
        return !!(provider && (provider.capabilities & capability));
    }
    watch(resource, options = { recursive: false, excludes: [] }) {
        const resolvedOptions = Object.assign(Object.assign({}, options), { 
            // always ignore temporary upload files
            excludes: options.excludes.concat('**/tart_upload_*') });
        let watchDisposed = false;
        let watchDisposable = Disposable.create(() => watchDisposed = true);
        // Watch and wire in disposable which is async but
        // check if we got disposed meanwhile and forward4
        this.doWatch(resource, resolvedOptions).then(disposable => {
            if (watchDisposed) {
                disposable.dispose();
            }
            else {
                watchDisposable = disposable;
            }
        }, error => console.error(error));
        return Disposable.create(() => watchDisposable.dispose());
    }
    async doWatch(resource, options) {
        const provider = await this.withProvider(resource);
        const key = this.toWatchKey(provider, resource, options);
        // Only start watching if we are the first for the given key
        const watcher = this.activeWatchers.get(key) || { count: 0, disposable: provider.watch(resource, options) };
        if (!this.activeWatchers.has(key)) {
            this.activeWatchers.set(key, watcher);
        }
        // Increment usage counter
        watcher.count += 1;
        return Disposable.create(() => {
            // Unref
            watcher.count--;
            // Dispose only when last user is reached
            if (watcher.count === 0) {
                watcher.disposable.dispose();
                this.activeWatchers.delete(key);
            }
        });
    }
    /**
     * Registers a new {@link FileSystemProvider} for the given scheme.
     * @param scheme The (uri) scheme for which the provider should be registered.
     * @param provider The file system provider that should be registered.
     *
     * @returns A `Disposable` that can be invoked to unregister the given provider.
     */
    registerProvider(scheme, provider) {
        if (this.providers.has(scheme)) {
            console.log('error');
            throw new Error(`A filesystem provider for the scheme '${scheme}' is already registered.`);
        }
        this.providers.set(scheme, provider);
        this.onDidChangeFileSystemProviderRegistrationsEmitter.fire({ added: true, scheme, provider });
        const providerDisposables = new DisposableCollection();
        providerDisposables.push(provider.onDidChangeFile(changes => this.onDidFilesChangeEmitter.fire(new FileChangesEvent(changes))));
        // providerDisposables.push(provider.onFileWatchError(() => this.handleFileWatchError()));
        providerDisposables.push(provider.onDidChangeCapabilities(() => this.onDidChangeFileSystemProviderCapabilitiesEmitter.fire({
            provider,
            scheme
        })));
        return Disposable.create(() => {
            this.onDidChangeFileSystemProviderRegistrationsEmitter.fire({ added: false, scheme, provider });
            this.providers.delete(scheme);
            providerDisposables.dispose();
        });
    }
    async read(resource, options) {
        const [bufferStream, decoder] = await this.doRead(resource, Object.assign(Object.assign({}, options), { 
            // optimization: since we know that the caller does not
            // care about buffering, we indicate this to the reader.
            // this reduces all the overhead the buffered reading
            // has (open, read, close) if the provider supports
            // unbuffered reading.
            preferUnbuffered: true }));
        return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || UTF8, value: await consumeStream(decoder.stream, strings => strings.join('')) });
    }
    async readFileStream(resource, options) {
        const provider = await this.withReadProvider(resource);
        return this.doReadAsFileStream(provider, resource, options);
    }
    async readStream(resource, options) {
        const [bufferStream, decoder] = await this.doRead(resource, options);
        return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || UTF8, value: decoder.stream });
    }
    async readFile(resource, options) {
        const provider = await this.withReadProvider(resource);
        const stream = await this.doReadAsFileStream(provider, resource, Object.assign(Object.assign({}, options), { 
            // optimization: since we know that the caller does not
            // care about buffering, we indicate this to the reader.
            // this reduces all the overhead the buffered reading
            // has (open, read, close) if the provider supports
            // unbuffered reading.
            preferUnbuffered: true }));
        return Object.assign(Object.assign({}, stream), { value: await BinaryBufferReadableStream.toBuffer(stream.value) });
    }
    init() {
        for (const contribution of this.contributions.getContributions()) {
            contribution.registerFileSystemProviders(this);
        }
    }
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
    modifiedSince(stat, options) {
        return !!options && typeof options.mtime === 'number' && typeof options.etag === 'string' && options.etag !== ETAG_DISABLED &&
            typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
            options.mtime < stat.mtime && options.etag !== etag({
            mtime: options.mtime /* not using stat.mtime for a reason, see above */,
            size: stat.size
        });
    }
    async getWriteEncoding(resource, options) {
        const encoding = await this.getEncodingForResource(resource, options ? options.encoding : undefined);
        return this.encodingService.toResourceEncoding(encoding, {
            overwriteEncoding: options === null || options === void 0 ? void 0 : options.overwriteEncoding,
            read: async (length) => {
                const buffer = await BinaryBufferReadableStream.toBuffer((await this.readFileStream(resource, { length })).value);
                return buffer.buffer;
            }
        });
    }
    async doCopy(source, target, overwrite) {
        const sourceProvider = await this.withReadProvider(source);
        const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
        // copy
        const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', !!overwrite);
        // resolve and send events
        const fileStat = await this.resolve(target, { resolveMetadata: true });
        this.onDidRunOperationEmitter.fire(new FileOperationEvent(source, mode === 'copy' ? 3 /* FileOperation.COPY */ : 2 /* FileOperation.MOVE */, fileStat));
        return fileStat;
    }
    async doMove(source, target, overwrite) {
        const sourceProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source);
        const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
        // move
        const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'move', !!overwrite);
        // resolve and send events
        const fileStat = await this.resolve(target, { resolveMetadata: true });
        this.onDidRunOperationEmitter.fire(new FileOperationEvent(source, mode === 'move' ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, fileStat));
        return fileStat;
    }
    async doDelete(resource, options) {
        const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
        // Validate trash support
        const useTrash = !!(options === null || options === void 0 ? void 0 : options.useTrash);
        if (useTrash && !(provider.capabilities & 4096 /* FileSystemProviderCapabilities.Trash */)) {
            throw new Error(`Unable to delete file '${this.resourceForError(resource)}' via trash because provider does not support it.`);
        }
        // Validate delete
        const exists = await this.exists(resource);
        if (!exists) {
            throw new FileOperationError(`Unable to delete non-existing file '${this.resourceForError(resource)}'`, 1 /* FileOperationResult.FILE_NOT_FOUND */);
        }
        // Validate recursive
        const recursive = !!(options === null || options === void 0 ? void 0 : options.recursive);
        if (!recursive && exists) {
            const stat = await this.resolve(resource);
            if (stat.isDirectory && Array.isArray(stat.children) && stat.children.length > 0) {
                throw new Error(`Unable to delete non-empty folder '${this.resourceForError(resource)}'.`);
            }
        }
        // Delete through provider
        await provider.delete(resource, { recursive, useTrash });
        // Events
        this.onDidRunOperationEmitter.fire(new FileOperationEvent(resource, 1 /* FileOperation.DELETE */));
    }
    async doCreate(resource, value, options) {
        const encoding = await this.getWriteEncoding(resource, options);
        const encoded = await this.encodingService.encodeStream(value, encoding);
        return this.createFile(resource, encoded, options);
    }
    rethrowAsFileOperationError(message, resource, error, options) {
        throw this.asFileOperationError(message, resource, error, options);
    }
    asFileOperationError(message, resource, error, options) {
        const fileOperationError = new FileOperationError(`${message} '${this.resourceForError(resource)}' (${ensureFileSystemProviderError(error).toString()})`, toFileOperationResult(error), options);
        fileOperationError.stack = `${fileOperationError.stack}\nCaused by: ${error.stack}`;
        return fileOperationError;
    }
    throwIfFileSystemIsReadonly(provider, resource) {
        if (provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */) {
            throw new FileOperationError(`Unable to modify readonly file`, 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
        }
        return provider;
    }
    async withProvider(resource) {
        // Assert path is absolute
        // if (!resource.path.isAbsolute) {
        //     throw new FileOperationError(`Unable to resolve filesystem provider with relative file path`, FileOperationResult.FILE_INVALID_PATH);
        // }
        return this.activateProvider(resource.scheme);
    }
    async getEncodingForResource(resource, preferredEncoding) {
        // resource = await this.toUnderlyingResource(resource);
        return this.encodingRegistry.getEncodingForResource(resource, preferredEncoding);
    }
    getReadEncoding(resource, options, detectedEncoding) {
        let preferredEncoding;
        // Encoding passed in as option
        if (options === null || options === void 0 ? void 0 : options.encoding) {
            if (detectedEncoding === UTF8_with_bom && options.encoding === UTF8) {
                preferredEncoding = UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
            }
            else {
                preferredEncoding = options.encoding; // give passed in encoding highest priority
            }
        }
        else if (detectedEncoding) {
            preferredEncoding = detectedEncoding;
        }
        return this.getEncodingForResource(resource, preferredEncoding);
    }
    resolveReadOptions(options) {
        options = Object.assign(Object.assign({}, options), { autoGuessEncoding: typeof (options === null || options === void 0 ? void 0 : options.autoGuessEncoding) === 'boolean' ? options.autoGuessEncoding : this.preferences['files.autoGuessEncoding'] });
        const limits = options.limits = options.limits || {};
        if (typeof limits.size !== 'number') {
            limits.size = this.preferences['files.maxFileSizeMB'] * 1024 * 1024;
        }
        return options;
    }
    resourceForError(resource) {
        return this.labelProvider.getLongName(resource);
    }
    async doResolveFile(resource, options) {
        const provider = await this.withProvider(resource);
        const resolveTo = options === null || options === void 0 ? void 0 : options.resolveTo;
        const resolveSingleChildDescendants = options === null || options === void 0 ? void 0 : options.resolveSingleChildDescendants;
        const resolveMetadata = options === null || options === void 0 ? void 0 : options.resolveMetadata;
        const stat = await provider.stat(resource);
        let trie;
        return this.toFileStat(provider, resource, stat, undefined, !!resolveMetadata, (stat, siblings) => {
            // lazy trie to check for recursive resolving
            if (!trie) {
                trie = TernarySearchTree.forUris(!!(provider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */));
                trie.set(resource, true);
                if (Array.isArray(resolveTo) && resolveTo.length) {
                    resolveTo.forEach(uri => trie.set(uri, true));
                }
            }
            // check for recursive resolving
            if (Boolean(trie.findSuperstr(stat.resource) || trie.get(stat.resource))) {
                return true;
            }
            // check for resolving single child folders
            if (stat.isDirectory && resolveSingleChildDescendants) {
                return siblings === 1;
            }
            return false;
        });
    }
    async toFileStat(provider, resource, stat, siblings, resolveMetadata, recurse) {
        const fileStat = FileStat.fromStat(resource, stat);
        // check to recurse for directories
        if (fileStat.isDirectory && recurse(fileStat, siblings)) {
            try {
                const entries = await provider.readdir(resource);
                const resolvedEntries = await Promise.all(entries.map(async ([name, type]) => {
                    try {
                        const childResource = resource.resolve(name);
                        const childStat = resolveMetadata ? await provider.stat(childResource) : { type };
                        return await this.toFileStat(provider, childResource, childStat, entries.length, resolveMetadata, recurse);
                    }
                    catch (error) {
                        console.trace(error);
                        return null; // can happen e.g. due to permission errors
                    }
                }));
                // make sure to get rid of null values that signal a failure to resolve a particular entry
                fileStat.children = resolvedEntries.filter(e => !!e);
            }
            catch (error) {
                console.trace(error);
                fileStat.children = []; // gracefully handle errors, we may not have permissions to read
            }
            return fileStat;
        }
        return fileStat;
    }
    async validateWriteFile(provider, resource, options) {
        let stat = undefined;
        try {
            stat = await provider.stat(resource);
        }
        catch (error) {
            return undefined; // file might not exist
        }
        if (stat === undefined) {
            return undefined;
        }
        // file cannot be directory
        if ((stat.type & FileType.Directory) !== 0) {
            throw new FileOperationError(`Unable to write file ${this.resourceForError(resource)} that is actually a directory`, 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
        }
        if (this.modifiedSince(stat, options)) {
            throw new FileOperationError('File Modified Since', 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
        }
        return stat;
    }
    async doMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
        if (source.toString() === target.toString()) {
            return mode; // simulate node.js behaviour here and do a no-op if paths match
        }
        // validation
        const { exists, isSameResourceWithDifferentPathCase } = await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
        // if target exists get valid target
        if (exists && !overwrite) {
            const parent = await this.resolve(target.parent);
            const name = isSameResourceWithDifferentPathCase ? target.path.name : target.path.name + '_copy';
            target = FileSystemUtils.generateUniqueResourceURI(target.parent, parent, name, target.path.ext);
        }
        // delete as needed (unless target is same resource with different path case)
        if (exists && !isSameResourceWithDifferentPathCase && overwrite) {
            await this.delete(target, { recursive: true });
        }
        // create parent folders
        await this.mkdirp(targetProvider, target.parent);
        // copy source => target
        if (mode === 'copy') {
            // same provider with fast copy: leverage copy() functionality
            if (sourceProvider === targetProvider && hasFileFolderCopyCapability(sourceProvider)) {
                await sourceProvider.copy(source, target, { overwrite });
            }
            // when copying via buffer/unbuffered, we have to manually
            // traverse the source if it is a folder and not a file
            else {
                const sourceFile = await this.resolve(source);
                if (sourceFile.isDirectory) {
                    await this.doCopyFolder(sourceProvider, sourceFile, targetProvider, target);
                }
                else {
                    await this.doCopyFile(sourceProvider, source, targetProvider, target);
                }
            }
            return mode;
        }
        // move source => target
        else {
            // same provider: leverage rename() functionality
            if (sourceProvider === targetProvider) {
                await sourceProvider.rename(source, target, { overwrite });
                return mode;
            }
            // across providers: copy to target & delete at source
            else {
                await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', overwrite);
                await this.delete(source, { recursive: true });
                return 'copy';
            }
        }
    }
    async doCopyFile(sourceProvider, source, targetProvider, target) {
        // copy: source (buffered) => target (buffered)
        if (hasOpenReadWriteCloseCapability(sourceProvider) && hasOpenReadWriteCloseCapability(targetProvider)) {
            return this.doPipeBuffered(sourceProvider, source, targetProvider, target);
        }
        // copy: source (buffered) => target (unbuffered)
        if (hasOpenReadWriteCloseCapability(sourceProvider) && hasReadWriteCapability(targetProvider)) {
            return this.doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target);
        }
        // copy: source (unbuffered) => target (buffered)
        if (hasReadWriteCapability(sourceProvider) && hasOpenReadWriteCloseCapability(targetProvider)) {
            return this.doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target);
        }
        // copy: source (unbuffered) => target (unbuffered)
        if (hasReadWriteCapability(sourceProvider) && hasReadWriteCapability(targetProvider)) {
            return this.doPipeUnbuffered(sourceProvider, source, targetProvider, target);
        }
    }
    async doPipeUnbuffered(sourceProvider, source, targetProvider, target) {
        return this.ensureWriteQueue(targetProvider, target, () => this.doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target));
    }
    async doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target) {
        return targetProvider.writeFile(target, await sourceProvider.readFile(source), { create: true, overwrite: true });
    }
    async doCopyFolder(sourceProvider, sourceFolder, targetProvider, targetFolder) {
        // create folder in target
        await targetProvider.mkdir(targetFolder);
        // create children in target
        if (Array.isArray(sourceFolder.children)) {
            await Promise.all(sourceFolder.children.map(async (sourceChild) => {
                const targetChild = targetFolder.resolve(sourceChild.name);
                if (sourceChild.isDirectory) {
                    return this.doCopyFolder(sourceProvider, await this.resolve(sourceChild.resource), targetProvider, targetChild);
                }
                else {
                    return this.doCopyFile(sourceProvider, sourceChild.resource, targetProvider, targetChild);
                }
            }));
        }
    }
    // #region File Watching
    async doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
        let isSameResourceWithDifferentPathCase = false;
        // Check if source is equal or parent to target (requires providers to be the same)
        if (sourceProvider === targetProvider) {
            const isPathCaseSensitive = !!(sourceProvider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (!isPathCaseSensitive) {
                isSameResourceWithDifferentPathCase = source.toString().toLowerCase() === target.toString().toLowerCase();
            }
            if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                throw new Error(`Unable to copy when source '${this.resourceForError(source)}' is same as target '${this.resourceForError(target)}' with different path case on a case insensitive file system`);
            }
            if (!isSameResourceWithDifferentPathCase && target.isEqualOrParent(source, isPathCaseSensitive)) {
                throw new Error(`Unable to move/copy when source '${this.resourceForError(source)}' is parent of target '${this.resourceForError(target)}'.`);
            }
        }
        // Extra checks if target exists and this is not a rename
        const exists = await this.exists(target);
        if (exists && !isSameResourceWithDifferentPathCase) {
            // Special case: if the target is a parent of the source, we cannot delete
            // it as it would delete the source as well. In this case we have to throw
            if (sourceProvider === targetProvider) {
                const isPathCaseSensitive = !!(sourceProvider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                if (source.isEqualOrParent(target, isPathCaseSensitive)) {
                    throw new Error(`Unable to move/copy '${this.resourceForError(source)}' into '${this.resourceForError(target)}' since a file would replace the folder it is contained in.`);
                }
            }
        }
        return { exists, isSameResourceWithDifferentPathCase };
    }
    async doWriteBuffered(provider, resource, readableOrStreamOrBufferedStream) {
        return this.ensureWriteQueue(provider, resource, async () => {
            // open handle
            const handle = await provider.open(resource, { create: true });
            // write into handle until all bytes from buffer have been written
            try {
                if (isReadableStream(readableOrStreamOrBufferedStream) || isReadableBufferedStream(readableOrStreamOrBufferedStream)) {
                    await this.doWriteStreamBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                }
                else {
                    await this.doWriteReadableBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                }
            }
            catch (error) {
                throw ensureFileSystemProviderError(error);
            }
            finally {
                // close handle always
                await provider.close(handle);
            }
        });
    }
    async doWriteStreamBufferedQueued(provider, handle, streamOrBufferedStream) {
        let posInFile = 0;
        let stream;
        // Buffered stream: consume the buffer first by writing
        // it to the target before reading from the stream.
        if (isReadableBufferedStream(streamOrBufferedStream)) {
            if (streamOrBufferedStream.buffer.length > 0) {
                const chunk = BinaryBuffer.concat(streamOrBufferedStream.buffer);
                await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                posInFile += chunk.byteLength;
            }
            // If the stream has been consumed, return early
            if (streamOrBufferedStream.ended) {
                return;
            }
            stream = streamOrBufferedStream.stream;
        }
        // Unbuffered stream - just take as is
        else {
            stream = streamOrBufferedStream;
        }
        return new Promise(async (resolve, reject) => {
            stream.on('data', async (chunk) => {
                // pause stream to perform async write operation
                stream.pause();
                try {
                    await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                }
                catch (error) {
                    return reject(error);
                }
                posInFile += chunk.byteLength;
                // resume stream now that we have successfully written
                // run this on the next tick to prevent increasing the
                // execution stack because resume() may call the event
                // handler again before finishing.
                setTimeout(() => stream.resume());
            });
            stream.on('error', error => reject(error));
            stream.on('end', () => resolve());
        });
    }
    async doWriteReadableBufferedQueued(provider, handle, readable) {
        let posInFile = 0;
        let chunk;
        while ((chunk = readable.read()) !== null) {
            await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
            posInFile += chunk.byteLength;
        }
    }
    async doWriteBuffer(provider, handle, buffer, length, posInFile, posInBuffer) {
        let totalBytesWritten = 0;
        while (totalBytesWritten < length) {
            const bytesWritten = await provider.write(handle, posInFile + totalBytesWritten, buffer.buffer, posInBuffer + totalBytesWritten, length - totalBytesWritten);
            totalBytesWritten += bytesWritten;
        }
    }
    async doWriteUnbuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream) {
        return this.ensureWriteQueue(provider, resource, () => this.doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStreamOrBufferedStream));
    }
    async doPipeBuffered(sourceProvider, source, targetProvider, target) {
        return this.ensureWriteQueue(targetProvider, target, () => this.doPipeBufferedQueued(sourceProvider, source, targetProvider, target));
    }
    async doPipeBufferedQueued(sourceProvider, source, targetProvider, target) {
        let sourceHandle = undefined;
        let targetHandle = undefined;
        try {
            // Open handles
            sourceHandle = await sourceProvider.open(source, { create: false });
            targetHandle = await targetProvider.open(target, { create: true });
            const buffer = BinaryBuffer.alloc(this.BUFFER_SIZE);
            let posInFile = 0;
            let posInBuffer = 0;
            let bytesRead = 0;
            do {
                // read from source (sourceHandle) at current position (posInFile) into buffer (buffer) at
                // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                bytesRead = await sourceProvider.read(sourceHandle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                // write into target (targetHandle) at current position (posInFile) from buffer (buffer) at
                // buffer position (posInBuffer) all bytes we read (bytesRead).
                await this.doWriteBuffer(targetProvider, targetHandle, buffer, bytesRead, posInFile, posInBuffer);
                posInFile += bytesRead;
                posInBuffer += bytesRead;
                // when buffer full, fill it again from the beginning
                if (posInBuffer === buffer.byteLength) {
                    posInBuffer = 0;
                }
            } while (bytesRead > 0);
        }
        catch (error) {
            throw ensureFileSystemProviderError(error);
        }
        finally {
            await Promise.all([
                typeof sourceHandle === 'number' ? sourceProvider.close(sourceHandle) : Promise.resolve(),
                typeof targetHandle === 'number' ? targetProvider.close(targetHandle) : Promise.resolve(),
            ]);
        }
    }
    async doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStreamOrBufferedStream) {
        let buffer;
        if (bufferOrReadableOrStreamOrBufferedStream instanceof BinaryBuffer) {
            buffer = bufferOrReadableOrStreamOrBufferedStream;
        }
        else if (isReadableStream(bufferOrReadableOrStreamOrBufferedStream)) {
            buffer = await BinaryBufferReadableStream.toBuffer(bufferOrReadableOrStreamOrBufferedStream);
        }
        else if (isReadableBufferedStream(bufferOrReadableOrStreamOrBufferedStream)) {
            buffer = await BinaryBufferReadableBufferedStream.toBuffer(bufferOrReadableOrStreamOrBufferedStream);
        }
        else {
            buffer = BinaryBufferReadable.toBuffer(bufferOrReadableOrStreamOrBufferedStream);
        }
        return provider.writeFile(resource, buffer.buffer, { create: true, overwrite: true });
    }
    async doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target) {
        return this.ensureWriteQueue(targetProvider, target, () => this.doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target));
    }
    async doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target) {
        // Open handle
        const targetHandle = await targetProvider.open(target, { create: true });
        // Read entire buffer from source and write buffered
        try {
            const buffer = await sourceProvider.readFile(source);
            await this.doWriteBuffer(targetProvider, targetHandle, BinaryBuffer.wrap(buffer), buffer.byteLength, 0, 0);
        }
        catch (error) {
            throw ensureFileSystemProviderError(error);
        }
        finally {
            await targetProvider.close(targetHandle);
        }
    }
    async doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target) {
        // Read buffer via stream buffered
        const buffer = await BinaryBufferReadableStream.toBuffer(this.readFileBuffered(sourceProvider, source, CancellationToken.None));
        // Write buffer into target at once
        await this.doWriteUnbuffered(targetProvider, target, buffer);
    }
    ensureWriteQueue(provider, resource, task) {
        // ensure to never write to the same resource without finishing
        // the one write. this ensures a write finishes consistently
        // (even with error) before another write is done.
        const queueKey = this.toMapKey(provider, resource);
        const writeQueue = (this.writeQueues.get(queueKey) || Promise.resolve()).then(task, task);
        this.writeQueues.set(queueKey, writeQueue);
        return writeQueue;
    }
    async mkdirp(provider, directory) {
        const directoriesToCreate = [];
        // mkdir until we reach root
        while (!directory.path.isRoot) {
            try {
                const stat = await provider.stat(directory);
                if (stat === undefined) {
                    // Upon error, remember directories that need to be created
                    directoriesToCreate.push(directory.path.base);
                    // Continue up
                    directory = directory.parent;
                    break;
                }
                if ((stat.type & FileType.Directory) === 0) {
                    throw new Error(`Unable to create folder ${this.resourceForError(directory)} that already exists but is not a directory`);
                }
                break; // we have hit a directory that exists -> good
            }
            catch (error) {
                // Bubble up any other error that is not file not found
                if (toFileSystemProviderErrorCode(error) !== FileSystemProviderErrorCode.FileNotFound) {
                    throw error;
                }
                // Upon error, remember directories that need to be created
                directoriesToCreate.push(directory.path.base);
                // Continue up
                directory = directory.parent;
            }
        }
        // Create directories as needed
        for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
            directory = directory.resolve(directoriesToCreate[i]);
            try {
                await provider.mkdir(directory);
            }
            catch (error) {
                if (toFileSystemProviderErrorCode(error) !== FileSystemProviderErrorCode.FileExists) {
                    // For mkdirp() we tolerate that the mkdir() call fails
                    // in case the folder already exists. This follows node.js
                    // own implementation of fs.mkdir({ recursive: true }) and
                    // reduces the chances of race conditions leading to errors
                    // if multiple calls try to create the same folders
                    // As such, we only throw an error here if it is other than
                    // the fact that the file already exists.
                    // (see also https://github.com/microsoft/vscode/issues/89834)
                    throw error;
                }
            }
        }
    }
    async withWriteProvider(resource) {
        const provider = await this.withProvider(resource);
        if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
            return provider;
        }
        throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
    }
    toWatchKey(provider, resource, options) {
        return [
            this.toMapKey(provider, resource),
            String(options.recursive),
            options.excludes.join() // use excludes as part of the key
        ].join();
    }
    toMapKey(provider, resource) {
        const isPathCaseSensitive = !!(provider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
        return isPathCaseSensitive ? resource.toString() : resource.toString().toLowerCase();
    }
    async doRead(resource, options) {
        options = this.resolveReadOptions(options);
        // read stream raw (either buffered or unbuffered)
        let bufferStream;
        if (options === null || options === void 0 ? void 0 : options.preferUnbuffered) {
            const content = await this.readFile(resource, options);
            bufferStream = Object.assign(Object.assign({}, content), { value: BinaryBufferReadableStream.fromBuffer(content.value) });
        }
        else {
            bufferStream = await this.readFileStream(resource, options);
        }
        const decoder = await this.encodingService.decodeStream(bufferStream.value, {
            guessEncoding: options.autoGuessEncoding,
            overwriteEncoding: detectedEncoding => this.getReadEncoding(resource, options, detectedEncoding)
        });
        // validate binary
        if ((options === null || options === void 0 ? void 0 : options.acceptTextOnly) && decoder.detected.seemsBinary) {
            throw new TextFileOperationError('File seems to be binary and cannot be opened as text', 0 /* TextFileOperationResult.FILE_IS_BINARY */, options);
        }
        return [bufferStream, decoder];
    }
    validateReadFileLimits(resource, size, options) {
        if (options === null || options === void 0 ? void 0 : options.limits) {
            let tooLargeErrorResult = undefined;
            if (typeof options.limits.memory === 'number' && size > options.limits.memory) {
                tooLargeErrorResult = 9 /* FileOperationResult.FILE_EXCEEDS_MEMORY_LIMIT */;
            }
            if (typeof options.limits.size === 'number' && size > options.limits.size) {
                tooLargeErrorResult = 7 /* FileOperationResult.FILE_TOO_LARGE */;
            }
            if (typeof tooLargeErrorResult === 'number') {
                throw new FileOperationError(`Unable to read file '${this.resourceForError(resource)}' that is too large to open`, tooLargeErrorResult);
            }
        }
    }
    async validateReadFile(resource, options) {
        const stat = await this.resolve(resource, { resolveMetadata: true });
        // Throw if resource is a directory
        if (stat.isDirectory) {
            throw new FileOperationError(`Unable to read file '${this.resourceForError(resource)}' that is actually a directory`, 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
        }
        // Throw if file not modified since (unless disabled)
        if (options && typeof options.etag === 'string' && options.etag !== ETAG_DISABLED && options.etag === stat.etag) {
            throw new FileOperationError('File not modified since', 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */, options);
        }
        // Throw if file is too large to load
        this.validateReadFileLimits(resource, stat.size, options);
        return stat;
    }
    async readFileStreamed(provider, resource, token, options = Object.create(null)) {
        const fileStream = await provider.readFileStream(resource, options, token);
        return Promise.resolve(transform(fileStream, {
            data: data => data instanceof BinaryBuffer ? data : BinaryBuffer.wrap(data),
            error: error => this.asFileOperationError('Unable to read file', resource, error, options)
        }, data => BinaryBuffer.concat(data)));
    }
    async readFileUnbuffered(provider, resource, options) {
        let buffer = await provider.readFile(resource);
        // respect position option
        if (options && typeof options.position === 'number') {
            buffer = buffer.slice(options.position);
        }
        // respect length option
        if (options && typeof options.length === 'number') {
            buffer = buffer.slice(0, options.length);
        }
        // Throw if file is too large to load
        this.validateReadFileLimits(resource, buffer.byteLength, options);
        return BinaryBufferReadableStream.fromBuffer(BinaryBuffer.wrap(buffer));
    }
    readFileBuffered(provider, resource, token, options = Object.create(null)) {
        const stream = BinaryBufferWriteableStream.create();
        readFileIntoStream(provider, resource, stream, data => data, Object.assign(Object.assign({}, options), { bufferSize: this.BUFFER_SIZE, errorTransformer: error => this.asFileOperationError('Unable to read file', resource, error, options) }), token);
        return stream;
    }
    async doReadAsFileStream(provider, resource, options) {
        // install a cancellation token that gets cancelled
        // when any error occurs. this allows us to resolve
        // the content of the file while resolving metadata
        // but still cancel the operation in certain cases.
        const cancellableSource = new CancellationTokenSource();
        // validate read operation
        const statPromise = this.validateReadFile(resource, options).then(stat => stat, error => {
            cancellableSource.cancel();
            throw error;
        });
        try {
            // if the etag is provided, we await the result of the validation
            // due to the likelyhood of hitting a NOT_MODIFIED_SINCE result.
            // otherwise, we let it run in parallel to the file reading for
            // optimal startup performance.
            if (options && typeof options.etag === 'string' && options.etag !== ETAG_DISABLED) {
                await statPromise;
            }
            let fileStreamPromise;
            // read unbuffered (only if either preferred, or the provider has no buffered read capability)
            if (!(hasOpenReadWriteCloseCapability(provider) || hasFileReadStreamCapability(provider)) || (hasReadWriteCapability(provider) && (options === null || options === void 0 ? void 0 : options.preferUnbuffered))) {
                fileStreamPromise = this.readFileUnbuffered(provider, resource, options);
            }
            // read streamed (always prefer over primitive buffered read)
            else if (hasFileReadStreamCapability(provider)) {
                fileStreamPromise = Promise.resolve(this.readFileStreamed(provider, resource, cancellableSource.token, options));
            }
            // read buffered
            else {
                fileStreamPromise = Promise.resolve(this.readFileBuffered(provider, resource, cancellableSource.token, options));
            }
            const [fileStat, fileStream] = await Promise.all([statPromise, fileStreamPromise]);
            return Object.assign(Object.assign({}, fileStat), { value: fileStream });
        }
        catch (error) {
            this.rethrowAsFileOperationError('Unable to read file', resource, error, options);
        }
    }
    async withReadProvider(resource) {
        const provider = await this.withProvider(resource);
        if (hasOpenReadWriteCloseCapability(provider) || hasReadWriteCapability(provider)) {
            return provider;
        }
        throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite, FileReadStream nor FileOpenReadWriteClose capability which is needed for the read operation.`);
    }
    async useLocalFileSystem() {
        const provider = await this.activateProvider('file');
        // @ts-ignore
        provider.useLocal();
    }
};
__decorate([
    inject(LabelProvider)
], FileService.prototype, "labelProvider", void 0);
__decorate([
    inject(FileSystemPreferences)
], FileService.prototype, "preferences", void 0);
__decorate([
    inject(EncodingRegistry)
], FileService.prototype, "encodingRegistry", void 0);
__decorate([
    inject(EncodingService)
], FileService.prototype, "encodingService", void 0);
__decorate([
    inject(ContributionProvider),
    named(FileServiceContribution)
], FileService.prototype, "contributions", void 0);
__decorate([
    postConstruct()
], FileService.prototype, "init", null);
FileService = __decorate([
    injectable()
], FileService);
export { FileService };

//# sourceMappingURL=../../lib/browser/file-service.js.map
