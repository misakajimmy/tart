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
import {codicon} from './widget';

export type MessageType = keyof AlertMessageIcon;

interface AlertMessageIcon {
  INFO: string;
  SUCCESS: string;
  WARNING: string;
  ERROR: string;
}

const AlertMessageIcon = {
  INFO: codicon('info'),
  SUCCESS: codicon('pass'),
  WARNING: codicon('warning'),
  ERROR: codicon('error')
};

export interface AlertMessageProps {
  type: MessageType;
  header: string;
}

export class AlertMessage extends React.Component<AlertMessageProps> {

  render(): React.ReactNode {
    return <div className='tart-alert-message-container'>
      <div className={`tart-${this.props.type.toLowerCase()}-alert`}>
        <div className='tart-message-header'>
          <i className={AlertMessageIcon[this.props.type]}></i>&nbsp;
          {this.props.header}
        </div>
        <div className='tart-message-content'>{
          // @ts-ignore
          this.props.children
        }</div>
      </div>
    </div>;
  }

}
