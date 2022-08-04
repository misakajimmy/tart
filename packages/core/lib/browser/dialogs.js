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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DialogOverlayService_1;
import { inject, injectable } from 'inversify';
import { CancellationTokenSource, Disposable } from '../common';
import { Key } from './keyboard/keys';
import { addKeyListener, BaseWidget, codiconArray, Widget } from './widgets';
import { nls } from '../common/nls';
let DialogProps = class DialogProps {
    title;
    /**
     * Determines the maximum width of the dialog in pixels.
     * Default value is undefined, which would result in the css property 'max-width: none' being applied to the dialog.
     */
    maxWidth;
    /**
     * Determine the word wrapping behavior for content in the dialog.
     * - `normal`: breaks words at allowed break points.
     * - `break-word`: breaks otherwise unbreakable words.
     * - `initial`: sets the property to it's default value.
     * - `inherit`: inherit this property from it's parent element.
     * Default value is undefined, which would result in the css property 'word-wrap' not being applied to the dialog.
     */
    wordWrap;
};
DialogProps = __decorate([
    injectable()
], DialogProps);
export { DialogProps };
export var DialogError;
(function (DialogError) {
    function getResult(error) {
        if (typeof error === 'string') {
            return !error.length;
        }
        if (typeof error === 'boolean') {
            return error;
        }
        return error.result;
    }
    DialogError.getResult = getResult;
    function getMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (typeof error === 'boolean') {
            return '';
        }
        return error.message;
    }
    DialogError.getMessage = getMessage;
})(DialogError || (DialogError = {}));
export var Dialog;
(function (Dialog) {
    Dialog.YES = nls.localizeByDefault('Yes');
    Dialog.NO = nls.localizeByDefault('No');
    Dialog.OK = nls.localizeByDefault('OK');
    Dialog.CANCEL = nls.localizeByDefault('Cancel');
})(Dialog || (Dialog = {}));
let DialogOverlayService = DialogOverlayService_1 = class DialogOverlayService {
    static INSTANCE;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dialogs = [];
    constructor() {
        addKeyListener(document.body, Key.ENTER, e => this.handleEnter(e));
        addKeyListener(document.body, Key.ESCAPE, e => this.handleEscape(e));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get currentDialog() {
        return this.dialogs[0];
    }
    static get() {
        return DialogOverlayService_1.INSTANCE;
    }
    initialize() {
        DialogOverlayService_1.INSTANCE = this;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push(dialog) {
        this.dialogs.unshift(dialog);
        return Disposable.create(() => {
            const index = this.dialogs.indexOf(dialog);
            if (index > -1) {
                this.dialogs.splice(index, 1);
            }
        });
    }
    handleEscape(event) {
        const dialog = this.currentDialog;
        if (dialog) {
            return dialog['handleEscape'](event);
        }
        return false;
    }
    handleEnter(event) {
        const dialog = this.currentDialog;
        if (dialog) {
            return dialog['handleEnter'](event);
        }
        return false;
    }
};
DialogOverlayService = DialogOverlayService_1 = __decorate([
    injectable()
], DialogOverlayService);
export { DialogOverlayService };
let AbstractDialog = class AbstractDialog extends BaseWidget {
    props;
    titleNode;
    contentNode;
    closeCrossNode;
    controlPanel;
    errorMessageNode;
    resolve;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject;
    closeButton;
    acceptButton;
    activeElement;
    validateCancellationSource = new CancellationTokenSource();
    acceptCancellationSource = new CancellationTokenSource();
    constructor(props) {
        super();
        this.props = props;
        this.id = 'tart-dialog-shell';
        this.addClass('dialogOverlay');
        this.toDispose.push(Disposable.create(() => {
            if (this.reject) {
                Widget.detach(this);
            }
        }));
        const container = document.createElement('div');
        container.classList.add('dialogBlock');
        if (props.maxWidth === undefined) {
            container.setAttribute('style', 'max-width: none');
        }
        else {
            container.setAttribute('style', `max-width: ${props.maxWidth}px; min-width: 0px`);
        }
        this.node.appendChild(container);
        const titleContentNode = document.createElement('div');
        titleContentNode.classList.add('dialogTitle');
        container.appendChild(titleContentNode);
        this.titleNode = document.createElement('div');
        this.titleNode.textContent = props.title;
        titleContentNode.appendChild(this.titleNode);
        this.closeCrossNode = document.createElement('i');
        this.closeCrossNode.classList.add(...codiconArray('close'));
        this.closeCrossNode.classList.add('closeButton');
        titleContentNode.appendChild(this.closeCrossNode);
        this.contentNode = document.createElement('div');
        this.contentNode.classList.add('dialogContent');
        if (props.wordWrap !== undefined) {
            this.contentNode.setAttribute('style', `word-wrap: ${props.wordWrap}`);
        }
        container.appendChild(this.contentNode);
        this.controlPanel = document.createElement('div');
        this.controlPanel.classList.add('dialogControl');
        container.appendChild(this.controlPanel);
        this.errorMessageNode = document.createElement('div');
        this.errorMessageNode.classList.add('error');
        this.errorMessageNode.setAttribute('style', 'flex: 2');
        this.controlPanel.appendChild(this.errorMessageNode);
        this.update();
    }
    open() {
        if (this.resolve) {
            return Promise.reject(new Error('The dialog is already opened.'));
        }
        this.activeElement = window.document.activeElement;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.toDisposeOnDetach.push(Disposable.create(() => {
                this.resolve = undefined;
                this.reject = undefined;
            }));
            Widget.attach(this, document.body);
            this.activate();
        });
    }
    close() {
        if (this.resolve) {
            if (this.activeElement) {
                this.activeElement.focus({ preventScroll: true });
            }
            this.resolve(undefined);
        }
        this.activeElement = undefined;
        super.close();
    }
    appendCloseButton(text = Dialog.CANCEL) {
        this.closeButton = this.createButton(text);
        this.controlPanel.appendChild(this.closeButton);
        this.closeButton.classList.add('secondary');
        return this.closeButton;
    }
    appendAcceptButton(text = Dialog.OK) {
        this.acceptButton = this.createButton(text);
        this.controlPanel.appendChild(this.acceptButton);
        this.acceptButton.classList.add('main');
        return this.acceptButton;
    }
    createButton(text) {
        const button = document.createElement('button');
        button.classList.add('tart-button');
        button.textContent = text;
        return button;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        if (this.closeButton) {
            this.addCloseAction(this.closeButton, 'click');
        }
        if (this.acceptButton) {
            this.addAcceptAction(this.acceptButton, 'click');
        }
        this.addCloseAction(this.closeCrossNode, 'click');
        // TODO: use DI always to create dialog instances
        this.toDisposeOnDetach.push(DialogOverlayService.get().push(this));
    }
    handleEscape(event) {
        this.close();
    }
    handleEnter(event) {
        if (event.target instanceof HTMLTextAreaElement) {
            return false;
        }
        this.accept();
    }
    onActivateRequest(msg) {
        super.onActivateRequest(msg);
        if (this.acceptButton) {
            this.acceptButton.focus();
        }
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        this.validate();
    }
    async validate() {
        if (!this.resolve) {
            return;
        }
        this.validateCancellationSource.cancel();
        this.validateCancellationSource = new CancellationTokenSource();
        const token = this.validateCancellationSource.token;
        const value = this.value;
        const error = await this.isValid(value, 'preview');
        if (token.isCancellationRequested) {
            return;
        }
        this.setErrorMessage(error);
    }
    async accept() {
        if (!this.resolve) {
            return;
        }
        this.acceptCancellationSource.cancel();
        this.acceptCancellationSource = new CancellationTokenSource();
        const token = this.acceptCancellationSource.token;
        const value = this.value;
        const error = await this.isValid(value, 'open');
        if (token.isCancellationRequested) {
            return;
        }
        if (!DialogError.getResult(error)) {
            this.setErrorMessage(error);
        }
        else {
            this.resolve(value);
            Widget.detach(this);
        }
    }
    /**
     * Return a string of zero-length or true if valid.
     */
    isValid(value, mode) {
        return '';
    }
    setErrorMessage(error) {
        if (this.acceptButton) {
            this.acceptButton.disabled = !DialogError.getResult(error);
        }
        this.errorMessageNode.innerText = DialogError.getMessage(error);
    }
    addCloseAction(element, ...additionalEventTypes) {
        this.addKeyListener(element, Key.ENTER, () => this.close(), ...additionalEventTypes);
    }
    addAcceptAction(element, ...additionalEventTypes) {
        this.addKeyListener(element, Key.ENTER, () => this.accept(), ...additionalEventTypes);
    }
};
AbstractDialog = __decorate([
    injectable(),
    __param(0, inject(DialogProps))
], AbstractDialog);
export { AbstractDialog };
let ConfirmDialogProps = class ConfirmDialogProps extends DialogProps {
    msg;
    cancel;
    ok;
};
ConfirmDialogProps = __decorate([
    injectable()
], ConfirmDialogProps);
export { ConfirmDialogProps };
let ConfirmDialog = class ConfirmDialog extends AbstractDialog {
    props;
    confirmed = true;
    constructor(props) {
        super(props);
        this.props = props;
        this.contentNode.appendChild(this.createMessageNode(this.props.msg));
        this.appendCloseButton(props.cancel);
        this.appendAcceptButton(props.ok);
    }
    get value() {
        return this.confirmed;
    }
    onCloseRequest(msg) {
        super.onCloseRequest(msg);
        this.confirmed = false;
        this.accept();
    }
    createMessageNode(msg) {
        if (typeof msg === 'string') {
            const messageNode = document.createElement('div');
            messageNode.textContent = msg;
            return messageNode;
        }
        return msg;
    }
};
ConfirmDialog = __decorate([
    __param(0, inject(ConfirmDialogProps))
], ConfirmDialog);
export { ConfirmDialog };
let SingleTextInputDialogProps = class SingleTextInputDialogProps extends DialogProps {
    confirmButtonLabel;
    initialValue;
    initialSelectionRange;
    validate;
};
SingleTextInputDialogProps = __decorate([
    injectable()
], SingleTextInputDialogProps);
export { SingleTextInputDialogProps };
let SingleTextInputDialog = class SingleTextInputDialog extends AbstractDialog {
    props;
    inputField;
    constructor(props) {
        super(props);
        this.props = props;
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'tart-input';
        this.inputField.spellcheck = false;
        this.inputField.setAttribute('style', 'flex: 0;');
        this.inputField.value = props.initialValue || '';
        if (props.initialSelectionRange) {
            this.inputField.setSelectionRange(props.initialSelectionRange.start, props.initialSelectionRange.end, props.initialSelectionRange.direction);
        }
        else {
            this.inputField.select();
        }
        this.contentNode.appendChild(this.inputField);
        this.appendAcceptButton(props.confirmButtonLabel);
    }
    get value() {
        return this.inputField.value;
    }
    isValid(value, mode) {
        if (this.props.validate) {
            return this.props.validate(value, mode);
        }
        return super.isValid(value, mode);
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.addUpdateListener(this.inputField, 'input');
    }
    onActivateRequest(msg) {
        this.inputField.focus();
    }
    handleEnter(event) {
        if (event.target instanceof HTMLInputElement) {
            return super.handleEnter(event);
        }
        return false;
    }
};
SingleTextInputDialog = __decorate([
    __param(0, inject(SingleTextInputDialogProps))
], SingleTextInputDialog);
export { SingleTextInputDialog };
let MessageDialogProps = class MessageDialogProps extends DialogProps {
    msg;
};
MessageDialogProps = __decorate([
    injectable()
], MessageDialogProps);
export { MessageDialogProps };
let MessageDialog = class MessageDialog extends AbstractDialog {
    props;
    constructor(props) {
        super(props);
        this.props = props;
        this.contentNode.appendChild(this.createMessageNode(this.props.msg));
        this.closeCrossNode.remove();
    }
    get value() {
        return;
    }
    createMessageNode(msg) {
        if (typeof msg === 'string') {
            const messageNode = document.createElement('div');
            messageNode.textContent = msg;
            return messageNode;
        }
        return msg;
    }
};
MessageDialog = __decorate([
    __param(0, inject(MessageDialogProps))
], MessageDialog);
export { MessageDialog };

//# sourceMappingURL=../../lib/browser/dialogs.js.map
