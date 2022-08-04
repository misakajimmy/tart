var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DisposableCollection, Emitter, ResourceError } from '@tart/core/lib/common';
import { inject, injectable } from 'inversify';
import { FileService, TextFileOperationError } from './file-service';
import { BinarySize, ETAG_DISABLED, FileOperationError } from '../common/files';
import { ConfirmDialog, LabelProvider } from '@tart/core';
import { GENERAL_MAX_FILE_SIZE_MB } from './filesystem-preferences';
export var FileResourceVersion;
(function (FileResourceVersion) {
    function is(version) {
        return !!version && 'encoding' in version && 'mtime' in version && 'etag' in version;
    }
    FileResourceVersion.is = is;
})(FileResourceVersion || (FileResourceVersion = {}));
export class FileResource {
    constructor(uri, fileService, options) {
        this.uri = uri;
        this.fileService = fileService;
        this.options = options;
        this.acceptTextOnly = true;
        this.toDispose = new DisposableCollection();
        this.onDidChangeContentsEmitter = new Emitter();
        this.onDidChangeContents = this.onDidChangeContentsEmitter.event;
        this.doSaveContentChanges = async (changes, options) => {
            const version = (options === null || options === void 0 ? void 0 : options.version) || this._version;
            const current = FileResourceVersion.is(version) ? version : undefined;
            if (!current) {
                throw ResourceError.NotFound({ message: 'has not been read yet', data: { uri: this.uri } });
            }
            const etag = current === null || current === void 0 ? void 0 : current.etag;
            try {
                const stat = await this.fileService.update(this.uri, changes, {
                    readEncoding: current.encoding,
                    encoding: options === null || options === void 0 ? void 0 : options.encoding,
                    overwriteEncoding: options === null || options === void 0 ? void 0 : options.overwriteEncoding,
                    etag,
                    mtime: current === null || current === void 0 ? void 0 : current.mtime
                });
                this._version = {
                    etag: stat.etag,
                    mtime: stat.mtime,
                    encoding: stat.encoding
                };
            }
            catch (e) {
                if (e instanceof FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    const { message, stack } = e;
                    throw ResourceError.NotFound({ message, stack, data: { uri: this.uri } });
                }
                if (e instanceof FileOperationError && e.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                    const { message, stack } = e;
                    throw ResourceError.OutOfSync({ message, stack, data: { uri: this.uri } });
                }
                throw e;
            }
        };
        this.toDispose.push(this.onDidChangeContentsEmitter);
        this.toDispose.push(this.fileService.onDidFilesChange(event => {
            if (event.contains(this.uri)) {
                this.sync();
            }
        }));
        this.toDispose.push(this.fileService.onDidRunOperation(e => {
            if ((e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(2 /* FileOperation.MOVE */)) && e.resource.isEqualOrParent(this.uri)) {
                this.sync();
            }
        }));
        try {
            this.toDispose.push(this.fileService.watch(this.uri));
        }
        catch (e) {
            console.error(e);
        }
        this.updateSavingContentChanges();
        this.toDispose.push(this.fileService.onDidChangeFileSystemProviderCapabilities(e => {
            if (e.scheme === this.uri.scheme) {
                this.updateSavingContentChanges();
            }
        }));
    }
    get version() {
        return this._version;
    }
    get encoding() {
        var _a;
        return (_a = this._version) === null || _a === void 0 ? void 0 : _a.encoding;
    }
    dispose() {
        this.toDispose.dispose();
    }
    async readContents(options) {
        var _a, _b;
        try {
            const encoding = (options === null || options === void 0 ? void 0 : options.encoding) || ((_a = this.version) === null || _a === void 0 ? void 0 : _a.encoding);
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
        }
        catch (e) {
            if (e instanceof TextFileOperationError && e.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                if (await this.shouldOpenAsText('The file is either binary or uses an unsupported text encoding.')) {
                    this.acceptTextOnly = false;
                    return this.readContents(options);
                }
            }
            else if (e instanceof FileOperationError && e.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                const stat = await this.fileService.resolve(this.uri, { resolveMetadata: true });
                const maxFileSize = GENERAL_MAX_FILE_SIZE_MB * 1024 * 1024;
                if (((_b = this.limits) === null || _b === void 0 ? void 0 : _b.size) !== maxFileSize && await this.shouldOpenAsText(`The file is too large (${BinarySize.formatSize(stat.size)}).`)) {
                    this.limits = {
                        size: maxFileSize
                    };
                    return this.readContents(options);
                }
            }
            else if (e instanceof FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                this._version = undefined;
                const { message, stack } = e;
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
    async readStream(options) {
        var _a, _b;
        try {
            const encoding = (options === null || options === void 0 ? void 0 : options.encoding) || ((_a = this.version) === null || _a === void 0 ? void 0 : _a.encoding);
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
        }
        catch (e) {
            if (e instanceof TextFileOperationError && e.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                if (await this.shouldOpenAsText('The file is either binary or uses an unsupported text encoding.')) {
                    this.acceptTextOnly = false;
                    return this.readStream(options);
                }
            }
            else if (e instanceof FileOperationError && e.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                const stat = await this.fileService.resolve(this.uri, { resolveMetadata: true });
                const maxFileSize = GENERAL_MAX_FILE_SIZE_MB * 1024 * 1024;
                if (((_b = this.limits) === null || _b === void 0 ? void 0 : _b.size) !== maxFileSize && await this.shouldOpenAsText(`The file is too large (${BinarySize.formatSize(stat.size)}).`)) {
                    this.limits = {
                        size: maxFileSize
                    };
                    return this.readStream(options);
                }
            }
            else if (e instanceof FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                this._version = undefined;
                const { message, stack } = e;
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
    saveContents(content, options) {
        return this.doWrite(content, options);
    }
    saveStream(content, options) {
        return this.doWrite(content, options);
    }
    async doWrite(content, options) {
        const version = (options === null || options === void 0 ? void 0 : options.version) || this._version;
        const current = FileResourceVersion.is(version) ? version : undefined;
        const etag = current === null || current === void 0 ? void 0 : current.etag;
        try {
            const stat = await this.fileService.write(this.uri, content, {
                encoding: options === null || options === void 0 ? void 0 : options.encoding,
                overwriteEncoding: options === null || options === void 0 ? void 0 : options.overwriteEncoding,
                etag,
                mtime: current === null || current === void 0 ? void 0 : current.mtime
            });
            this._version = {
                etag: stat.etag,
                mtime: stat.mtime,
                encoding: stat.encoding
            };
        }
        catch (e) {
            if (e instanceof FileOperationError && e.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                if (etag !== ETAG_DISABLED && await this.shouldOverwrite()) {
                    return this.doWrite(content, Object.assign(Object.assign({}, options), { version: { stat: Object.assign(Object.assign({}, current), { etag: ETAG_DISABLED }) } }));
                }
                const { message, stack } = e;
                throw ResourceError.OutOfSync({ message, stack, data: { uri: this.uri } });
            }
            throw e;
        }
    }
    updateSavingContentChanges() {
        if (this.fileService.hasCapability(this.uri, 33554432 /* FileSystemProviderCapabilities.Update */)) {
            this.saveContentChanges = this.doSaveContentChanges;
        }
        else {
            delete this.saveContentChanges;
        }
    }
    async sync() {
        if (await this.isInSync()) {
            return;
        }
        this.onDidChangeContentsEmitter.fire(undefined);
    }
    async isInSync() {
        try {
            const stat = await this.fileService.resolve(this.uri, { resolveMetadata: true });
            return !!this.version && this.version.mtime >= stat.mtime;
        }
        catch (_a) {
            return !this.version;
        }
    }
    async shouldOverwrite() {
        return this.options.shouldOverwrite();
    }
    async shouldOpenAsText(error) {
        return this.options.shouldOpenAsText(error);
    }
}
let FileResourceResolver = class FileResourceResolver {
    async resolve(uri) {
        let stat;
        try {
            stat = await this.fileService.resolve(uri);
        }
        catch (e) {
            if (!(e instanceof FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
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
    async shouldOverwrite(uri) {
        const dialog = new ConfirmDialog({
            title: `The file '${this.labelProvider.getName(uri)}' has been changed on the file system.`,
            msg: `Do you want to overwrite the changes made to '${this.labelProvider.getLongName(uri)}' on the file system?`,
            ok: 'Yes',
            cancel: 'No'
        });
        return !!await dialog.open();
    }
    async shouldOpenAsText(uri, error) {
        const dialog = new ConfirmDialog({
            title: error,
            msg: `Opening it might take some time and might make the IDE unresponsive. Do you want to open '${this.labelProvider.getLongName(uri)}' anyway?`,
            ok: 'Yes',
            cancel: 'No'
        });
        return !!await dialog.open();
    }
};
__decorate([
    inject(FileService)
], FileResourceResolver.prototype, "fileService", void 0);
__decorate([
    inject(LabelProvider)
], FileResourceResolver.prototype, "labelProvider", void 0);
FileResourceResolver = __decorate([
    injectable()
], FileResourceResolver);
export { FileResourceResolver };

//# sourceMappingURL=../../lib/browser/file-resource.js.map
