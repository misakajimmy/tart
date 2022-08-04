/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
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
import { Disposable, DisposableCollection, Emitter } from '../common';
import { DidChangeLabelEvent, LabelProviderContribution } from './label-provider';
export interface IconThemeDefinition {
    readonly id: string;
    readonly label: string;
    readonly description?: string;
    readonly hasFileIcons?: boolean;
    readonly hasFolderIcons?: boolean;
    readonly hidesExplorerArrows?: boolean;
}
export interface IconTheme extends IconThemeDefinition {
    activate(): Disposable;
}
export declare class NoneIconTheme implements IconTheme, LabelProviderContribution {
    readonly id = "none";
    readonly label = "None";
    readonly description = "Disable file icons";
    readonly hasFileIcons = true;
    readonly hasFolderIcons = true;
    protected readonly onDidChangeEmitter: Emitter<DidChangeLabelEvent>;
    readonly onDidChange: import("../common").Event<DidChangeLabelEvent>;
    protected readonly toDeactivate: DisposableCollection;
    activate(): Disposable;
    canHandle(): number;
    getIcon(): string;
    protected fireDidChange(): void;
}
export declare class IconThemeService {
    protected readonly onDidChangeEmitter: Emitter<void>;
    readonly onDidChange: import("../common").Event<void>;
    protected readonly _iconThemes: Map<string, IconTheme>;
    protected readonly noneIconTheme: NoneIconTheme;
    protected readonly onDidChangeCurrentEmitter: Emitter<string>;
    readonly onDidChangeCurrent: import("../common").Event<string>;
    protected readonly toDeactivate: DisposableCollection;
    get ids(): IterableIterator<string>;
    get definitions(): IterableIterator<IconThemeDefinition>;
    get current(): string;
    set current(id: string);
    get default(): IconTheme;
    getDefinition(id: string): IconThemeDefinition | undefined;
    register(iconTheme: IconTheme): Disposable;
    unregister(id: string): IconTheme | undefined;
    protected init(): void;
    protected getCurrent(): IconTheme;
    protected setCurrent(current: IconTheme): void;
    protected load(): string | undefined;
}
