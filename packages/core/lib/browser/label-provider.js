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
import { inject, injectable, named, postConstruct } from 'inversify';
import URI from '../common/uri';
import { ContributionProvider, Disposable, Emitter, Path, Prioritizeable } from '../common';
import { codicon } from './widgets';
import * as fileIcons from 'file-icons-js';
/**
 * @internal don't export it, use `LabelProvider.folderIcon` instead.
 */
const DEFAULT_FOLDER_ICON = `${codicon('folder')} default-folder-icon`;
/**
 * @internal don't export it, use `LabelProvider.fileIcon` instead.
 */
const DEFAULT_FILE_ICON = `${codicon('file')} default-file-icon`;
/**
 * Internal folder icon class for the default (File Icons) theme.
 *
 * @deprecated Use `LabelProvider.folderIcon` to get a folder icon class for the current icon theme.
 */
export const FOLDER_ICON = DEFAULT_FOLDER_ICON;
/**
 * Internal file icon class for the default (File Icons) theme.
 *
 * @deprecated Use `LabelProvider.fileIcon` to get a file icon class for the current icon theme.
 */
export const FILE_ICON = DEFAULT_FILE_ICON;
export const LabelProviderContribution = Symbol('LabelProviderContribution');
export var URIIconReference;
(function (URIIconReference) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(element) {
        return !!element && typeof element === 'object' && 'kind' in element && element['kind'] === 'uriIconReference';
    }
    URIIconReference.is = is;
    function create(id, uri) {
        return { kind: 'uriIconReference', id, uri };
    }
    URIIconReference.create = create;
})(URIIconReference || (URIIconReference = {}));
let DefaultUriLabelProviderContribution = class DefaultUriLabelProviderContribution {
    formatters = [];
    onDidChangeEmitter = new Emitter();
    homePath;
    /*---------------------------------------------------------------------------------------------
    *  Copyright (c) Microsoft Corporation. All rights reserved.
    *  Licensed under the MIT License. See License.txt in the project root for license information.
    *--------------------------------------------------------------------------------------------*/
    labelMatchingRegexp = /\${(scheme|authority|path|query)}/g;
    get defaultFolderIcon() {
        return DEFAULT_FOLDER_ICON;
    }
    get defaultFileIcon() {
        return DEFAULT_FILE_ICON;
    }
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }
    init() {
        // this.envVariablesServer.getHomeDirUri().then(result => {
        //     this.homePath = result;
        //     this.fireOnDidChange();
        // });
    }
    canHandle(element) {
        if (element instanceof URI || URIIconReference.is(element)) {
            return 1;
        }
        return 0;
    }
    getIcon(element) {
        if (URIIconReference.is(element) && element.id === 'folder') {
            return this.defaultFolderIcon;
        }
        const uri = URIIconReference.is(element) ? element.uri : element;
        if (uri) {
            const iconClass = uri && this.getFileIcon(uri);
            return iconClass || this.defaultFileIcon;
        }
        return '';
    }
    getName(element) {
        const uri = this.getUri(element);
        return uri && uri.displayName;
    }
    getLongName(element) {
        const uri = this.getUri(element);
        if (uri) {
            const formatting = this.findFormatting(uri);
            if (formatting) {
                return this.formatUri(uri, formatting);
            }
        }
        return uri && uri.path.toString();
    }
    registerFormatter(formatter) {
        this.formatters.push(formatter);
        this.fireOnDidChange();
        return Disposable.create(() => {
            this.formatters = this.formatters.filter(f => f !== formatter);
            this.fireOnDidChange();
        });
    }
    getFileIcon(uri) {
        const fileIcon = fileIcons.getClassWithColor(uri.displayName);
        if (!fileIcon) {
            return undefined;
        }
        return fileIcon + ' tart-file-icons-js';
    }
    getUri(element) {
        return URIIconReference.is(element) ? element.uri : element;
    }
    // copied and modified from https://github.com/microsoft/vscode/blob/1.44.2/src/vs/workbench/services/label/common/labelService.ts
    formatUri(resource, formatting) {
        let label = formatting.label.replace(this.labelMatchingRegexp, (match, token) => {
            switch (token) {
                case 'scheme':
                    return resource.scheme;
                case 'authority':
                    return resource.authority;
                case 'path':
                    return resource.path.toString();
                case 'query':
                    return resource.query;
                default:
                    return '';
            }
        });
        // convert \c:\something => C:\something
        if (formatting.normalizeDriveLetter && this.hasDriveLetter(label)) {
            label = label.charAt(1).toUpperCase() + label.substr(2);
        }
        if (formatting.tildify) {
            label = Path.tildify(label, this.homePath ? this.homePath : '');
        }
        if (formatting.authorityPrefix && resource.authority) {
            label = formatting.authorityPrefix + label;
        }
        return label.replace(/\//g, formatting.separator);
    }
    findFormatting(resource) {
        let bestResult;
        this.formatters.forEach(formatter => {
            if (formatter.scheme === resource.scheme) {
                if (!bestResult && !formatter.authority) {
                    bestResult = formatter;
                    return;
                }
                if (!formatter.authority) {
                    return;
                }
                if ((formatter.authority.toLowerCase() === resource.authority.toLowerCase()) &&
                    (!bestResult || !bestResult.authority || formatter.authority.length > bestResult.authority.length ||
                        ((formatter.authority.length === bestResult.authority.length) && formatter.priority))) {
                    bestResult = formatter;
                }
            }
        });
        return bestResult ? bestResult.formatting : undefined;
    }
    fireOnDidChange() {
        this.onDidChangeEmitter.fire({
            affects: (element) => this.canHandle(element) > 0
        });
    }
    hasDriveLetter(path) {
        return !!(path && path[2] === ':');
    }
};
__decorate([
    postConstruct()
], DefaultUriLabelProviderContribution.prototype, "init", null);
DefaultUriLabelProviderContribution = __decorate([
    injectable()
], DefaultUriLabelProviderContribution);
export { DefaultUriLabelProviderContribution };
/**
 * The {@link LabelProvider} determines how elements/nodes are displayed in the workbench. For any element, it can determine a short label, a long label
 * and an icon. The {@link LabelProvider} is to be used in lists, trees and tables, but also view specific locations like headers.
 * The common {@link LabelProvider} can be extended/adapted via {@link LabelProviderContribution}s. For every element, the {@links LabelProvider} will determine the
 * {@link LabelProviderContribution} with the hightest priority and delegate to it. Tart registers default {@link LabelProviderContribution} for common types, e.g.
 * the {@link DefaultUriLabelProviderContribution} for elements that have a URI.
 * Using the {@link LabelProvider} across the workbench ensures a common look and feel for elements across multiple views. To adapt the way how specific
 * elements/nodes are rendered, use a {@link LabelProviderContribution} rather than adapting or sub classing the {@link LabelProvider}. This way, your adaptation
 * is applied to all views in Tart that use the {@link LabelProvider}
 */
let LabelProvider = class LabelProvider {
    onDidChangeEmitter = new Emitter();
    contributionProvider;
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }
    /**
     * Return a default file icon for the current icon theme.
     */
    get fileIcon() {
        return this.getIcon(URIIconReference.create('file'));
    }
    /**
     * Return a default folder icon for the current icon theme.
     */
    get folderIcon() {
        return this.getIcon(URIIconReference.create('folder'));
    }
    /**
     * Start listening to contributions.
     *
     * Don't call this method directly!
     * It's called by the frontend application during initialization.
     */
    initialize() {
        const contributions = this.contributionProvider.getContributions();
        for (const eventContribution of contributions) {
            if (eventContribution.onDidChange) {
                eventContribution.onDidChange(event => {
                    this.onDidChangeEmitter.fire({
                        // TODO check eventContribution.canHandle as well
                        affects: element => this.affects(element, event)
                    });
                });
            }
        }
    }
    /**
     * Get the icon class from the list of available {@link LabelProviderContribution} for the given element.
     * @return the icon class
     */
    getIcon(element) {
        const contributions = this.findContribution(element);
        for (const contribution of contributions) {
            const value = contribution.getIcon && contribution.getIcon(element);
            if (value === undefined) {
                continue;
            }
            return value;
        }
        return '';
    }
    /**
     * Get a short name from the list of available {@link LabelProviderContribution} for the given element.
     * @return the short name
     */
    getName(element) {
        const contributions = this.findContribution(element);
        for (const contribution of contributions) {
            const value = contribution.getName && contribution.getName(element);
            if (value === undefined) {
                continue;
            }
            return value;
        }
        return '<unknown>';
    }
    /**
     * Get a long name from the list of available {@link LabelProviderContribution} for the given element.
     * @return the long name
     */
    getLongName(element) {
        const contributions = this.findContribution(element);
        for (const contribution of contributions) {
            const value = contribution.getLongName && contribution.getLongName(element);
            if (value === undefined) {
                continue;
            }
            return value;
        }
        return '';
    }
    affects(element, event) {
        if (event.affects(element)) {
            return true;
        }
        for (const contribution of this.findContribution(element)) {
            if (contribution.affects && contribution.affects(element, event)) {
                return true;
            }
        }
        return false;
    }
    findContribution(element) {
        const prioritized = Prioritizeable.prioritizeAllSync(this.contributionProvider.getContributions(), contrib => contrib.canHandle(element));
        return prioritized.map(c => c.value);
    }
};
__decorate([
    inject(ContributionProvider),
    named(LabelProviderContribution)
], LabelProvider.prototype, "contributionProvider", void 0);
LabelProvider = __decorate([
    injectable()
], LabelProvider);
export { LabelProvider };

//# sourceMappingURL=../../lib/browser/label-provider.js.map
