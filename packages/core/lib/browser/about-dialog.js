/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
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
import { inject, injectable, postConstruct } from 'inversify';
import { DialogProps } from './dialogs';
import { ReactDialog } from './dialogs/react-dialog';
import { ApplicationServer } from '../common/application-protocol';
export const ABOUT_CONTENT_CLASS = 'tart-aboutDialog';
export const ABOUT_EXTENSIONS_CLASS = 'tart-aboutExtensions';
let AboutDialogProps = class AboutDialogProps extends DialogProps {
};
AboutDialogProps = __decorate([
    injectable()
], AboutDialogProps);
export { AboutDialogProps };
let AboutDialog = class AboutDialog extends ReactDialog {
    props;
    applicationInfo;
    extensionsInfos = [];
    okButton;
    appServer;
    constructor(props) {
        super({
            title: 'TART',
        });
        this.props = props;
        this.appendAcceptButton('Ok');
    }
    get value() {
        return undefined;
    }
    async init() {
        this.applicationInfo = await this.appServer.getApplicationInfo();
        this.extensionsInfos = await this.appServer.getExtensionsInfos();
        this.update();
    }
    renderHeader() {
        const applicationInfo = this.applicationInfo;
        return applicationInfo && React.createElement("h3", null,
            applicationInfo.name,
            " ",
            applicationInfo.version);
    }
    renderExtensions() {
        const extensionsInfos = this.extensionsInfos;
        return React.createElement(React.Fragment, null,
            React.createElement("h3", null, "List of extensions"),
            React.createElement("ul", { className: ABOUT_EXTENSIONS_CLASS }, extensionsInfos
                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                .map((extension) => React.createElement("li", { key: extension.name },
                extension.name,
                " ",
                extension.version))));
    }
    render() {
        return React.createElement("div", { className: ABOUT_CONTENT_CLASS },
            this.renderHeader(),
            this.renderExtensions());
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.update();
    }
};
__decorate([
    inject(ApplicationServer)
], AboutDialog.prototype, "appServer", void 0);
__decorate([
    postConstruct()
], AboutDialog.prototype, "init", null);
AboutDialog = __decorate([
    injectable(),
    __param(0, inject(AboutDialogProps))
], AboutDialog);
export { AboutDialog };

//# sourceMappingURL=../../lib/browser/about-dialog.js.map
