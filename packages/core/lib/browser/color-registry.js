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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { Disposable, DisposableCollection } from '../common/disposable';
import { Emitter } from '../common';
/**
 * @deprecated since 1.20.0. Import from `@tart/core/lib/common/color` instead.
 */
export * from '../common/color';
let ColorRegistry = class ColorRegistry {
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    *getColors() {
    }
    getCurrentCssVariable(id) {
        const value = this.getCurrentColor(id);
        if (!value) {
            return undefined;
        }
        const name = this.toCssVariableName(id);
        return { name, value };
    }
    toCssVariableName(id, prefix = 'tart') {
        return `--${prefix}-${id.replace(/\./g, '-')}`;
    }
    getCurrentColor(id) {
        return undefined;
    }
    register(...definitions) {
        const result = new DisposableCollection(...definitions.map(definition => this.doRegister(definition)));
        this.fireDidChange();
        return result;
    }
    fireDidChange() {
        this.onDidChangeEmitter.fire(undefined);
    }
    doRegister(definition) {
        return Disposable.NULL;
    }
};
ColorRegistry = __decorate([
    injectable()
], ColorRegistry);
export { ColorRegistry };

//# sourceMappingURL=../../lib/browser/color-registry.js.map
