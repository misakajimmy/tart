/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
/********************************************************************************
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and others.
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
import URI from './uri';
import { Event } from './event';
import { KeySequence } from '../browser/keys';
import { CancellationToken } from './cancellation';
export declare const quickPickServicePath = "/services/quickPick";
export declare const QuickPickService: unique symbol;
export interface QuickPickService {
    readonly onDidHide: Event<void>;
    readonly onDidAccept: Event<void>;
    readonly onDidChangeValue: Event<{
        quickPick: QuickPick<QuickPickItem>;
        filter: string;
    }>;
    readonly onDidChangeActive: Event<{
        quickPick: QuickPick<QuickPickItem>;
        activeItems: Array<QuickPickItem>;
    }>;
    readonly onDidChangeSelection: Event<{
        quickPick: QuickPick<QuickPickItem>;
        selectedItems: Array<QuickPickItem>;
    }>;
    readonly onDidTriggerButton: Event<QuickInputButtonHandle>;
    show<T extends QuickPickItem>(items: Array<T>, options?: QuickPickOptions<T>): Promise<T | undefined>;
    setItems<T extends QuickPickItem>(items: Array<T>): void;
    hide(): void;
}
export interface Match {
    start: number;
    end: number;
}
export interface QuickPickItemHighlights {
    label?: Match[];
    description?: Match[];
    detail?: Match[];
}
export interface QuickPickItem {
    type?: 'item' | 'separator';
    id?: string;
    label: string;
    meta?: string;
    ariaLabel?: string;
    description?: string;
    detail?: string;
    keySequence?: KeySequence;
    iconClasses?: string[];
    alwaysShow?: boolean;
    highlights?: QuickPickItemHighlights;
    buttons?: QuickInputButton[];
    execute?: () => void;
}
export declare namespace QuickPickItem {
    function is(item: QuickPickSeparator | QuickPickItem): item is QuickPickItem;
}
export interface QuickPickSeparator {
    type: 'separator';
    label?: string;
}
export declare namespace QuickPickSeparator {
    function is(item: QuickPickSeparator | QuickPickItem): item is QuickPickSeparator;
}
export declare type QuickPicks = (QuickPickSeparator | QuickPickItem)[];
export interface QuickPickValue<V> extends QuickPickItem {
    value: V;
}
export interface QuickInputButton {
    iconPath?: URI | {
        light: URI;
        dark: URI;
    } | {
        id: string;
    };
    iconClass?: string;
    tooltip?: string;
}
export interface QuickInputButtonHandle extends QuickInputButton {
    index: number;
}
export interface QuickInput {
    readonly onDidHide: Event<void>;
    readonly onDispose: Event<void>;
    title: string | undefined;
    description: string | undefined;
    step: number | undefined;
    totalSteps: number | undefined;
    enabled: boolean;
    contextKey: string | undefined;
    busy: boolean;
    ignoreFocusOut: boolean;
    show(): void;
    hide(): void;
    dispose(): void;
}
export interface InputBox extends QuickInput {
    value: string | undefined;
    valueSelection: Readonly<[number, number]> | undefined;
    placeholder: string | undefined;
    password: boolean;
    readonly onDidChangeValue: Event<string>;
    readonly onDidAccept: Event<void>;
    buttons: ReadonlyArray<QuickInputButton>;
    readonly onDidTriggerButton: Event<QuickInputButton>;
    prompt: string | undefined;
    validationMessage: string | undefined;
}
export interface QuickPick<T extends QuickPickItem> extends QuickInput {
    value: string;
    placeholder: string | undefined;
    items: ReadonlyArray<T | QuickPickSeparator>;
    activeItems: ReadonlyArray<T>;
    selectedItems: ReadonlyArray<T>;
    canSelectMany: boolean;
    matchOnDescription: boolean;
    matchOnDetail: boolean;
    readonly onDidAccept: Event<void>;
    readonly onDidChangeValue: Event<string>;
    readonly onDidTriggerButton: Event<QuickInputButton>;
    readonly onDidTriggerItemButton: Event<QuickPickItemButtonEvent<T>>;
    readonly onDidChangeActive: Event<T[]>;
    readonly onDidChangeSelection: Event<T[]>;
}
export interface PickOptions<T extends QuickPickItem> {
    placeHolder?: string;
    matchOnDescription?: boolean;
    matchOnDetail?: boolean;
    matchOnLabel?: boolean;
    autoFocusOnList?: boolean;
    ignoreFocusLost?: boolean;
    canPickMany?: boolean;
    contextKey?: string;
    activeItem?: Promise<T> | T;
    onDidFocus?: (entry: T) => void;
}
export interface InputOptions {
    value?: string;
    valueSelection?: [number, number];
    prompt?: string;
    placeHolder?: string;
    password?: boolean;
    ignoreFocusLost?: boolean;
    validateInput?(input: string): Promise<string | null | undefined> | undefined;
}
export interface QuickPickItemButtonEvent<T extends QuickPickItem> {
    button: QuickInputButton;
    item: T;
}
export interface QuickPickItemButtonContext<T extends QuickPickItem> extends QuickPickItemButtonEvent<T> {
    removeItem(): void;
}
export interface QuickPickOptions<T extends QuickPickItem> {
    busy?: boolean;
    enabled?: boolean;
    title?: string;
    description?: string;
    value?: string;
    filterValue?: (value: string) => string;
    ariaLabel?: string;
    buttons?: Array<QuickInputButton>;
    placeholder?: string;
    canAcceptInBackground?: boolean;
    customButton?: boolean;
    customLabel?: string;
    customHover?: string;
    canSelectMany?: boolean;
    matchOnDescription?: boolean;
    matchOnDetail?: boolean;
    matchOnLabel?: boolean;
    sortByLabel?: boolean;
    autoFocusOnList?: boolean;
    ignoreFocusOut?: boolean;
    valueSelection?: Readonly<[number, number]>;
    validationMessage?: string;
    hideInput?: boolean;
    hideCheckAll?: boolean;
    runIfSingle?: boolean;
    contextKey?: string;
    activeItem?: T;
    step?: number;
    totalSteps?: number;
    onDidAccept?: () => void;
    onDidChangeActive?: (quickPick: QuickPick<T>, activeItems: Array<T>) => void;
    onDidChangeSelection?: (quickPick: QuickPick<T>, selectedItems: Array<T>) => void;
    onDidChangeValue?: (quickPick: QuickPick<T>, filter: string) => void;
    onDidCustom?: () => void;
    onDidHide?: () => void;
    onDidTriggerButton?: (button: QuickInputButton) => void;
    onDidTriggerItemButton?: (ItemButtonEvent: QuickPickItemButtonContext<T>) => void;
}
export declare const QuickInputService: unique symbol;
export interface QuickInputService {
    readonly backButton: QuickInputButton;
    readonly onShow: Event<void>;
    readonly onHide: Event<void>;
    open(filter: string): void;
    createInputBox(): InputBox;
    input(options?: InputOptions, token?: CancellationToken): Promise<string | undefined>;
    pick<T extends QuickPickItem, O extends PickOptions<T>>(picks: Promise<T[]> | T[], options?: O, token?: CancellationToken): Promise<(O extends {
        canPickMany: true;
    } ? T[] : T) | undefined>;
    showQuickPick<T extends QuickPickItem>(items: Array<T>, options?: QuickPickOptions<T>): Promise<T>;
    hide(): void;
    /**
     * Provides raw access to the quick pick controller.
     */
    createQuickPick<T extends QuickPickItem>(): QuickPick<T>;
}
/**
 * Filter the list of quick pick items based on the provided filter.
 * Items are filtered based on if:
 * - their `label` satisfies the filter using `fuzzy`.
 * - their `description` satisfies the filter using `fuzzy`.
 * - their `detail` satisfies the filter using `fuzzy`.
 * Filtered items are also updated to display proper highlights based on how they were filtered.
 * @param items the list of quick pick items.
 * @param filter the filter to search for.
 * @returns the list of quick pick items that satisfy the filter.
 */
export declare function filterItems(items: QuickPickItem[], filter: string): QuickPickItem[];
/**
 * Find match highlights when testing a word against a pattern.
 * @param word the word to test.
 * @param pattern the word to match against.
 * @returns the list of highlights if present.
 */
export declare function findMatches(word: string, pattern: string): Array<{
    start: number;
    end: number;
}> | undefined;
