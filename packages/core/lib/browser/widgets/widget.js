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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import { decorate, injectable, unmanaged } from 'inversify';
import { Widget } from '@lumino/widgets';
import { MessageLoop } from '@lumino/messaging';
import { Disposable, DisposableCollection, Emitter } from '../../common';
import { KeyCode, KeysOrKeyCodes } from '../keyboard';
import PerfectScrollbar from 'perfect-scrollbar';
decorate(injectable(), Widget);
decorate(unmanaged(), Widget, 0);
export * from '@lumino/widgets';
export * from '@lumino/messaging';
export const ACTION_ITEM = 'action-item';
export function codiconArray(name, actionItem = false) {
    const array = ['codicon', `codicon-${name}`];
    if (actionItem) {
        array.push(ACTION_ITEM);
    }
    return array;
}
export function codicon(name, actionItem = false) {
    return `codicon codicon-${name}${actionItem ? ` ${ACTION_ITEM}` : ''}`;
}
export const DISABLED_CLASS = 'tart-mod-disabled';
export const EXPANSION_TOGGLE_CLASS = 'tart-ExpansionToggle';
export const CODICON_TREE_ITEM_CLASSES = codiconArray('chevron-down');
export const COLLAPSED_CLASS = 'tart-mod-collapsed';
export const BUSY_CLASS = 'tart-mod-busy';
export const CODICON_LOADING_CLASSES = codiconArray('loading');
export const SELECTED_CLASS = 'tart-mod-selected';
export const FOCUS_CLASS = 'tart-mod-focus';
export const DEFAULT_SCROLL_OPTIONS = {
    suppressScrollX: true,
    minScrollbarLength: 35,
};
/**
 * At a number of places in the code, we have effectively reimplemented Phosphor's Widget.attach and Widget.detach,
 * but omitted the checks that Phosphor expects to be performed for those operations. That is a bad idea, because it
 * means that we are telling widgets that they are attached or detached when not all the conditions that should apply
 * do apply. We should explicitly mark those locations so that we know where we should go fix them later.
 */
export var UnsafeWidgetUtilities;
(function (UnsafeWidgetUtilities) {
    /**
     * Ordinarily, the following checks should be performed before detaching a widget:
     * It should not be the child of another widget
     * It should be attached and it should be a child of document.body
     */
    function detach(widget) {
        MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
        widget.node.remove();
        MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }
    UnsafeWidgetUtilities.detach = detach;
    /**
     * @param ref The child of the host element to insert the widget before.
     * Ordinarily the following checks should be performed:
     * The widget should have no parent
     * The widget should not be attached, and its node should not be a child of document.body
     * The host should be a child of document.body
     * We often violate the last condition.
     */
    // eslint-disable-next-line no-null/no-null
    function attach(widget, host, ref = null) {
        MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
        host.insertBefore(widget.node, ref);
        MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }
    UnsafeWidgetUtilities.attach = attach;
})(UnsafeWidgetUtilities || (UnsafeWidgetUtilities = {}));
let BaseWidget = class BaseWidget extends Widget {
    onScrollYReachEndEmitter = new Emitter();
    onScrollYReachEnd = this.onScrollYReachEndEmitter.event;
    onScrollUpEmitter = new Emitter();
    onScrollUp = this.onScrollUpEmitter.event;
    onDidChangeVisibilityEmitter = new Emitter();
    onDidChangeVisibility = this.onDidChangeVisibilityEmitter.event;
    onDidDisposeEmitter = new Emitter();
    onDidDispose = this.onDidDisposeEmitter.event;
    toDispose = new DisposableCollection(this.onDidDisposeEmitter, Disposable.create(() => this.onDidDisposeEmitter.fire()), this.onScrollYReachEndEmitter, this.onScrollUpEmitter, this.onDidChangeVisibilityEmitter);
    toDisposeOnDetach = new DisposableCollection();
    scrollBar;
    scrollOptions;
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this.toDispose.dispose();
    }
    setFlag(flag) {
        super.setFlag(flag);
        if (flag === Widget.Flag.IsVisible) {
            this.onDidChangeVisibilityEmitter.fire(this.isVisible);
        }
    }
    clearFlag(flag) {
        super.clearFlag(flag);
        if (flag === Widget.Flag.IsVisible) {
            this.onDidChangeVisibilityEmitter.fire(this.isVisible);
        }
    }
    onCloseRequest(msg) {
        super.onCloseRequest(msg);
        this.dispose();
    }
    onBeforeAttach(msg) {
        if (this.title.iconClass === '') {
            this.title.iconClass = 'no-icon';
        }
        super.onBeforeAttach(msg);
    }
    onAfterDetach(msg) {
        if (this.title.iconClass === 'no-icon') {
            this.title.iconClass = '';
        }
        super.onAfterDetach(msg);
    }
    onBeforeDetach(msg) {
        this.toDisposeOnDetach.dispose();
        super.onBeforeDetach(msg);
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        if (this.scrollOptions) {
            (async () => {
                const container = await this.getScrollContainer();
                container.style.overflow = 'hidden';
                this.scrollBar = new PerfectScrollbar(container, this.scrollOptions);
                this.disableScrollBarFocus(container);
                this.toDisposeOnDetach.push(addEventListener(container, 'ps-y-reach-end', () => {
                    this.onScrollYReachEndEmitter.fire(undefined);
                }));
                this.toDisposeOnDetach.push(addEventListener(container, 'ps-scroll-up', () => {
                    this.onScrollUpEmitter.fire(undefined);
                }));
                this.toDisposeOnDetach.push(Disposable.create(() => {
                    if (this.scrollBar) {
                        this.scrollBar.destroy();
                        this.scrollBar = undefined;
                    }
                    container.style.overflow = 'initial';
                }));
            })();
        }
    }
    getScrollContainer() {
        return this.node;
    }
    disableScrollBarFocus(scrollContainer) {
        for (const thumbs of [scrollContainer.getElementsByClassName('ps__thumb-x'), scrollContainer.getElementsByClassName('ps__thumb-y')]) {
            for (let i = 0; i < thumbs.length; i++) {
                const element = thumbs.item(i);
                if (element) {
                    element.removeAttribute('tabIndex');
                }
            }
        }
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        if (this.scrollBar) {
            this.scrollBar.update();
        }
    }
    addUpdateListener(element, type, useCapture) {
        this.addEventListener(element, type, e => {
            this.update();
            e.preventDefault();
        }, useCapture);
    }
    addEventListener(element, type, listener, useCapture) {
        this.toDisposeOnDetach.push(addEventListener(element, type, listener, useCapture));
    }
    addKeyListener(element, keysOrKeyCodes, action, ...additionalEventTypes) {
        this.toDisposeOnDetach.push(addKeyListener(element, keysOrKeyCodes, action, ...additionalEventTypes));
    }
    addClipboardListener(element, type, listener) {
        this.toDisposeOnDetach.push(addClipboardListener(element, type, listener));
    }
};
BaseWidget = __decorate([
    injectable()
], BaseWidget);
export { BaseWidget };
export function setEnabled(element, enabled) {
    element.classList.toggle(DISABLED_CLASS, !enabled);
    element.tabIndex = enabled ? 0 : -1;
}
export function createIconButton(...classNames) {
    const icon = document.createElement('i');
    icon.classList.add(...classNames);
    const button = document.createElement('span');
    button.tabIndex = 0;
    button.appendChild(icon);
    return button;
}
export var EventListenerObject;
(function (EventListenerObject) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(listener) {
        return !!listener && 'handleEvent' in listener;
    }
    EventListenerObject.is = is;
})(EventListenerObject || (EventListenerObject = {}));
export function addEventListener(element, type, listener, useCapture) {
    element.addEventListener(type, listener, useCapture);
    return Disposable.create(() => element.removeEventListener(type, listener, useCapture));
}
export function addKeyListener(element, keysOrKeyCodes, action, ...additionalEventTypes) {
    const toDispose = new DisposableCollection();
    const keyCodePredicate = (() => {
        if (typeof keysOrKeyCodes === 'function') {
            return keysOrKeyCodes;
        }
        else {
            return (actual) => KeysOrKeyCodes.toKeyCodes(keysOrKeyCodes).some(k => k.equals(actual));
        }
    })();
    toDispose.push(addEventListener(element, 'keydown', e => {
        const kc = KeyCode.createKeyCode(e);
        if (keyCodePredicate(kc)) {
            const result = action(e);
            if (typeof result !== 'boolean' || result) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }));
    for (const type of additionalEventTypes) {
        toDispose.push(addEventListener(element, type, e => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = type['keydown'];
            const result = action(event);
            if (typeof result !== 'boolean' || result) {
                e.stopPropagation();
                e.preventDefault();
            }
        }));
    }
    return toDispose;
}
export function addClipboardListener(element, type, listener) {
    const documentListener = (e) => {
        const activeElement = document.activeElement;
        if (activeElement && element.contains(activeElement)) {
            if (EventListenerObject.is(listener)) {
                listener.handleEvent(e);
            }
            else {
                listener.bind(element)(e);
            }
        }
    };
    document.addEventListener(type, documentListener);
    return Disposable.create(() => document.removeEventListener(type, documentListener));
}
/**
 * Resolves when the given widget is detached and hidden.
 */
export function waitForClosed(widget) {
    return waitForVisible(widget, false, false);
}
/**
 * Resolves when the given widget is attached and visible.
 */
export function waitForRevealed(widget) {
    return waitForVisible(widget, true, true);
}
/**
 * Resolves when the given widget is hidden regardless of attachment.
 */
export function waitForHidden(widget) {
    return waitForVisible(widget, true);
}
function waitForVisible(widget, visible, attached) {
    if ((typeof attached !== 'boolean' || widget.isAttached === attached) &&
        (widget.isVisible === visible || (widget.node.style.visibility !== 'hidden') === visible)) {
        return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
    }
    return new Promise(resolve => {
        const waitFor = () => window.requestAnimationFrame(() => {
            if ((typeof attached !== 'boolean' || widget.isAttached === attached) &&
                (widget.isVisible === visible || (widget.node.style.visibility !== 'hidden') === visible)) {
                window.requestAnimationFrame(() => resolve());
            }
            else {
                waitFor();
            }
        });
        waitFor();
    });
}

//# sourceMappingURL=../../../lib/browser/widgets/widget.js.map
