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
import { debounce } from 'lodash';
import { Emitter } from '../../common';
import { DisposableCollection } from '../../common/disposable';
export var SearchBoxDebounceOptions;
(function (SearchBoxDebounceOptions) {
    /**
     * The default debounce option.
     */
    SearchBoxDebounceOptions.DEFAULT = {
        delay: 200
    };
})(SearchBoxDebounceOptions || (SearchBoxDebounceOptions = {}));
/**
 * It notifies the clients, once if the underlying search term has changed after a given amount of delay.
 */
export class SearchBoxDebounce {
    options;
    disposables = new DisposableCollection();
    emitter = new Emitter();
    handler;
    state;
    constructor(options) {
        this.options = options;
        this.disposables.push(this.emitter);
        this.handler = debounce(() => this.fireChanged(this.state), this.options.delay).bind(this);
    }
    get onChanged() {
        return this.emitter.event;
    }
    append(input) {
        if (input === undefined) {
            this.reset();
            return undefined;
        }
        if (this.state === undefined) {
            this.state = input;
        }
        else {
            if (input === '\b') {
                this.state = this.state.length === 1 ? '' : this.state.substr(0, this.state.length - 1);
            }
            else {
                this.state += input;
            }
        }
        this.handler();
        return this.state;
    }
    dispose() {
        this.disposables.dispose();
    }
    fireChanged(value) {
        this.emitter.fire(value);
    }
    reset() {
        this.state = undefined;
        this.fireChanged(undefined);
    }
}

//# sourceMappingURL=../../../lib/browser/tree/search-box-debounce.js.map
