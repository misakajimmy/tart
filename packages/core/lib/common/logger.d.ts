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
import { LogLevel, rootLoggerName } from './logger-protocol';
export { LogLevel, rootLoggerName };
/**
 * Counterpart of the `#setRootLogger(ILogger)`. Restores the `console.xxx` bindings to the original one.
 * Invoking has no side-effect if `setRootLogger` was not called before. Multiple function invocation has
 * no side-effect either.
 */
export declare type Log = (message: any, ...params: any[]) => void;
export declare type Loggable = (log: Log) => void;
export declare const LoggerFactory: unique symbol;
export declare type LoggerFactory = (name: string) => ILogger;
export interface ILogger {
}
export declare class Logger implements ILogger {
    protected _logLevel: Promise<number>;
    protected created: Promise<void>;
    /**
     * Build a new Logger.
     */
    constructor();
}
