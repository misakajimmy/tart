/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { ApplicationError } from '@tart/core/lib/common';
/**
 * @deprecated since 1.4.0 - in order to support VS Code FS API (https://github.com/eclipse-tart/tart/pull/7908), use `FileService` instead
 */
export const FileSystem = Symbol('FileSystem');
/**
 * @deprecated since 1.4.0 - in order to support VS Code FS API (https://github.com/eclipse-tart/tart/pull/7908), use `FileService.access` instead
 */
export var FileAccess;
(function (FileAccess) {
    let Constants;
    (function (Constants) {
        /**
         * Flag indicating that the file is visible to the calling process.
         * This is useful for determining if a file exists, but says nothing about rwx permissions. Default if no mode is specified.
         */
        Constants.F_OK = 0;
        /**
         * Flag indicating that the file can be read by the calling process.
         */
        Constants.R_OK = 4;
        /**
         * Flag indicating that the file can be written by the calling process.
         */
        Constants.W_OK = 2;
        /**
         * Flag indicating that the file can be executed by the calling process.
         * This has no effect on Windows (will behave like `FileAccess.F_OK`).
         */
        Constants.X_OK = 1;
    })(Constants = FileAccess.Constants || (FileAccess.Constants = {}));
})(FileAccess || (FileAccess = {}));
export var FileStat;
(function (FileStat) {
    function is(candidate) {
        return typeof candidate === 'object' && ('uri' in candidate) && ('lastModification' in candidate) && ('isDirectory' in candidate);
    }
    FileStat.is = is;
    function equals(one, other) {
        if (!one || !other || !is(one) || !is(other)) {
            return false;
        }
        return one.uri === other.uri
            && one.lastModification === other.lastModification
            && one.isDirectory === other.isDirectory;
    }
    FileStat.equals = equals;
})(FileStat || (FileStat = {}));
/**
 * @deprecated since 1.4.0 - in order to support VS Code FS API (https://github.com/eclipse-tart/tart/pull/7908), use `FileOperationError` instead
 */
export var FileSystemError;
(function (FileSystemError) {
    FileSystemError.FileNotFound = ApplicationError.declare(-33000, (uri, prefix) => ({
        message: `${prefix ? prefix + ' ' : ''}'${uri}' has not been found.`,
        data: { uri }
    }));
    FileSystemError.FileExists = ApplicationError.declare(-33001, (uri, prefix) => ({
        message: `${prefix ? prefix + ' ' : ''}'${uri}' already exists.`,
        data: { uri }
    }));
    FileSystemError.FileIsDirectory = ApplicationError.declare(-33002, (uri, prefix) => ({
        message: `${prefix ? prefix + ' ' : ''}'${uri}' is a directory.`,
        data: { uri }
    }));
    FileSystemError.FileNotDirectory = ApplicationError.declare(-33003, (uri, prefix) => ({
        message: `${prefix ? prefix + ' ' : ''}'${uri}' is not a directory.`,
        data: { uri }
    }));
    FileSystemError.FileIsOutOfSync = ApplicationError.declare(-33004, (file, stat) => ({
        message: `'${file.uri}' is out of sync.`,
        data: { file, stat }
    }));
})(FileSystemError || (FileSystemError = {}));

//# sourceMappingURL=../../lib/common/filesystem.js.map
