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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, named } from 'inversify';
import URI from '../common/uri';
import { ContributionProvider } from './contribution-provider';
import { Emitter } from './emitter';
import { ApplicationError } from './application-error';
import { Readable } from './stream';
import { SyncReferenceCollection } from './reference';
export var Resource;
(function (Resource) {
    async function save(resource, context, token) {
        if (!resource.saveContents) {
            return;
        }
        if (await trySaveContentChanges(resource, context)) {
            return;
        }
        if (token && token.isCancellationRequested) {
            return;
        }
        if (typeof context.content !== 'string' && resource.saveStream) {
            await resource.saveStream(context.content, context.options);
        }
        else {
            const content = typeof context.content === 'string' ? context.content : Readable.toString(context.content);
            await resource.saveContents(content, context.options);
        }
    }
    Resource.save = save;
    async function trySaveContentChanges(resource, context) {
        if (!context.changes || !resource.saveContentChanges || shouldSaveContent(resource, context)) {
            return false;
        }
        try {
            await resource.saveContentChanges(context.changes, context.options);
            return true;
        }
        catch (e) {
            if (!ResourceError.NotFound.is(e) && !ResourceError.OutOfSync.is(e)) {
                console.error(`Failed to apply incremental changes to '${resource.uri.toString()}':`, e);
            }
            return false;
        }
    }
    Resource.trySaveContentChanges = trySaveContentChanges;
    function shouldSaveContent(resource, { contentLength, changes }) {
        if (!changes || (resource.saveStream && contentLength > 32 * 1024 * 1024)) {
            return true;
        }
        let contentChangesLength = 0;
        for (const change of changes) {
            contentChangesLength += JSON.stringify(change).length;
            if (contentChangesLength > contentLength) {
                return true;
            }
        }
        return contentChangesLength > contentLength;
    }
    Resource.shouldSaveContent = shouldSaveContent;
})(Resource || (Resource = {}));
export var ResourceError;
(function (ResourceError) {
    ResourceError.NotFound = ApplicationError.declare(-40000, (raw) => raw);
    ResourceError.OutOfSync = ApplicationError.declare(-40001, (raw) => raw);
})(ResourceError || (ResourceError = {}));
export const ResourceResolver = Symbol('ResourceResolver');
export const ResourceProvider = Symbol('ResourceProvider');
let DefaultResourceProvider = class DefaultResourceProvider {
    resolversProvider;
    constructor(resolversProvider) {
        this.resolversProvider = resolversProvider;
    }
    /**
     * Reject if a resource cannot be provided.
     */
    async get(uri) {
        const resolvers = this.resolversProvider.getContributions();
        for (const resolver of resolvers) {
            try {
                return await resolver.resolve(uri);
            }
            catch (err) {
                // no-op
            }
        }
        return Promise.reject(new Error(`A resource provider for '${uri.toString()}' is not registered.`));
    }
};
DefaultResourceProvider = __decorate([
    injectable(),
    __param(0, inject(ContributionProvider)),
    __param(0, named(ResourceResolver))
], DefaultResourceProvider);
export { DefaultResourceProvider };
export class MutableResource {
    uri;
    onDidChangeContentsEmitter = new Emitter();
    onDidChangeContents = this.onDidChangeContentsEmitter.event;
    contents = '';
    constructor(uri) {
        this.uri = uri;
    }
    dispose() {
    }
    async readContents() {
        return this.contents;
    }
    async saveContents(contents) {
        this.contents = contents;
        this.fireDidChangeContents();
    }
    fireDidChangeContents() {
        this.onDidChangeContentsEmitter.fire(undefined);
    }
}
export class ReferenceMutableResource {
    reference;
    constructor(reference) {
        this.reference = reference;
    }
    get uri() {
        return this.reference.object.uri;
    }
    get onDidChangeContents() {
        return this.reference.object.onDidChangeContents;
    }
    dispose() {
        this.reference.dispose();
    }
    readContents() {
        return this.reference.object.readContents();
    }
    saveContents(contents) {
        return this.reference.object.saveContents(contents);
    }
}
let InMemoryResources = class InMemoryResources {
    resources = new SyncReferenceCollection(uri => new MutableResource(new URI(uri)));
    add(uri, contents) {
        const resourceUri = uri.toString();
        if (this.resources.has(resourceUri)) {
            throw new Error(`Cannot add already existing in-memory resource '${resourceUri}'`);
        }
        const resource = this.acquire(resourceUri);
        resource.saveContents(contents);
        return resource;
    }
    update(uri, contents) {
        const resourceUri = uri.toString();
        const resource = this.resources.get(resourceUri);
        if (!resource) {
            throw new Error(`Cannot update non-existed in-memory resource '${resourceUri}'`);
        }
        resource.saveContents(contents);
        return resource;
    }
    resolve(uri) {
        const uriString = uri.toString();
        if (!this.resources.has(uriString)) {
            throw new Error(`In memory '${uriString}' resource does not exist.`);
        }
        return this.acquire(uriString);
    }
    acquire(uri) {
        const reference = this.resources.acquire(uri);
        return new ReferenceMutableResource(reference);
    }
};
InMemoryResources = __decorate([
    injectable()
], InMemoryResources);
export { InMemoryResources };
export const MEMORY_TEXT = 'mem-txt';
/**
 * Resource implementation for 'mem-txt' URI scheme where content is saved in URI query.
 */
export class InMemoryTextResource {
    uri;
    constructor(uri) {
        this.uri = uri;
    }
    async readContents(options) {
        return this.uri.query;
    }
    dispose() {
    }
}
/**
 * ResourceResolver implementation for 'mem-txt' URI scheme.
 */
let InMemoryTextResourceResolver = class InMemoryTextResourceResolver {
    resolve(uri) {
        if (uri.scheme !== MEMORY_TEXT) {
            throw new Error(`Expected a URI with ${MEMORY_TEXT} scheme. Was: ${uri}.`);
        }
        return new InMemoryTextResource(uri);
    }
};
InMemoryTextResourceResolver = __decorate([
    injectable()
], InMemoryTextResourceResolver);
export { InMemoryTextResourceResolver };

//# sourceMappingURL=../../lib/common/resource.js.map
