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
import { createPreferenceProxy, PreferenceContribution, PreferenceService } from '@tart/core/lib/browser/preferences';
import { SUPPORTED_ENCODINGS } from '@tart/core/lib/browser/supported-encodings';
import { nls } from '@tart/core/lib/common/nls';
// See https://github.com/Microsoft/vscode/issues/30180
export const WIN32_MAX_FILE_SIZE_MB = 300; // 300 MB
export const GENERAL_MAX_FILE_SIZE_MB = 16 * 1024; // 16 GB
// export const MAX_FILE_SIZE_MB = typeof process === 'object'
//     ? process.arch === 'ia32'
//         ? WIN32_MAX_FILE_SIZE_MB
//         : GENERAL_MAX_FILE_SIZE_MB
//     : 32;
export const MAX_FILE_SIZE_MB = WIN32_MAX_FILE_SIZE_MB;
export const filesystemPreferenceSchema = {
    type: 'object',
    properties: {
        'files.watcherExclude': {
            // eslint-disable-next-line max-len
            description: nls.localizeByDefault('Configure glob patterns of file paths to exclude from file watching. Patterns must match on absolute paths (i.e. prefix with ** or the full path to match properly). Changing this setting requires a restart. When you experience Code consuming lots of CPU time on startup, you can exclude large folders to reduce the initial load.'),
            additionalProperties: {
                type: 'boolean'
            },
            default: {
                '**/.git/objects/**': true,
                '**/.git/subtree-cache/**': true,
                '**/node_modules/**': true
            },
            scope: 'resource'
        },
        'files.exclude': {
            type: 'object',
            default: { '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true },
            // eslint-disable-next-line max-len
            description: nls.localize('tart/filesystem/filesExclude', 'Configure glob patterns for excluding files and folders. For example, the file Explorer decides which files and folders to show or hide based on this setting. Refer to the `#search.exclude#` setting to define search specific excludes.'),
            scope: 'resource'
        },
        'files.enableTrash': {
            type: 'boolean',
            default: true,
            description: nls.localizeByDefault('Moves files/folders to the OS trash (recycle bin on Windows) when deleting. Disabling this will delete files/folders permanently.')
        },
        'files.associations': {
            type: 'object',
            description: nls.localizeByDefault('Configure file associations to languages.json (e.g. `\"*.extension\": \"html\"`). These have precedence over the default associations of the languages.json installed.')
        },
        'files.autoGuessEncoding': {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('When enabled, the editor will attempt to guess the character set encoding when opening files. This setting can also be configured per language.'),
            scope: 'language-overridable',
            included: Object.keys(SUPPORTED_ENCODINGS).length > 1
        },
        'files.participants.timeout': {
            type: 'number',
            default: 5000,
            markdownDescription: nls.localizeByDefault('Timeout in milliseconds after which file participants for create, rename, and delete are cancelled. Use `0` to disable participants.')
        },
        'files.maxFileSizeMB': {
            type: 'number',
            default: MAX_FILE_SIZE_MB,
            markdownDescription: nls.localize('tart/filesystem/maxFileSizeMB', 'Controls the max file size in MB which is possible to open.')
        },
        'files.trimTrailingWhitespace': {
            type: 'boolean',
            default: false,
            description: nls.localizeByDefault('When enabled, will trim trailing whitespace when saving a file.'),
            scope: 'language-overridable'
        },
        'files.maxConcurrentUploads': {
            type: 'integer',
            default: 1,
            description: nls.localize('tart/filesystem/maxConcurrentUploads', 'Maximum number of concurrent files to upload when uploading multiple files. 0 means all files will be uploaded concurrently.'),
        }
    }
};
export const FileSystemPreferenceContribution = Symbol('FilesystemPreferenceContribution');
export const FileSystemPreferences = Symbol('FileSystemPreferences');
export function createFileSystemPreferences(preferences, schema = filesystemPreferenceSchema) {
    return createPreferenceProxy(preferences, schema);
}
export function bindFileSystemPreferences(bind) {
    bind(FileSystemPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get(PreferenceService);
        const contribution = ctx.container.get(FileSystemPreferenceContribution);
        return createFileSystemPreferences(preferences, contribution.schema);
    }).inSingletonScope();
    bind(FileSystemPreferenceContribution).toConstantValue({ schema: filesystemPreferenceSchema });
    bind(PreferenceContribution).toService(FileSystemPreferenceContribution);
}

//# sourceMappingURL=../../lib/browser/filesystem-preferences.js.map
