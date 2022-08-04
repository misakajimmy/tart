/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// based on https://github.com/microsoft/vscode/blob/04c36be045a94fee58e5f8992d3e3fd980294a84/src/vs/platform/files/common/files.ts
import URI from '@tart/core/lib/common/uri';
export class FileOperationEvent {
    constructor(resource, operation, target) {
        this.resource = resource;
        this.operation = operation;
        this.target = target;
    }
    isOperation(operation) {
        return this.operation === operation;
    }
}
export class FileChangesEvent {
    constructor(changes) {
        this.changes = changes;
    }
    /**
     * Returns true if this change event contains the provided file with the given change type (if provided). In case of
     * type DELETED, this method will also return true if a folder got deleted that is the parent of the
     * provided file path.
     */
    contains(resource, type) {
        if (!resource) {
            return false;
        }
        const checkForChangeType = typeof type === 'number';
        return this.changes.some(change => {
            if (checkForChangeType && change.type !== type) {
                return false;
            }
            // For deleted also return true when deleted folder is parent of target path
            if (change.type === 2 /* FileChangeType.DELETED */) {
                return resource.isEqualOrParent(change.resource);
            }
            return resource.toString() === change.resource.toString();
        });
    }
    /**
     * Returns the changes that describe added files.
     */
    getAdded() {
        return this.getOfType(1 /* FileChangeType.ADDED */);
    }
    /**
     * Returns if this event contains added files.
     */
    gotAdded() {
        return this.hasType(1 /* FileChangeType.ADDED */);
    }
    /**
     * Returns the changes that describe deleted files.
     */
    getDeleted() {
        return this.getOfType(2 /* FileChangeType.DELETED */);
    }
    /**
     * Returns if this event contains deleted files.
     */
    gotDeleted() {
        return this.hasType(2 /* FileChangeType.DELETED */);
    }
    /**
     * Returns the changes that describe updated files.
     */
    getUpdated() {
        return this.getOfType(0 /* FileChangeType.UPDATED */);
    }
    /**
     * Returns if this event contains updated files.
     */
    gotUpdated() {
        return this.hasType(0 /* FileChangeType.UPDATED */);
    }
    getOfType(type) {
        return this.changes.filter(change => change.type === type);
    }
    hasType(type) {
        return this.changes.some(change => change.type === type);
    }
}
export var BaseStat;
(function (BaseStat) {
    function is(arg) {
        return !!arg && typeof arg === 'object'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            && ('resource' in arg && arg['resource'] instanceof URI)
            && ('name' in arg && typeof arg['name'] === 'string');
    }
    BaseStat.is = is;
})(BaseStat || (BaseStat = {}));
export var FileStat;
(function (FileStat) {
    function is(arg) {
        return BaseStat.is(arg) &&
            ('isFile' in arg && typeof arg['isFile'] === 'boolean') &&
            ('isDirectory' in arg && typeof arg['isDirectory'] === 'boolean') &&
            ('isSymbolicLink' in arg && typeof arg['isSymbolicLink'] === 'boolean');
    }
    FileStat.is = is;
    function asFileType(stat) {
        let res = 0;
        if (stat.isFile) {
            res += FileType.File;
        }
        else if (stat.isDirectory) {
            res += FileType.Directory;
        }
        if (stat.isSymbolicLink) {
            res += FileType.SymbolicLink;
        }
        return res;
    }
    FileStat.asFileType = asFileType;
    function toStat(stat) {
        return {
            type: asFileType(stat),
            ctime: stat.ctime,
            mtime: stat.mtime,
            size: stat.size
        };
    }
    FileStat.toStat = toStat;
    function fromStat(resource, stat) {
        return {
            resource,
            name: resource.path.base || resource.path.toString(),
            isFile: (stat.type & FileType.File) !== 0,
            isDirectory: (stat.type & FileType.Directory) !== 0,
            isSymbolicLink: (stat.type & FileType.SymbolicLink) !== 0,
            mtime: stat.mtime,
            ctime: stat.ctime,
            size: stat.size,
            etag: etag({ mtime: stat.mtime, size: stat.size })
        };
    }
    FileStat.fromStat = fromStat;
    function dir(resource, stat) {
        return fromStat(resource instanceof URI ? resource : new URI(resource), Object.assign({ type: FileType.Directory }, stat));
    }
    FileStat.dir = dir;
    function file(resource, stat) {
        return fromStat(resource instanceof URI ? resource : new URI(resource), Object.assign({ type: FileType.File }, stat));
    }
    FileStat.file = file;
})(FileStat || (FileStat = {}));
export class FileOperationError extends Error {
    constructor(message, fileOperationResult, options) {
        super(message);
        this.fileOperationResult = fileOperationResult;
        this.options = options;
        Object.setPrototypeOf(this, FileOperationError.prototype);
    }
}
export var FileType;
(function (FileType) {
    FileType[FileType["Unknown"] = 0] = "Unknown";
    FileType[FileType["File"] = 1] = "File";
    FileType[FileType["Directory"] = 2] = "Directory";
    FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
})(FileType || (FileType = {}));
export var FileSystemProviderErrorCode;
(function (FileSystemProviderErrorCode) {
    FileSystemProviderErrorCode["FileExists"] = "EntryExists";
    FileSystemProviderErrorCode["FileNotFound"] = "EntryNotFound";
    FileSystemProviderErrorCode["FileNotADirectory"] = "EntryNotADirectory";
    FileSystemProviderErrorCode["FileIsADirectory"] = "EntryIsADirectory";
    FileSystemProviderErrorCode["FileExceedsMemoryLimit"] = "EntryExceedsMemoryLimit";
    FileSystemProviderErrorCode["FileTooLarge"] = "EntryTooLarge";
    FileSystemProviderErrorCode["NoPermissions"] = "NoPermissions";
    FileSystemProviderErrorCode["Unavailable"] = "Unavailable";
    FileSystemProviderErrorCode["Unknown"] = "Unknown";
})(FileSystemProviderErrorCode || (FileSystemProviderErrorCode = {}));
export class FileSystemProviderError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, FileSystemProviderError.prototype);
    }
}
export function createFileSystemProviderError(error, code) {
    const providerError = new FileSystemProviderError(error.toString(), code);
    markAsFileSystemProviderError(providerError, code);
    return providerError;
}
export function ensureFileSystemProviderError(error) {
    if (!error) {
        return createFileSystemProviderError('Unknown Error', FileSystemProviderErrorCode.Unknown); // https://github.com/Microsoft/vscode/issues/72798
    }
    return error;
}
export const FileSystemProvider = Symbol('FileSystemProvider');
export function hasAccessCapability(provider) {
    return !!(provider.capabilities & 16777216 /* FileSystemProviderCapabilities.Access */);
}
export function hasUpdateCapability(provider) {
    console.log(provider.capabilities & 33554432 /* FileSystemProviderCapabilities.Update */);
    console.log(provider);
    console.log(33554432 /* FileSystemProviderCapabilities.Update */);
    return !!(provider.capabilities & 33554432 /* FileSystemProviderCapabilities.Update */);
}
export function hasReadWriteCapability(provider) {
    return !!(provider.capabilities & 2 /* FileSystemProviderCapabilities.FileReadWrite */);
}
export function hasFileFolderCopyCapability(provider) {
    return !!(provider.capabilities & 8 /* FileSystemProviderCapabilities.FileFolderCopy */);
}
export function hasOpenReadWriteCloseCapability(provider) {
    return !!(provider.capabilities & 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
}
export function hasFileReadStreamCapability(provider) {
    return !!(provider.capabilities & 16 /* FileSystemProviderCapabilities.FileReadStream */);
}
export function markAsFileSystemProviderError(error, code) {
    error.name = code ? `${code} (FileSystemError)` : 'FileSystemError';
    return error;
}
export function toFileSystemProviderErrorCode(error) {
    // Guard against abuse
    if (!error) {
        return FileSystemProviderErrorCode.Unknown;
    }
    // FileSystemProviderError comes with the code
    if (error instanceof FileSystemProviderError) {
        return error.code;
    }
    // Any other error, check for name match by assuming that the error
    // went through the markAsFileSystemProviderError() method
    const match = /^(.+) \(FileSystemError\)$/.exec(error.name);
    if (!match) {
        return FileSystemProviderErrorCode.Unknown;
    }
    switch (match[1]) {
        case FileSystemProviderErrorCode.FileExists:
            return FileSystemProviderErrorCode.FileExists;
        case FileSystemProviderErrorCode.FileIsADirectory:
            return FileSystemProviderErrorCode.FileIsADirectory;
        case FileSystemProviderErrorCode.FileNotADirectory:
            return FileSystemProviderErrorCode.FileNotADirectory;
        case FileSystemProviderErrorCode.FileNotFound:
            return FileSystemProviderErrorCode.FileNotFound;
        case FileSystemProviderErrorCode.FileExceedsMemoryLimit:
            return FileSystemProviderErrorCode.FileExceedsMemoryLimit;
        case FileSystemProviderErrorCode.FileTooLarge:
            return FileSystemProviderErrorCode.FileTooLarge;
        case FileSystemProviderErrorCode.NoPermissions:
            return FileSystemProviderErrorCode.NoPermissions;
        case FileSystemProviderErrorCode.Unavailable:
            return FileSystemProviderErrorCode.Unavailable;
    }
    return FileSystemProviderErrorCode.Unknown;
}
export function toFileOperationResult(error) {
    // FileSystemProviderError comes with the result already
    if (error instanceof FileOperationError) {
        return error.fileOperationResult;
    }
    // Otherwise try to find from code
    switch (toFileSystemProviderErrorCode(error)) {
        case FileSystemProviderErrorCode.FileNotFound:
            return 1 /* FileOperationResult.FILE_NOT_FOUND */;
        case FileSystemProviderErrorCode.FileIsADirectory:
            return 0 /* FileOperationResult.FILE_IS_DIRECTORY */;
        case FileSystemProviderErrorCode.FileNotADirectory:
            return 10 /* FileOperationResult.FILE_NOT_DIRECTORY */;
        case FileSystemProviderErrorCode.NoPermissions:
            return 6 /* FileOperationResult.FILE_PERMISSION_DENIED */;
        case FileSystemProviderErrorCode.FileExists:
            return 4 /* FileOperationResult.FILE_MOVE_CONFLICT */;
        case FileSystemProviderErrorCode.FileExceedsMemoryLimit:
            return 9 /* FileOperationResult.FILE_EXCEEDS_MEMORY_LIMIT */;
        case FileSystemProviderErrorCode.FileTooLarge:
            return 7 /* FileOperationResult.FILE_TOO_LARGE */;
        default:
            return 11 /* FileOperationResult.FILE_OTHER_ERROR */;
    }
}
/**
 * A hint to disable etag checking for reading/writing.
 */
export const ETAG_DISABLED = '';
export function etag(stat) {
    if (typeof stat.size !== 'number' || typeof stat.mtime !== 'number') {
        return undefined;
    }
    return stat.mtime.toString(29) + stat.size.toString(31);
}
/**
 * Helper to format a raw byte size into a human readable label.
 */
export class BinarySize {
    static formatSize(size) {
        if (size < BinarySize.KB) {
            return size + 'B';
        }
        if (size < BinarySize.MB) {
            return (size / BinarySize.KB).toFixed(2) + 'KB';
        }
        if (size < BinarySize.GB) {
            return (size / BinarySize.MB).toFixed(2) + 'MB';
        }
        if (size < BinarySize.TB) {
            return (size / BinarySize.GB).toFixed(2) + 'GB';
        }
        return (size / BinarySize.TB).toFixed(2) + 'TB';
    }
}
BinarySize.KB = 1024;
BinarySize.MB = BinarySize.KB * BinarySize.KB;
BinarySize.GB = BinarySize.MB * BinarySize.KB;
BinarySize.TB = BinarySize.GB * BinarySize.KB;

//# sourceMappingURL=../../lib/common/files.js.map
