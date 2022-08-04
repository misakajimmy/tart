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
import * as React from "react";
import { codicon } from './widget';
const AlertMessageIcon = {
    INFO: codicon('info'),
    SUCCESS: codicon('pass'),
    WARNING: codicon('warning'),
    ERROR: codicon('error')
};
export class AlertMessage extends React.Component {
    render() {
        return React.createElement("div", { className: 'tart-alert-message-container' },
            React.createElement("div", { className: `tart-${this.props.type.toLowerCase()}-alert` },
                React.createElement("div", { className: 'tart-message-header' },
                    React.createElement("i", { className: AlertMessageIcon[this.props.type] }),
                    "\u00A0",
                    this.props.header),
                React.createElement("div", { className: 'tart-message-content' }, 
                // @ts-ignore
                this.props.children)));
    }
}

//# sourceMappingURL=../../../lib/browser/widgets/alert-message.js.map
