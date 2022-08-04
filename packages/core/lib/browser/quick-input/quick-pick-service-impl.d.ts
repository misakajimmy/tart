/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
import { QuickPickService } from '../../common/quick-pick-service';
import { QuickInputButtonHandle, QuickInputService, QuickPick, QuickPickItem, QuickPickOptions } from './quick-input-service';
export declare class QuickPickServiceImpl implements QuickPickService {
    protected readonly quickInputService: QuickInputService;
    private readonly onDidHideEmitter;
    readonly onDidHide: import("../../common").Event<void>;
    private readonly onDidChangeValueEmitter;
    readonly onDidChangeValue: import("../../common").Event<{
        quickPick: QuickPick<QuickPickItem>;
        filter: string;
    }>;
    private readonly onDidAcceptEmitter;
    readonly onDidAccept: import("../../common").Event<void>;
    private readonly onDidChangeActiveEmitter;
    readonly onDidChangeActive: import("../../common").Event<{
        quickPick: QuickPick<QuickPickItem>;
        activeItems: Array<QuickPickItem>;
    }>;
    private readonly onDidChangeSelectionEmitter;
    readonly onDidChangeSelection: import("../../common").Event<{
        quickPick: QuickPick<QuickPickItem>;
        selectedItems: Array<QuickPickItem>;
    }>;
    private readonly onDidTriggerButtonEmitter;
    readonly onDidTriggerButton: import("../../common").Event<QuickInputButtonHandle>;
    private items;
    show<T extends QuickPickItem>(items: Array<T>, options?: QuickPickOptions<T>): Promise<T>;
    hide(): void;
    setItems<T>(items: Array<QuickPickItem>): void;
}
