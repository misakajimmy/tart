/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { inject, injectable } from 'inversify';
import { Disposable, DisposableCollection } from '../../common';
import { AbstractDialog, DialogProps } from '../dialogs';
let ReactDialog = class ReactDialog extends AbstractDialog {
    props;
    onRender = new DisposableCollection();
    constructor(props) {
        super(props);
        this.props = props;
        this.toDispose.push(Disposable.create(() => {
            ReactDOM.unmountComponentAtNode(this.contentNode);
        }));
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        ReactDOM.render(React.createElement(React.Fragment, null, this.render()), this.contentNode, () => this.onRender.dispose());
    }
};
ReactDialog = __decorate([
    injectable(),
    __param(0, inject(DialogProps))
], ReactDialog);
export { ReactDialog };

//# sourceMappingURL=../../../lib/browser/dialogs/react-dialog.js.map
