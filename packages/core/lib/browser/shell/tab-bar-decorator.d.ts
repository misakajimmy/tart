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
import { Title, Widget } from '@lumino/widgets';
import { ContributionProvider, Emitter, Event } from '../../common';
import { WidgetDecoration } from '../widget-decoration';
import { FrontendApplicationContribution } from '../frontend-application';
export declare const TabBarDecorator: unique symbol;
export interface TabBarDecorator {
    /**
     * The unique identifier of the tab bar decorator.
     */
    readonly id: string;
    /**
     * Event that is fired when any of the available tab bar decorators has changes.
     */
    readonly onDidChangeDecorations: Event<void>;
    /**
     * Decorate title.
     * @param {Title<Widget>} title the title
     * @returns decoration data.
     */
    decorate(title: Title<Widget>): WidgetDecoration.Data[];
}
export declare class TabBarDecoratorService implements FrontendApplicationContribution {
    protected readonly onDidChangeDecorationsEmitter: Emitter<void>;
    readonly onDidChangeDecorations: Event<void>;
    fireDidChangeDecorations: any;
    protected readonly contributions: ContributionProvider<TabBarDecorator>;
    initialize(): void;
    /**
     * Assign tabs the decorators provided by all the contributions.
     * @param {Title<Widget>} title the title
     * @returns an array of its decoration data.
     */
    getDecorations(title: Title<Widget>): WidgetDecoration.Data[];
}
