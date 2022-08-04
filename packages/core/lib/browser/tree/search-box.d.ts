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
import { SearchBoxDebounce, SearchBoxDebounceOptions } from './search-box-debounce';
import { BaseWidget, Message } from '../widgets/widget';
import { Emitter, Event } from '../../common';
import { Key, KeyCode } from '../keyboard/keys';
/**
 * Initializer properties for the search box widget.
 */
export interface SearchBoxProps extends SearchBoxDebounceOptions {
    /**
     * If `true`, the `Previous`, `Next`, and `Close` buttons will be visible. Otherwise, `false`. Defaults to `false`.
     */
    readonly showButtons?: boolean;
    /**
     * If `true`, `Filter` and `Close` buttons will be visible, and clicking the `Filter` button will triggers filter on the search term. Defaults to `false`.
     */
    readonly showFilter?: boolean;
}
export declare namespace SearchBoxProps {
    /**
     * The default search box widget option.
     */
    const DEFAULT: SearchBoxProps;
}
/**
 * The search box widget.
 */
export declare class SearchBox extends BaseWidget {
    protected readonly props: SearchBoxProps;
    protected readonly debounce: SearchBoxDebounce;
    protected static SPECIAL_KEYS: Key[];
    protected static MAX_CONTENT_LENGTH: number;
    protected readonly nextEmitter: Emitter<void>;
    protected readonly previousEmitter: Emitter<void>;
    protected readonly closeEmitter: Emitter<void>;
    protected readonly textChangeEmitter: Emitter<string>;
    protected readonly filterToggleEmitter: Emitter<boolean>;
    protected readonly input: HTMLSpanElement;
    protected readonly filter: HTMLElement | undefined;
    constructor(props: SearchBoxProps, debounce: SearchBoxDebounce);
    protected _isFiltering: boolean;
    get isFiltering(): boolean;
    get onPrevious(): Event<void>;
    get onNext(): Event<void>;
    get onClose(): Event<void>;
    get onTextChange(): Event<string | undefined>;
    get onFilterToggled(): Event<boolean>;
    get keyCodePredicate(): KeyCode.Predicate;
    handle(event: KeyboardEvent): void;
    onBeforeHide(): void;
    updateHighlightInfo(info: SearchBox.HighlightInfo): void;
    protected firePrevious(): void;
    protected fireNext(): void;
    protected fireClose(): void;
    protected fireTextChange(input: string | undefined): void;
    protected fireFilterToggle(): void;
    protected doFireFilterToggle(toggleTo?: boolean): void;
    protected handleArrowUp(): void;
    protected handleArrowDown(): void;
    protected handleKey(keyCode: KeyCode): void;
    protected getTrimmedContent(data: string): string;
    protected canHandle(keyCode: KeyCode | undefined): boolean;
    protected isCtrlBackspace(keyCode: KeyCode): boolean;
    protected createContent(): {
        container: HTMLElement;
        input: HTMLSpanElement;
        filter: HTMLElement | undefined;
        previous: HTMLElement | undefined;
        next: HTMLElement | undefined;
        close: HTMLElement | undefined;
    };
    protected onAfterAttach(msg: Message): void;
}
export declare namespace SearchBox {
    /**
     * CSS classes for the search box widget.
     */
    namespace Styles {
        const SEARCH_BOX = "tart-search-box";
        const SEARCH_INPUT = "tart-search-input";
        const SEARCH_BUTTONS_WRAPPER = "tart-search-buttons-wrapper";
        const BUTTON = "tart-search-button";
        const FILTER: string[];
        const FILTER_ON = "filter-active";
        const BUTTON_PREVIOUS = "tart-search-button-previous";
        const BUTTON_NEXT = "tart-search-button-next";
        const BUTTON_CLOSE = "tart-search-button-close";
        const NON_SELECTABLE = "tart-non-selectable";
        const NO_MATCH = "no-match";
    }
    interface HighlightInfo {
        filterText: string | undefined;
        matched: number;
        total: number;
    }
}
/**
 * Search box factory.
 */
export declare const SearchBoxFactory: unique symbol;
export interface SearchBoxFactory {
    /**
     * Creates a new search box with the given initializer properties.
     */
    (props: SearchBoxProps): SearchBox;
}
