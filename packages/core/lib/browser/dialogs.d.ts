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
import { CancellationTokenSource, Disposable, MaybePromise } from '../common';
import { BaseWidget, Message } from './widgets';
import { FrontendApplicationContribution } from './frontend-application';
export declare class DialogProps {
    readonly title: string;
    /**
     * Determines the maximum width of the dialog in pixels.
     * Default value is undefined, which would result in the css property 'max-width: none' being applied to the dialog.
     */
    maxWidth?: number;
    /**
     * Determine the word wrapping behavior for content in the dialog.
     * - `normal`: breaks words at allowed break points.
     * - `break-word`: breaks otherwise unbreakable words.
     * - `initial`: sets the property to it's default value.
     * - `inherit`: inherit this property from it's parent element.
     * Default value is undefined, which would result in the css property 'word-wrap' not being applied to the dialog.
     */
    wordWrap?: 'normal' | 'break-word' | 'initial' | 'inherit';
}
export declare type DialogMode = 'open' | 'preview';
export declare type DialogError = string | boolean | {
    message: string;
    result: boolean;
};
export declare namespace DialogError {
    function getResult(error: DialogError): boolean;
    function getMessage(error: DialogError): string;
}
export declare namespace Dialog {
    const YES: string;
    const NO: string;
    const OK: string;
    const CANCEL: string;
}
export declare class DialogOverlayService implements FrontendApplicationContribution {
    protected static INSTANCE: DialogOverlayService;
    protected readonly dialogs: AbstractDialog<any>[];
    constructor();
    protected get currentDialog(): AbstractDialog<any> | undefined;
    static get(): DialogOverlayService;
    initialize(): void;
    push(dialog: AbstractDialog<any>): Disposable;
    protected handleEscape(event: KeyboardEvent): boolean | void;
    protected handleEnter(event: KeyboardEvent): boolean | void;
}
export declare abstract class AbstractDialog<T> extends BaseWidget {
    protected readonly props: DialogProps;
    protected readonly titleNode: HTMLDivElement;
    protected readonly contentNode: HTMLDivElement;
    protected readonly closeCrossNode: HTMLElement;
    protected readonly controlPanel: HTMLDivElement;
    protected readonly errorMessageNode: HTMLDivElement;
    protected resolve: undefined | ((value: T | undefined) => void);
    protected reject: undefined | ((reason: any) => void);
    protected closeButton: HTMLButtonElement | undefined;
    protected acceptButton: HTMLButtonElement | undefined;
    protected activeElement: HTMLElement | undefined;
    protected validateCancellationSource: CancellationTokenSource;
    protected acceptCancellationSource: CancellationTokenSource;
    constructor(props: DialogProps);
    abstract get value(): T;
    open(): Promise<T | undefined>;
    close(): void;
    protected appendCloseButton(text?: string): HTMLButtonElement;
    protected appendAcceptButton(text?: string): HTMLButtonElement;
    protected createButton(text: string): HTMLButtonElement;
    protected onAfterAttach(msg: Message): void;
    protected handleEscape(event: KeyboardEvent): boolean | void;
    protected handleEnter(event: KeyboardEvent): boolean | void;
    protected onActivateRequest(msg: Message): void;
    protected onUpdateRequest(msg: Message): void;
    protected validate(): Promise<void>;
    protected accept(): Promise<void>;
    /**
     * Return a string of zero-length or true if valid.
     */
    protected isValid(value: T, mode: DialogMode): MaybePromise<DialogError>;
    protected setErrorMessage(error: DialogError): void;
    protected addCloseAction<K extends keyof HTMLElementEventMap>(element: HTMLElement, ...additionalEventTypes: K[]): void;
    protected addAcceptAction<K extends keyof HTMLElementEventMap>(element: HTMLElement, ...additionalEventTypes: K[]): void;
}
export declare class ConfirmDialogProps extends DialogProps {
    readonly msg: string | HTMLElement;
    readonly cancel?: string;
    readonly ok?: string;
}
export declare class ConfirmDialog extends AbstractDialog<boolean> {
    protected readonly props: ConfirmDialogProps;
    protected confirmed: boolean;
    constructor(props: ConfirmDialogProps);
    get value(): boolean;
    protected onCloseRequest(msg: Message): void;
    protected createMessageNode(msg: string | HTMLElement): HTMLElement;
}
export declare class SingleTextInputDialogProps extends DialogProps {
    readonly confirmButtonLabel?: string;
    readonly initialValue?: string;
    readonly initialSelectionRange?: {
        start: number;
        end: number;
        direction?: 'forward' | 'backward' | 'none';
    };
    readonly validate?: (input: string, mode: DialogMode) => MaybePromise<DialogError>;
}
export declare class SingleTextInputDialog extends AbstractDialog<string> {
    protected readonly props: SingleTextInputDialogProps;
    protected readonly inputField: HTMLInputElement;
    constructor(props: SingleTextInputDialogProps);
    get value(): string;
    protected isValid(value: string, mode: DialogMode): MaybePromise<DialogError>;
    protected onAfterAttach(msg: Message): void;
    protected onActivateRequest(msg: Message): void;
    protected handleEnter(event: KeyboardEvent): boolean | void;
}
export declare class MessageDialogProps extends DialogProps {
    readonly msg: string | HTMLElement;
}
export declare class MessageDialog extends AbstractDialog<void> {
    protected readonly props: MessageDialogProps;
    constructor(props: MessageDialogProps);
    get value(): void;
    protected createMessageNode(msg: string | HTMLElement): HTMLElement;
}
