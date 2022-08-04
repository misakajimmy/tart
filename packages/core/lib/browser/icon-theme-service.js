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
import { inject, injectable, postConstruct } from 'inversify';
import { Disposable, DisposableCollection, Emitter } from '../common';
import { FrontendApplicationConfigProvider } from './frontend-application-config-provider';
let NoneIconTheme = class NoneIconTheme {
    id = 'none';
    label = 'None';
    description = 'Disable file icons';
    hasFileIcons = true;
    hasFolderIcons = true;
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    toDeactivate = new DisposableCollection();
    activate() {
        if (this.toDeactivate.disposed) {
            this.toDeactivate.push(Disposable.create(() => this.fireDidChange()));
            this.fireDidChange();
        }
        return this.toDeactivate;
    }
    canHandle() {
        if (this.toDeactivate.disposed) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    }
    getIcon() {
        return '';
    }
    fireDidChange() {
        this.onDidChangeEmitter.fire({ affects: () => true });
    }
};
NoneIconTheme = __decorate([
    injectable()
], NoneIconTheme);
export { NoneIconTheme };
let IconThemeService = class IconThemeService {
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    _iconThemes = new Map();
    noneIconTheme;
    onDidChangeCurrentEmitter = new Emitter();
    onDidChangeCurrent = this.onDidChangeCurrentEmitter.event;
    toDeactivate = new DisposableCollection();
    get ids() {
        return this._iconThemes.keys();
    }
    get definitions() {
        return this._iconThemes.values();
    }
    get current() {
        return this.getCurrent().id;
    }
    set current(id) {
        const newCurrent = this._iconThemes.get(id) || this.default;
        if (this.getCurrent().id !== newCurrent.id) {
            this.setCurrent(newCurrent);
        }
    }
    get default() {
        return this._iconThemes.get(FrontendApplicationConfigProvider.get().defaultIconTheme) || this.noneIconTheme;
    }
    getDefinition(id) {
        return this._iconThemes.get(id);
    }
    register(iconTheme) {
        if (this._iconThemes.has(iconTheme.id)) {
            console.warn(new Error(`Icon theme '${iconTheme.id}' has already been registered, skipping.`));
            return Disposable.NULL;
        }
        this._iconThemes.set(iconTheme.id, iconTheme);
        this.onDidChangeEmitter.fire(undefined);
        if (this.toDeactivate.disposed
            && window.localStorage.getItem('iconTheme') === iconTheme.id) {
            this.setCurrent(iconTheme);
        }
        return Disposable.create(() => this.unregister(iconTheme.id));
    }
    unregister(id) {
        const iconTheme = this._iconThemes.get(id);
        if (!iconTheme) {
            return undefined;
        }
        this._iconThemes.delete(id);
        if (window.localStorage.getItem('iconTheme') === id) {
            window.localStorage.removeItem('iconTheme');
            this.onDidChangeCurrentEmitter.fire(this.default.id);
        }
        this.onDidChangeEmitter.fire(undefined);
        return iconTheme;
    }
    init() {
        this.register(this.noneIconTheme);
    }
    getCurrent() {
        const id = window.localStorage.getItem('iconTheme');
        return id && this._iconThemes.get(id) || this.default;
    }
    setCurrent(current) {
        window.localStorage.setItem('iconTheme', current.id);
        this.toDeactivate.dispose();
        this.toDeactivate.push(current.activate());
        this.onDidChangeCurrentEmitter.fire(current.id);
    }
    load() {
        return window.localStorage.getItem('iconTheme') || undefined;
    }
};
__decorate([
    inject(NoneIconTheme)
], IconThemeService.prototype, "noneIconTheme", void 0);
__decorate([
    postConstruct()
], IconThemeService.prototype, "init", null);
IconThemeService = __decorate([
    injectable()
], IconThemeService);
export { IconThemeService };

//# sourceMappingURL=../../lib/browser/icon-theme-service.js.map
