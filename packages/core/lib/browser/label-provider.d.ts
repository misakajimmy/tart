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
import URI from '../common/uri';
import { ContributionProvider, Disposable, Emitter, Event } from '../common';
import { FrontendApplicationContribution } from './frontend-application';
import { ResourceLabelFormatter, ResourceLabelFormatting } from '../common/label-protocol';
/**
 * Internal folder icon class for the default (File Icons) theme.
 *
 * @deprecated Use `LabelProvider.folderIcon` to get a folder icon class for the current icon theme.
 */
export declare const FOLDER_ICON: string;
/**
 * Internal file icon class for the default (File Icons) theme.
 *
 * @deprecated Use `LabelProvider.fileIcon` to get a file icon class for the current icon theme.
 */
export declare const FILE_ICON: string;
export declare const LabelProviderContribution: unique symbol;
/**
 * A {@link LabelProviderContribution} determines how specific elements/nodes are displayed in the workbench.
 * Tart views use a common {@link LabelProvider} to determine the label and/or an icon for elements shown in the UI. This includes elements in lists
 * and trees, but also view specific locations like headers. The common {@link LabelProvider} collects all {@links LabelProviderContribution} and delegates
 * to the contribution with the highest priority. This is determined via calling the {@link LabelProviderContribution.canHandle} function, so contributions
 * define which elements they are responsible for.
 * As arbitrary views can consume LabelProviderContributions, they must be generic for the covered element type, not view specific. Label providers and
 * contributions can be used for arbitrary element and node types, e.g. for markers or domain-specific elements.
 */
export interface LabelProviderContribution {
    /**
     * Emit when something has changed that may result in this label provider returning a different
     * value for one or more properties (name, icon etc).
     */
    readonly onDidChange?: Event<DidChangeLabelEvent>;
    /**
     * Determines whether this contribution can handle the given element and with what priority.
     * All contributions are ordered by the returned number if greater than zero. The highest number wins.
     * If two or more contributions return the same positive number one of those will be used. It is undefined which one.
     */
    canHandle(element: object): number;
    /**
     * returns an icon class for the given element.
     */
    getIcon?(element: object): string | undefined;
    /**
     * returns a short name for the given element.
     */
    getName?(element: object): string | undefined;
    /**
     * returns a long name for the given element.
     */
    getLongName?(element: object): string | undefined;
    /**
     * Checks whether the given element is affected by the given change event.
     * Contributions delegating to the label provider can use this hook
     * to perform a recursive check.
     */
    affects?(element: object, event: DidChangeLabelEvent): boolean;
}
export interface DidChangeLabelEvent {
    affects(element: object): boolean;
}
export interface URIIconReference {
    kind: 'uriIconReference';
    id: 'file' | 'folder';
    uri?: URI;
}
export declare namespace URIIconReference {
    function is(element: any | undefined): element is URIIconReference;
    function create(id: URIIconReference['id'], uri?: URI): URIIconReference;
}
export declare class DefaultUriLabelProviderContribution implements LabelProviderContribution {
    protected formatters: ResourceLabelFormatter[];
    protected readonly onDidChangeEmitter: Emitter<DidChangeLabelEvent>;
    protected homePath: string | undefined;
    private readonly labelMatchingRegexp;
    get defaultFolderIcon(): string;
    get defaultFileIcon(): string;
    get onDidChange(): Event<DidChangeLabelEvent>;
    init(): void;
    canHandle(element: object): number;
    getIcon(element: URI | URIIconReference): string;
    getName(element: URI | URIIconReference): string | undefined;
    getLongName(element: URI | URIIconReference): string | undefined;
    registerFormatter(formatter: ResourceLabelFormatter): Disposable;
    protected getFileIcon(uri: URI): string | undefined;
    protected getUri(element: URI | URIIconReference): URI | undefined;
    protected formatUri(resource: URI, formatting: ResourceLabelFormatting): string;
    protected findFormatting(resource: URI): ResourceLabelFormatting | undefined;
    private fireOnDidChange;
    private hasDriveLetter;
}
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
export declare class LabelProvider implements FrontendApplicationContribution {
    protected readonly onDidChangeEmitter: Emitter<DidChangeLabelEvent>;
    protected readonly contributionProvider: ContributionProvider<LabelProviderContribution>;
    get onDidChange(): Event<DidChangeLabelEvent>;
    /**
     * Return a default file icon for the current icon theme.
     */
    get fileIcon(): string;
    /**
     * Return a default folder icon for the current icon theme.
     */
    get folderIcon(): string;
    /**
     * Start listening to contributions.
     *
     * Don't call this method directly!
     * It's called by the frontend application during initialization.
     */
    initialize(): void;
    /**
     * Get the icon class from the list of available {@link LabelProviderContribution} for the given element.
     * @return the icon class
     */
    getIcon(element: object): string;
    /**
     * Get a short name from the list of available {@link LabelProviderContribution} for the given element.
     * @return the short name
     */
    getName(element: object): string;
    /**
     * Get a long name from the list of available {@link LabelProviderContribution} for the given element.
     * @return the long name
     */
    getLongName(element: object): string;
    protected affects(element: object, event: DidChangeLabelEvent): boolean;
    protected findContribution(element: object): LabelProviderContribution[];
}
