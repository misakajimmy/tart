/********************************************************************************
 * Copyright (C) 2017 Ericsson and others.
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
import { LogLevel, rootLoggerName } from './logger-protocol';
/* eslint-disable @typescript-eslint/no-explicit-any */
export { LogLevel, rootLoggerName };
export const LoggerFactory = Symbol('LoggerFactory');
let Logger = class Logger {
    /* Log level for the logger.  */
    _logLevel;
    /* A promise resolved when the logger has been created by the backend.  */
    created;
    /**
     * Build a new Logger.
     */
    constructor(
    // @inject(ILoggerServer) protected readonly server: ILoggerServer,
    // @inject(LoggerWatcher) protected readonly loggerWatcher: LoggerWatcher,
    // @inject(LoggerFactory) protected readonly factory: LoggerFactory,
    // @inject(LoggerName) protected name: string
    ) {
        //
        // if (name !== rootLoggerName) {
        //     /* Creating a child logger.  */
        //     this.created = server.child(name);
        // } else {
        //     /* Creating the root logger (it already exists at startup).  */
        //     this.created = Promise.resolve();
        // }
        //
        // /* Fetch the log level so it's cached in the frontend.  */
        // this._logLevel = this.created.then(_ => this.server.getLogLevel(name));
        //
        // /* Update the log level if it changes in the backend. */
        // loggerWatcher.onLogLevelChanged(event => {
        //     this.created.then(() => {
        //         if (event.loggerName === name) {
        //             this._logLevel = Promise.resolve(event.newLogLevel);
        //         }
        //     });
        // });
    }
};
Logger = __decorate([
    injectable()
], Logger);
export { Logger };

//# sourceMappingURL=../../lib/common/logger.js.map
