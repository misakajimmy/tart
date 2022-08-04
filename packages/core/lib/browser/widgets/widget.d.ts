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
import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '../../common';
import { KeyCode, KeysOrKeyCodes } from '../keyboard';
import PerfectScrollbar from 'perfect-scrollbar';
export * from '@lumino/widgets';
export * from '@lumino/messaging';
export declare const ACTION_ITEM = "action-item";
export declare function codiconArray(name: string, actionItem?: boolean): string[];
export declare function codicon(name: string, actionItem?: boolean): string;
export declare const DISABLED_CLASS = "tart-mod-disabled";
export declare const EXPANSION_TOGGLE_CLASS = "tart-ExpansionToggle";
export declare const CODICON_TREE_ITEM_CLASSES: string[];
export declare const COLLAPSED_CLASS = "tart-mod-collapsed";
export declare const BUSY_CLASS = "tart-mod-busy";
export declare const CODICON_LOADING_CLASSES: string[];
export declare const SELECTED_CLASS = "tart-mod-selected";
export declare const FOCUS_CLASS = "tart-mod-focus";
export declare const DEFAULT_SCROLL_OPTIONS: PerfectScrollbar.Options;
/**
 * At a number of places in the code, we have effectively reimplemented Phosphor's Widget.attach and Widget.detach,
 * but omitted the checks that Phosphor expects to be performed for those operations. That is a bad idea, because it
 * means that we are telling widgets that they are attached or detached when not all the conditions that should apply
 * do apply. We should explicitly mark those locations so that we know where we should go fix them later.
 */
export declare namespace UnsafeWidgetUtilities {
    /**
     * Ordinarily, the following checks should be performed before detaching a widget:
     * It should not be the child of another widget
     * It should be attached and it should be a child of document.body
     */
    function detach(widget: Widget): void;
    /**
     * @param ref The child of the host element to insert the widget before.
     * Ordinarily the following checks should be performed:
     * The widget should have no parent
     * The widget should not be attached, and its node should not be a child of document.body
     * The host should be a child of document.body
     * We often violate the last condition.
     */
    function attach(widget: Widget, host: HTMLElement, ref?: HTMLElement | null): void;
}
export declare class BaseWidget extends Widget {
    readonly onScrollYReachEndEmitter: Emitter<void>;
    onScrollYReachEnd: Event<void>;
    protected readonly onScrollUpEmitter: Emitter<void>;
    readonly onScrollUp: Event<void>;
    protected readonly onDidChangeVisibilityEmitter: Emitter<boolean>;
    readonly onDidChangeVisibility: Event<boolean>;
    protected readonly onDidDisposeEmitter: Emitter<void>;
    readonly onDidDispose: Event<void>;
    protected readonly toDispose: DisposableCollection;
    protected readonly toDisposeOnDetach: DisposableCollection;
    protected scrollBar?: PerfectScrollbar;
    protected scrollOptions?: PerfectScrollbar.Options;
    dispose(): void;
    setFlag(flag: Widget.Flag): void;
    clearFlag(flag: Widget.Flag): void;
    protected onCloseRequest(msg: Message): void;
    protected onBeforeAttach(msg: Message): void;
    protected onAfterDetach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    protected onAfterAttach(msg: Message): void;
    protected getScrollContainer(): MaybePromise<HTMLElement>;
    protected disableScrollBarFocus(scrollContainer: HTMLElement): void;
    protected onUpdateRequest(msg: Message): void;
    protected addUpdateListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, useCapture?: boolean): void;
    protected addEventListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>, useCapture?: boolean): void;
    protected addKeyListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, keysOrKeyCodes: KeyCode.Predicate | KeysOrKeyCodes, action: (event: KeyboardEvent) => boolean | void | Object, ...additionalEventTypes: K[]): void;
    protected addClipboardListener<K extends 'cut' | 'copy' | 'paste'>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>): void;
}
export declare function setEnabled(element: HTMLElement, enabled: boolean): void;
export declare function createIconButton(...classNames: string[]): HTMLSpanElement;
export declare type EventListener<K extends keyof HTMLElementEventMap> = (this: HTMLElement, event: HTMLElementEventMap[K]) => any;
export interface EventListenerObject<K extends keyof HTMLElementEventMap> {
    handleEvent(evt: HTMLElementEventMap[K]): void;
}
export declare namespace EventListenerObject {
    function is<K extends keyof HTMLElementEventMap>(listener: any | undefined): listener is EventListenerObject<K>;
}
export declare type EventListenerOrEventListenerObject<K extends keyof HTMLElementEventMap> = EventListener<K> | EventListenerObject<K>;
export declare function addEventListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>, useCapture?: boolean): Disposable;
export declare function addKeyListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, keysOrKeyCodes: KeyCode.Predicate | KeysOrKeyCodes, action: (event: KeyboardEvent) => boolean | void | Object, ...additionalEventTypes: K[]): Disposable;
export declare function addClipboardListener<K extends 'cut' | 'copy' | 'paste'>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>): Disposable;
/**
 * Resolves when the given widget is detached and hidden.
 */
export declare function waitForClosed(widget: Widget): Promise<void>;
/**
 * Resolves when the given widget is attached and visible.
 */
export declare function waitForRevealed(widget: Widget): Promise<void>;
/**
 * Resolves when the given widget is hidden regardless of attachment.
 */
export declare function waitForHidden(widget: Widget): Promise<void>;
