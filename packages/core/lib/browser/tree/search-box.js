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
import { SearchBoxDebounceOptions } from './search-box-debounce';
import { BaseWidget } from '../widgets/widget';
import { Emitter } from '../../common';
import { Key, KeyCode } from '../keyboard/keys';
export var SearchBoxProps;
(function (SearchBoxProps) {
    /**
     * The default search box widget option.
     */
    SearchBoxProps.DEFAULT = SearchBoxDebounceOptions.DEFAULT;
})(SearchBoxProps || (SearchBoxProps = {}));
/**
 * The search box widget.
 */
export class SearchBox extends BaseWidget {
    props;
    debounce;
    static SPECIAL_KEYS = [
        Key.ESCAPE,
        Key.BACKSPACE
    ];
    static MAX_CONTENT_LENGTH = 15;
    nextEmitter = new Emitter();
    previousEmitter = new Emitter();
    closeEmitter = new Emitter();
    textChangeEmitter = new Emitter();
    filterToggleEmitter = new Emitter();
    input;
    filter;
    constructor(props, debounce) {
        super();
        this.props = props;
        this.debounce = debounce;
        this.toDispose.pushAll([
            this.nextEmitter,
            this.previousEmitter,
            this.closeEmitter,
            this.textChangeEmitter,
            this.filterToggleEmitter,
            this.debounce,
            this.debounce.onChanged(data => this.fireTextChange(data))
        ]);
        this.hide();
        this.update();
        const { input, filter } = this.createContent();
        this.input = input;
        this.filter = filter;
    }
    _isFiltering = false;
    get isFiltering() {
        return this._isFiltering;
    }
    get onPrevious() {
        return this.previousEmitter.event;
    }
    get onNext() {
        return this.nextEmitter.event;
    }
    get onClose() {
        return this.closeEmitter.event;
    }
    get onTextChange() {
        return this.textChangeEmitter.event;
    }
    get onFilterToggled() {
        return this.filterToggleEmitter.event;
    }
    get keyCodePredicate() {
        return this.canHandle.bind(this);
    }
    handle(event) {
        event.preventDefault();
        const keyCode = KeyCode.createKeyCode(event);
        if (this.canHandle(keyCode)) {
            if (Key.equals(Key.ESCAPE, keyCode) || this.isCtrlBackspace(keyCode)) {
                this.hide();
            }
            else {
                this.show();
                this.handleKey(keyCode);
            }
        }
    }
    onBeforeHide() {
        this.removeClass(SearchBox.Styles.NO_MATCH);
        this.doFireFilterToggle(false);
        this.debounce.append(undefined);
        this.fireClose();
    }
    updateHighlightInfo(info) {
        if (info.filterText && info.filterText.length > 0) {
            if (info.matched === 0) {
                this.addClass(SearchBox.Styles.NO_MATCH);
            }
            else {
                this.removeClass(SearchBox.Styles.NO_MATCH);
            }
        }
    }
    firePrevious() {
        this.previousEmitter.fire(undefined);
    }
    fireNext() {
        this.nextEmitter.fire(undefined);
    }
    fireClose() {
        this.closeEmitter.fire(undefined);
    }
    fireTextChange(input) {
        this.textChangeEmitter.fire(input);
    }
    fireFilterToggle() {
        this.doFireFilterToggle();
    }
    doFireFilterToggle(toggleTo = !this._isFiltering) {
        if (this.filter) {
            if (toggleTo) {
                this.filter.classList.add(SearchBox.Styles.FILTER_ON);
            }
            else {
                this.filter.classList.remove(SearchBox.Styles.FILTER_ON);
            }
            this._isFiltering = toggleTo;
            this.filterToggleEmitter.fire(toggleTo);
            this.update();
        }
    }
    handleArrowUp() {
        this.firePrevious();
    }
    handleArrowDown() {
        this.fireNext();
    }
    handleKey(keyCode) {
        const character = Key.equals(Key.BACKSPACE, keyCode) ? '\b' : keyCode.character;
        const data = this.debounce.append(character);
        if (data) {
            this.input.textContent = this.getTrimmedContent(data);
            this.update();
        }
        else {
            this.hide();
        }
    }
    getTrimmedContent(data) {
        if (data.length > SearchBox.MAX_CONTENT_LENGTH) {
            return '...' + data.substring(data.length - SearchBox.MAX_CONTENT_LENGTH);
        }
        return data;
    }
    canHandle(keyCode) {
        if (keyCode === undefined) {
            return false;
        }
        const { ctrl, alt, meta } = keyCode;
        if (this.isCtrlBackspace(keyCode)) {
            return true;
        }
        if (ctrl || alt || meta || keyCode.key === Key.SPACE) {
            return false;
        }
        if (keyCode.character || (this.isVisible && SearchBox.SPECIAL_KEYS.some(key => Key.equals(key, keyCode)))) {
            return true;
        }
        return false;
    }
    isCtrlBackspace(keyCode) {
        if (keyCode.ctrl && Key.equals(Key.BACKSPACE, keyCode)) {
            return true;
        }
        return false;
    }
    createContent() {
        this.node.setAttribute('tabIndex', '0');
        this.addClass(SearchBox.Styles.SEARCH_BOX);
        const input = document.createElement('span');
        input.classList.add(SearchBox.Styles.SEARCH_INPUT);
        this.node.appendChild(input);
        const buttons = document.createElement('div');
        buttons.classList.add(SearchBox.Styles.SEARCH_BUTTONS_WRAPPER);
        this.node.appendChild(buttons);
        let filter;
        if (this.props.showFilter) {
            filter = document.createElement('div');
            filter.classList.add(SearchBox.Styles.BUTTON, ...SearchBox.Styles.FILTER);
            filter.title = 'Enable Filter on Type';
            buttons.appendChild(filter);
            filter.onclick = this.fireFilterToggle.bind(this);
        }
        let previous;
        let next;
        let close;
        if (!!this.props.showButtons) {
            previous = document.createElement('div');
            previous.classList.add(SearchBox.Styles.BUTTON, SearchBox.Styles.BUTTON_PREVIOUS);
            previous.title = 'Previous (Up)';
            buttons.appendChild(previous);
            previous.onclick = () => this.firePrevious.bind(this)();
            next = document.createElement('div');
            next.classList.add(SearchBox.Styles.BUTTON, SearchBox.Styles.BUTTON_NEXT);
            next.title = 'Next (Down)';
            buttons.appendChild(next);
            next.onclick = () => this.fireNext.bind(this)();
        }
        if (this.props.showButtons || this.props.showFilter) {
            close = document.createElement('div');
            close.classList.add(SearchBox.Styles.BUTTON, SearchBox.Styles.BUTTON_CLOSE);
            close.title = 'Close (Escape)';
            buttons.appendChild(close);
            close.onclick = () => this.hide.bind(this)();
        }
        return {
            container: this.node,
            input,
            filter,
            previous,
            next,
            close
        };
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.addEventListener(this.input, 'selectstart', () => false);
    }
}
(function (SearchBox) {
    /**
     * CSS classes for the search box widget.
     */
    let Styles;
    (function (Styles) {
        Styles.SEARCH_BOX = 'tart-search-box';
        Styles.SEARCH_INPUT = 'tart-search-input';
        Styles.SEARCH_BUTTONS_WRAPPER = 'tart-search-buttons-wrapper';
        Styles.BUTTON = 'tart-search-button';
        Styles.FILTER = ['codicon', 'codicon-filter'];
        Styles.FILTER_ON = 'filter-active';
        Styles.BUTTON_PREVIOUS = 'tart-search-button-previous';
        Styles.BUTTON_NEXT = 'tart-search-button-next';
        Styles.BUTTON_CLOSE = 'tart-search-button-close';
        Styles.NON_SELECTABLE = 'tart-non-selectable';
        Styles.NO_MATCH = 'no-match';
    })(Styles = SearchBox.Styles || (SearchBox.Styles = {}));
})(SearchBox || (SearchBox = {}));
/**
 * Search box factory.
 */
export const SearchBoxFactory = Symbol('SearchBoxFactory');

//# sourceMappingURL=../../../lib/browser/tree/search-box.js.map
