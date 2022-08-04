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
import { Key } from './keyboard/keys';
import { AbstractDialog } from './dialogs';
import { waitForClosed } from './widgets';
export var Saveable;
(function (Saveable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isSource(arg) {
        return !!arg && ('saveable' in arg) && is(arg.saveable);
    }
    Saveable.isSource = isSource;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && ('dirty' in arg) && ('onDirtyChanged' in arg);
    }
    Saveable.is = is;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function get(arg) {
        if (is(arg)) {
            return arg;
        }
        if (isSource(arg)) {
            return arg.saveable;
        }
        return undefined;
    }
    Saveable.get = get;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getDirty(arg) {
        const saveable = get(arg);
        if (saveable && saveable.dirty) {
            return saveable;
        }
        return undefined;
    }
    Saveable.getDirty = getDirty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isDirty(arg) {
        return !!getDirty(arg);
    }
    Saveable.isDirty = isDirty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function save(arg, options) {
        const saveable = get(arg);
        if (saveable) {
            await saveable.save(options);
        }
    }
    Saveable.save = save;
    function apply(widget) {
        if (SaveableWidget.is(widget)) {
            return widget;
        }
        const saveable = Saveable.get(widget);
        if (!saveable) {
            return undefined;
        }
        setDirty(widget, saveable.dirty);
        saveable.onDirtyChanged(() => setDirty(widget, saveable.dirty));
        const closeWidget = widget.close.bind(widget);
        const closeWithoutSaving = async () => {
            if (saveable.dirty && saveable.revert) {
                await saveable.revert();
            }
            closeWidget();
            return waitForClosed(widget);
        };
        let closing = false;
        const closeWithSaving = async (options) => {
            if (closing) {
                return;
            }
            closing = true;
            try {
                const result = await shouldSave(saveable, () => {
                    if (options && options.shouldSave) {
                        return options.shouldSave();
                    }
                    return new ShouldSaveDialog(widget).open();
                });
                if (typeof result === 'boolean') {
                    if (result) {
                        await Saveable.save(widget);
                    }
                    await closeWithoutSaving();
                }
            }
            finally {
                closing = false;
            }
        };
        return Object.assign(widget, {
            closeWithoutSaving,
            closeWithSaving,
            close: () => closeWithSaving()
        });
    }
    Saveable.apply = apply;
    async function shouldSave(saveable, cb) {
        if (!saveable.dirty) {
            return false;
        }
        if (saveable.autoSave === 'on') {
            return true;
        }
        return cb();
    }
    Saveable.shouldSave = shouldSave;
})(Saveable || (Saveable = {}));
export var SaveableWidget;
(function (SaveableWidget) {
    function is(widget) {
        return !!widget && 'closeWithoutSaving' in widget;
    }
    SaveableWidget.is = is;
    function getDirty(widgets) {
        return get(widgets, Saveable.isDirty);
    }
    SaveableWidget.getDirty = getDirty;
    function* get(widgets, filter = () => true) {
        for (const widget of widgets) {
            if (SaveableWidget.is(widget) && filter(widget)) {
                yield widget;
            }
        }
    }
    SaveableWidget.get = get;
})(SaveableWidget || (SaveableWidget = {}));
/**
 * The class name added to the dirty widget's title.
 */
const DIRTY_CLASS = 'tart-mod-dirty';
export function setDirty(widget, dirty) {
    const dirtyClass = ` ${DIRTY_CLASS}`;
    widget.title.className = widget.title.className.replace(dirtyClass, '');
    if (dirty) {
        widget.title.className += dirtyClass;
    }
}
export class ShouldSaveDialog extends AbstractDialog {
    shouldSave = true;
    dontSaveButton;
    constructor(widget) {
        super({
            title: `Do you want to save the changes you made to ${widget.title.label || widget.title.caption}?`
        });
        const messageNode = document.createElement('div');
        messageNode.textContent = "Your changes will be lost if you don't save them.";
        messageNode.setAttribute('style', 'flex: 1 100%; padding-bottom: calc(var(--tart-ui-padding)*3);');
        this.contentNode.appendChild(messageNode);
        this.dontSaveButton = this.appendDontSaveButton();
        this.appendCloseButton();
        this.appendAcceptButton('Save');
    }
    get value() {
        return this.shouldSave;
    }
    appendDontSaveButton() {
        const button = this.createButton("Don't save");
        this.controlPanel.appendChild(button);
        button.classList.add('secondary');
        return button;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        this.addKeyListener(this.dontSaveButton, Key.ENTER, () => {
            this.shouldSave = false;
            this.accept();
        }, 'click');
    }
}

//# sourceMappingURL=../../lib/browser/saveable.js.map
