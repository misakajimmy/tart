/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
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
/// <reference types="@theia/monaco-editor-core/monaco" />
import { Position, Range } from 'vscode-languageserver-types';
import { RecursivePartial } from '@tart/core/lib/common/types';
export interface MonacoRangeReplace {
    insert: monaco.IRange;
    replace: monaco.IRange;
}
export declare namespace MonacoRangeReplace {
    function is(v: Partial<monaco.IRange> | MonacoRangeReplace): v is MonacoRangeReplace;
}
export declare class MonacoToProtocolConverter {
    asPosition(lineNumber: undefined | null, column: undefined | null): {};
    asPosition(lineNumber: number, column: undefined | null): Pick<Position, 'line'>;
    asPosition(lineNumber: undefined | null, column: number): Pick<Position, 'character'>;
    asPosition(lineNumber: number, column: number): Position;
    asPosition(lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position>;
    asRange(range: undefined): undefined;
    asRange(range: monaco.IRange): Range;
    asRange(range: monaco.IRange | undefined): Range | undefined;
    asRange(range: monaco.IRange | {
        insert: monaco.IRange;
        replace: monaco.IRange;
    }): Range;
    asRange(range: Partial<monaco.IRange>): RecursivePartial<Range>;
    asRange(range: Partial<monaco.IRange> | undefined): RecursivePartial<Range> | undefined;
}
