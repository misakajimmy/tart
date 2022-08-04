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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, unmanaged } from 'inversify';
import { Emitter } from '../../common';
import { DisposableCollection } from '../../common/disposable';
export var CompositeTreeElement;
(function (CompositeTreeElement) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    function is(element) {
        return !!element && 'getElements' in element;
    }
    CompositeTreeElement.is = is;
    function hasElements(element) {
        return is(element) && element.hasElements !== false;
    }
    CompositeTreeElement.hasElements = hasElements;
})(CompositeTreeElement || (CompositeTreeElement = {}));
let TreeSource = class TreeSource {
    id;
    placeholder;
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    toDispose = new DisposableCollection(this.onDidChangeEmitter);
    constructor(options = {}) {
        this.id = options.id;
        this.placeholder = options.placeholder;
    }
    dispose() {
        this.toDispose.dispose();
    }
    fireDidChange() {
        this.onDidChangeEmitter.fire(undefined);
    }
};
TreeSource = __decorate([
    injectable(),
    __param(0, unmanaged())
], TreeSource);
export { TreeSource };

//# sourceMappingURL=../../../lib/browser/source-tree/tree-source.js.map
