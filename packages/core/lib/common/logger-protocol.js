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
export const ILoggerServer = Symbol('ILoggerServer');
export const loggerPath = '/services/logger';
export const ILoggerClient = Symbol('ILoggerClient');
let DispatchingLoggerClient = class DispatchingLoggerClient {
    clients = new Set();
    onLogLevelChanged(event) {
        this.clients.forEach(client => client.onLogLevelChanged(event));
    }
};
DispatchingLoggerClient = __decorate([
    injectable()
], DispatchingLoggerClient);
export { DispatchingLoggerClient };
export const rootLoggerName = 'root';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["FATAL"] = 60] = "FATAL";
    LogLevel[LogLevel["ERROR"] = 50] = "ERROR";
    LogLevel[LogLevel["WARN"] = 40] = "WARN";
    LogLevel[LogLevel["INFO"] = 30] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 20] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 10] = "TRACE";
})(LogLevel || (LogLevel = {}));
(function (LogLevel) {
    LogLevel.strings = new Map([
        [LogLevel.FATAL, 'fatal'],
        [LogLevel.ERROR, 'error'],
        [LogLevel.WARN, 'warn'],
        [LogLevel.INFO, 'info'],
        [LogLevel.DEBUG, 'debug'],
        [LogLevel.TRACE, 'trace']
    ]);
    function toString(level) {
        return LogLevel.strings.get(level);
    }
    LogLevel.toString = toString;
    function fromString(levelStr) {
        for (const pair of LogLevel.strings) {
            if (pair[1] === levelStr) {
                return pair[0];
            }
        }
        return undefined;
    }
    LogLevel.fromString = fromString;
})(LogLevel || (LogLevel = {}));
/* eslint-disable @typescript-eslint/no-explicit-any */
export var ConsoleLogger;
(function (ConsoleLogger) {
    const originalConsoleLog = console.log;
    const consoles = new Map([
        [LogLevel.FATAL, console.error],
        [LogLevel.ERROR, console.error],
        [LogLevel.WARN, console.warn],
        [LogLevel.INFO, console.info],
        [LogLevel.DEBUG, console.debug],
        [LogLevel.TRACE, console.trace]
    ]);
    function reset() {
        console.error = consoles.get(LogLevel.ERROR);
        console.warn = consoles.get(LogLevel.WARN);
        console.info = consoles.get(LogLevel.INFO);
        console.debug = consoles.get(LogLevel.DEBUG);
        console.trace = consoles.get(LogLevel.TRACE);
        console.log = originalConsoleLog;
    }
    ConsoleLogger.reset = reset;
    function log(name, logLevel, message, params) {
        const console = consoles.get(logLevel) || originalConsoleLog;
        const severity = (LogLevel.strings.get(logLevel) || 'unknown').toUpperCase();
        console(`${name} ${severity} ${message}`, ...params);
    }
    ConsoleLogger.log = log;
})(ConsoleLogger || (ConsoleLogger = {}));

//# sourceMappingURL=../../lib/common/logger-protocol.js.map
