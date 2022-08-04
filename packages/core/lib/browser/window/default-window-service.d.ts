/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { Emitter, Event } from '../../common';
import { ContributionProvider } from '../../common/contribution-provider';
import { FrontendApplication, FrontendApplicationContribution } from '../frontend-application';
import { WindowService } from './window-service';
export declare class DefaultWindowService implements WindowService, FrontendApplicationContribution {
    protected frontendApplication: FrontendApplication;
    protected onUnloadEmitter: Emitter<void>;
    protected readonly contributions: ContributionProvider<FrontendApplicationContribution>;
    get onUnload(): Event<void>;
    onStart(app: FrontendApplication): void;
    openNewWindow(url: string): undefined;
    openNewDefaultWindow(): void;
    canUnload(): boolean;
    /**
     * Implement the mechanism to detect unloading of the page.
     */
    protected registerUnloadListeners(): void;
    /**
     * Notify the browser that we do not want to unload.
     *
     * Notes:
     *  - Shows a confirmation popup in browsers.
     *  - Prevents the window from closing without confirmation in electron.
     *
     * @param event The beforeunload event
     */
    protected preventUnload(event: BeforeUnloadEvent): string | void;
}
