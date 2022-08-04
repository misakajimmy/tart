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
import { Disposable, DisposableCollection } from '../common';
import { inject, injectable, postConstruct } from 'inversify';
import { ProgressBarOptions } from './progress-bar-factory';
let ProgressBar = class ProgressBar {
    options;
    toDispose = new DisposableCollection();
    progressBar;
    progressBarContainer;
    constructor() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'tart-progress-bar';
        this.progressBar.style.display = 'none';
        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.className = 'tart-progress-bar-container';
        this.progressBarContainer.append(this.progressBar);
    }
    dispose() {
        this.toDispose.dispose();
    }
    init() {
        const { container, insertMode, locationId } = this.options;
        if (insertMode === 'prepend') {
            container.prepend(this.progressBarContainer);
        }
        else {
            container.append(this.progressBarContainer);
        }
        this.toDispose.push(Disposable.create(() => this.progressBarContainer.remove()));
    }
    onProgress(event) {
        if (this.toDispose.disposed) {
            return;
        }
        this.setVisible(event.show);
    }
    setVisible(visible) {
        this.progressBar.style.display = visible ? 'block' : 'none';
    }
};
__decorate([
    inject(ProgressBarOptions)
], ProgressBar.prototype, "options", void 0);
__decorate([
    postConstruct()
], ProgressBar.prototype, "init", null);
ProgressBar = __decorate([
    injectable()
], ProgressBar);
export { ProgressBar };

//# sourceMappingURL=../../lib/browser/progress-bar.js.map
