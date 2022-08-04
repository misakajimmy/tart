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
import { TextDocumentContentChangeEvent } from 'vscode-languageserver-protocol';
import URI from '../common/uri';
import { ContributionProvider } from './contribution-provider';
import { Event } from './event';
import { Emitter } from './emitter';
import { Disposable } from './disposable';
import { MaybePromise } from './types';
import { CancellationToken } from './cancellation';
import { ApplicationError } from './application-error';
import { Readable, ReadableStream } from './stream';
import { Reference, SyncReferenceCollection } from './reference';
export interface ResourceVersion {
}
export interface ResourceReadOptions {
    encoding?: string;
}
export interface ResourceSaveOptions {
    encoding?: string;
    overwriteEncoding?: boolean;
    version?: ResourceVersion;
}
export interface Resource extends Disposable {
    readonly uri: URI;
    /**
     * Latest read version of this resource.
     *
     * Optional if a resource does not support versioning, check with `in` operator`.
     * Undefined if a resource did not read content yet.
     */
    readonly version?: ResourceVersion | undefined;
    /**
     * Latest read encoding of this resource.
     *
     * Optional if a resource does not support encoding, check with `in` operator`.
     * Undefined if a resource did not read content yet.
     */
    readonly encoding?: string | undefined;
    readonly onDidChangeContents?: Event<void>;
    /**
     * Reads latest content of this resource.
     *
     * If a resource supports versioning it updates version to latest.
     * If a resource supports encoding it updates encoding to latest.
     *
     * @throws `ResourceError.NotFound` if a resource not found
     */
    readContents(options?: ResourceReadOptions): Promise<string>;
    /**
     * Stream latest content of this resource.
     *
     * If a resource supports versioning it updates version to latest.
     * If a resource supports encoding it updates encoding to latest.
     *
     * @throws `ResourceError.NotFound` if a resource not found
     */
    readStream?(options?: ResourceReadOptions): Promise<ReadableStream<string>>;
    /**
     * Rewrites the complete content for this resource.
     * If a resource does not exist it will be created.
     *
     * If a resource supports versioning clients can pass some version
     * to check against it, if it is not provided latest version is used.
     *
     * It updates version and encoding to latest.
     *
     * @throws `ResourceError.OutOfSync` if latest resource version is out of sync with the given
     */
    saveContents?(content: string, options?: ResourceSaveOptions): Promise<void>;
    /**
     * Rewrites the complete content for this resource.
     * If a resource does not exist it will be created.
     *
     * If a resource supports versioning clients can pass some version
     * to check against it, if it is not provided latest version is used.
     *
     * It updates version and encoding to latest.
     *
     * @throws `ResourceError.OutOfSync` if latest resource version is out of sync with the given
     */
    saveStream?(content: Readable<string>, options?: ResourceSaveOptions): Promise<void>;
    /**
     * Applies incremental content changes to this resource.
     *
     * If a resource supports versioning clients can pass some version
     * to check against it, if it is not provided latest version is used.
     * It updates version to latest.
     *
     * @throws `ResourceError.NotFound` if a resource not found or was not read yet
     * @throws `ResourceError.OutOfSync` if latest resource version is out of sync with the given
     */
    saveContentChanges?(changes: TextDocumentContentChangeEvent[], options?: ResourceSaveOptions): Promise<void>;
    guessEncoding?(): Promise<string | undefined>;
}
export declare namespace Resource {
    interface SaveContext {
        contentLength: number;
        content: string | Readable<string>;
        changes?: TextDocumentContentChangeEvent[];
        options?: ResourceSaveOptions;
    }
    function save(resource: Resource, context: SaveContext, token?: CancellationToken): Promise<void>;
    function trySaveContentChanges(resource: Resource, context: SaveContext): Promise<boolean>;
    function shouldSaveContent(resource: Resource, { contentLength, changes }: SaveContext): boolean;
}
export declare namespace ResourceError {
    const NotFound: ApplicationError.Constructor<-40000, {
        uri: URI;
    }>;
    const OutOfSync: ApplicationError.Constructor<-40001, {
        uri: URI;
    }>;
}
export declare const ResourceResolver: unique symbol;
export interface ResourceResolver {
    /**
     * Reject if a resource cannot be provided.
     */
    resolve(uri: URI): MaybePromise<Resource>;
}
export declare const ResourceProvider: unique symbol;
export declare type ResourceProvider = (uri: URI) => Promise<Resource>;
export declare class DefaultResourceProvider {
    protected readonly resolversProvider: ContributionProvider<ResourceResolver>;
    constructor(resolversProvider: ContributionProvider<ResourceResolver>);
    /**
     * Reject if a resource cannot be provided.
     */
    get(uri: URI): Promise<Resource>;
}
export declare class MutableResource implements Resource {
    readonly uri: URI;
    protected readonly onDidChangeContentsEmitter: Emitter<void>;
    readonly onDidChangeContents: Event<void>;
    private contents;
    constructor(uri: URI);
    dispose(): void;
    readContents(): Promise<string>;
    saveContents(contents: string): Promise<void>;
    protected fireDidChangeContents(): void;
}
export declare class ReferenceMutableResource implements Resource {
    protected reference: Reference<MutableResource>;
    constructor(reference: Reference<MutableResource>);
    get uri(): URI;
    get onDidChangeContents(): Event<void>;
    dispose(): void;
    readContents(): Promise<string>;
    saveContents(contents: string): Promise<void>;
}
export declare class InMemoryResources implements ResourceResolver {
    protected readonly resources: SyncReferenceCollection<string, MutableResource>;
    add(uri: URI, contents: string): Resource;
    update(uri: URI, contents: string): Resource;
    resolve(uri: URI): Resource;
    protected acquire(uri: string): ReferenceMutableResource;
}
export declare const MEMORY_TEXT = "mem-txt";
/**
 * Resource implementation for 'mem-txt' URI scheme where content is saved in URI query.
 */
export declare class InMemoryTextResource implements Resource {
    readonly uri: URI;
    constructor(uri: URI);
    readContents(options?: {
        encoding?: string | undefined;
    } | undefined): Promise<string>;
    dispose(): void;
}
/**
 * ResourceResolver implementation for 'mem-txt' URI scheme.
 */
export declare class InMemoryTextResourceResolver implements ResourceResolver {
    resolve(uri: URI): MaybePromise<Resource>;
}
