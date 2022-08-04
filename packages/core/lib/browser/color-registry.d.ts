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
import { Disposable } from '../common/disposable';
import { Emitter } from '../common';
import { ColorCssVariable, ColorDefinition } from '../common/color';
/**
 * @deprecated since 1.20.0. Import from `@tart/core/lib/common/color` instead.
 */
export * from '../common/color';
export declare class ColorRegistry {
    protected readonly onDidChangeEmitter: Emitter<void>;
    readonly onDidChange: import("../common").Event<void>;
    getColors(): IterableIterator<string>;
    getCurrentCssVariable(id: string): ColorCssVariable | undefined;
    toCssVariableName(id: string, prefix?: string): string;
    getCurrentColor(id: string): string | undefined;
    register(...definitions: ColorDefinition[]): Disposable;
    protected fireDidChange(): void;
    protected doRegister(definition: ColorDefinition): Disposable;
}
