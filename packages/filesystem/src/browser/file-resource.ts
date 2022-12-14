import {
    DisposableCollection,
    Emitter,
    Event,
    Resource,
    ResourceError,
    ResourceResolver,
    ResourceSaveOptions,
    ResourceVersion
} from '@tartjs/core/lib/common';
import {inject, injectable} from 'inversify';
import URI from '@tartjs/core/lib/common/uri';
import {FileService, TextFileOperationError, TextFileOperationResult} from './file-service';
import {
    BinarySize,
    ETAG_DISABLED,
    FileOperation,
    FileOperationError,
    FileOperationResult,
    FileReadStreamOptions,
    FileSystemProviderCapabilities
} from '../common/files';
import {ConfirmDialog, LabelProvider} from '@tartjs/core';
import {GENERAL_MAX_FILE_SIZE_MB} from './filesystem-preferences';
import {Readable, ReadableStream} from '@tartjs/core/lib/common/stream';

export interface FileResourceVersion extends ResourceVersion {
    readonly encoding: string;
    readonly mtime: number;
    readonly etag: string;
}

export namespace FileResourceVersion {
    export function is(version: ResourceVersion | undefined): version is FileResourceVersion {
        return !!version && 'encoding' in version && 'mtime' in version && 'etag' in version;
    }
}

export interface FileResourceOptions {
    shouldOverwrite: () => Promise<boolean>
    shouldOpenAsText: (error: string) => Promise<boolean>
}

export class FileResource implements Resource {

    saveContentChanges?: Resource['saveContentChanges'];
    protected acceptTextOnly = true;
    protected limits: FileReadStreamOptions['limits'];
    protected readonly toDispose = new DisposableCollection();
    protected readonly onDidChangeContentsEmitter = new Emitter<void>();
    readonly onDidChangeContents: Event<void> = this.onDidChangeContentsEmitter.event;

    constructor(
        readonly uri: URI,
        protected readonly fileService: FileService,
        protected readonly options: FileResourceOptions
    ) {
        this.toDispose.push(this.onDidChangeContentsEmitter);
        this.toDispose.push(this.fileService.onDidFilesChange(event => {
            if (event.contains(this.uri)) {
                this.sync();
            }
        }));
        this.toDispose.push(this.fileService.onDidRunOperation(e => {
            if ((e.isOperation(FileOperation.DELETE) || e.isOperation(FileOperation.MOVE)) && e.resource.isEqualOrParent(this.uri)) {
                this.sync();
            }
        }));
        try {
            this.toDispose.push(this.fileService.watch(this.uri));
        } catch (e) {
            console.error(e);
        }
        this.updateSavingContentChanges();
        this.toDispose.push(this.fileService.onDidChangeFileSystemProviderCapabilities(e => {
            if (e.scheme === this.uri.scheme) {
                this.updateSavingContentChanges();
            }
        }));
    }

    protected _version: FileResourceVersion | undefined;

    get version(): FileResourceVersion | undefined {
        return this._version;
    }

    get encoding(): string | undefined {
        return this._version?.encoding;
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    async readContents(options?: { encoding?: string }): Promise<string> {
        try {
            const encoding = options?.encoding || this.version?.encoding;
            const stat = await this.fileService.read(this.uri, {
                encoding,
                etag: ETAG_DISABLED,
                acceptTextOnly: this.acceptTextOnly,
                limits: this.limits
            });
            this._version = {
                encoding: stat.encoding,
                etag: stat.etag,
                mtime: stat.mtime
            };
            return stat.value;
        } catch (e) {
            if (e instanceof TextFileOperationError && e.textFileOperationResult === TextFileOperationResult.FILE_IS_BINARY) {
                if (await this.shouldOpenAsText('The file is either binary or uses an unsupported text encoding.')) {
                    this.acceptTextOnly = false;
                    return this.readContents(options);
                }
            } else if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_TOO_LARGE) {
                const stat = await this.fileService.resolve(this.uri, {resolveMetadata: true});
                const maxFileSize = GENERAL_MAX_FILE_SIZE_MB * 1024 * 1024;
                if (this.limits?.size !== maxFileSize && await this.shouldOpenAsText(`The file is too large (${BinarySize.formatSize(stat.size)}).`)) {
                    this.limits = {
                        size: maxFileSize
                    };
                    return this.readContents(options);
                }
            } else if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
                this._version = undefined;
                const {message, stack} = e;
                throw ResourceError.NotFound({
                    message, stack,
                    data: {
                        uri: this.uri
                    }
                });
            }
            throw e;
        }
    }

    async readStream(options?: { encoding?: string }): Promise<ReadableStream<string>> {
        try {
            const encoding = options?.encoding || this.version?.encoding;
            const stat = await this.fileService.readStream(this.uri, {
                encoding,
                etag: ETAG_DISABLED,
                acceptTextOnly: this.acceptTextOnly,
                limits: this.limits
            });
            this._version = {
                encoding: stat.encoding,
                etag: stat.etag,
                mtime: stat.mtime
            };
            return stat.value;
        } catch (e) {
            if (e instanceof TextFileOperationError && e.textFileOperationResult === TextFileOperationResult.FILE_IS_BINARY) {
                if (await this.shouldOpenAsText('The file is either binary or uses an unsupported text encoding.')) {
                    this.acceptTextOnly = false;
                    return this.readStream(options);
                }
            } else if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_TOO_LARGE) {
                const stat = await this.fileService.resolve(this.uri, {resolveMetadata: true});
                const maxFileSize = GENERAL_MAX_FILE_SIZE_MB * 1024 * 1024;
                if (this.limits?.size !== maxFileSize && await this.shouldOpenAsText(`The file is too large (${BinarySize.formatSize(stat.size)}).`)) {
                    this.limits = {
                        size: maxFileSize
                    };
                    return this.readStream(options);
                }
            } else if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
                this._version = undefined;
                const {message, stack} = e;
                throw ResourceError.NotFound({
                    message, stack,
                    data: {
                        uri: this.uri
                    }
                });
            }
            throw e;
        }
    }

    saveContents(content: string, options?: ResourceSaveOptions): Promise<void> {
        return this.doWrite(content, options);
    }

    saveStream(content: Readable<string>, options?: ResourceSaveOptions): Promise<void> {
        return this.doWrite(content, options);
    }

    protected async doWrite(content: string | Readable<string>, options?: ResourceSaveOptions): Promise<void> {
        const version = options?.version || this._version;
        const current = FileResourceVersion.is(version) ? version : undefined;
        const etag = current?.etag;
        try {
            const stat = await this.fileService.write(this.uri, content, {
                encoding: options?.encoding,
                overwriteEncoding: options?.overwriteEncoding,
                etag,
                mtime: current?.mtime
            });
            this._version = {
                etag: stat.etag,
                mtime: stat.mtime,
                encoding: stat.encoding
            };
        } catch (e) {
            if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_MODIFIED_SINCE) {
                if (etag !== ETAG_DISABLED && await this.shouldOverwrite()) {
                    return this.doWrite(content, {...options, version: {stat: {...current, etag: ETAG_DISABLED}}});
                }
                const {message, stack} = e;
                throw ResourceError.OutOfSync({message, stack, data: {uri: this.uri}});
            }
            throw e;
        }
    }

    protected updateSavingContentChanges(): void {
        if (this.fileService.hasCapability(this.uri, FileSystemProviderCapabilities.Update)) {
            this.saveContentChanges = this.doSaveContentChanges;
        } else {
            delete this.saveContentChanges;
        }
    }

    protected doSaveContentChanges: Resource['saveContentChanges'] = async (changes, options) => {
        const version = options?.version || this._version;
        const current = FileResourceVersion.is(version) ? version : undefined;
        if (!current) {
            throw ResourceError.NotFound({message: 'has not been read yet', data: {uri: this.uri}});
        }
        const etag = current?.etag;
        try {
            const stat = await this.fileService.update(this.uri, changes, {
                readEncoding: current.encoding,
                encoding: options?.encoding,
                overwriteEncoding: options?.overwriteEncoding,
                etag,
                mtime: current?.mtime
            });
            this._version = {
                etag: stat.etag,
                mtime: stat.mtime,
                encoding: stat.encoding
            };
        } catch (e) {
            if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
                const {message, stack} = e;
                throw ResourceError.NotFound({message, stack, data: {uri: this.uri}});
            }
            if (e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_MODIFIED_SINCE) {
                const {message, stack} = e;
                throw ResourceError.OutOfSync({message, stack, data: {uri: this.uri}});
            }
            throw e;
        }
    };

    protected async sync(): Promise<void> {
        if (await this.isInSync()) {
            return;
        }
        this.onDidChangeContentsEmitter.fire(undefined);
    }

    protected async isInSync(): Promise<boolean> {
        try {
            const stat = await this.fileService.resolve(this.uri, {resolveMetadata: true});
            return !!this.version && this.version.mtime >= stat.mtime;
        } catch {
            return !this.version;
        }
    }

    protected async shouldOverwrite(): Promise<boolean> {
        return this.options.shouldOverwrite();
    }

    protected async shouldOpenAsText(error: string): Promise<boolean> {
        return this.options.shouldOpenAsText(error);
    }
}

@injectable()
export class FileResourceResolver implements ResourceResolver {

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    async resolve(uri: URI): Promise<FileResource> {
        let stat;
        try {
            stat = await this.fileService.resolve(uri);
        } catch (e) {
            if (!(e instanceof FileOperationError && e.fileOperationResult === FileOperationResult.FILE_NOT_FOUND)) {
                throw e;
            }
        }
        if (stat && stat.isDirectory) {
            throw new Error('The given uri is a directory: ' + this.labelProvider.getLongName(uri));
        }
        return new FileResource(uri, this.fileService, {
            shouldOverwrite: () => this.shouldOverwrite(uri),
            shouldOpenAsText: error => this.shouldOpenAsText(uri, error)
        });
    }

    protected async shouldOverwrite(uri: URI): Promise<boolean> {
        const dialog = new ConfirmDialog({
            title: `The file '${this.labelProvider.getName(uri)}' has been changed on the file system.`,
            msg: `Do you want to overwrite the changes made to '${this.labelProvider.getLongName(uri)}' on the file system?`,
            ok: 'Yes',
            cancel: 'No'
        });
        return !!await dialog.open();
    }

    protected async shouldOpenAsText(uri: URI, error: string): Promise<boolean> {
        const dialog = new ConfirmDialog({
            title: error,
            msg: `Opening it might take some time and might make the IDE unresponsive. Do you want to open '${this.labelProvider.getLongName(uri)}' anyway?`,
            ok: 'Yes',
            cancel: 'No'
        });
        return !!await dialog.open();
    }
}
