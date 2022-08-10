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
import { Key, KeyCode, KeyModifier } from '@tart/core/lib/browser/keys';
import { isOSX } from '@tart/core/lib/common/os';
import { KEY_CODE_MAP } from './monaco-keycode-map';
export class MonacoResolvedKeybinding extends monaco.keybindings.ResolvedKeybinding {
    constructor(keySequence, keybindingService) {
        super();
        this.keySequence = keySequence;
        this.parts = keySequence.map(keyCode => {
            // eslint-disable-next-line no-null/no-null
            const keyLabel = keyCode.key ? keybindingService.acceleratorForKey(keyCode.key) : null;
            const keyAriaLabel = keyLabel;
            return new monaco.keybindings.ResolvedKeybindingPart(keyCode.ctrl, keyCode.shift, keyCode.alt, keyCode.meta, keyLabel, keyAriaLabel);
        });
    }
    static toKeybinding(keybinding) {
        return keybinding instanceof monaco.keybindings.SimpleKeybinding
            ? this.keyCode(keybinding).toString()
            : this.keySequence(keybinding).join(' ');
    }
    static keyCode(keybinding) {
        const keyCode = keybinding.keyCode;
        const sequence = {
            first: Key.getKey(this.monaco2BrowserKeyCode(keyCode & 0xff)),
            modifiers: []
        };
        if (keybinding.ctrlKey) {
            if (isOSX) {
                sequence.modifiers.push(KeyModifier.MacCtrl);
            }
            else {
                sequence.modifiers.push(KeyModifier.CtrlCmd);
            }
        }
        if (keybinding.shiftKey) {
            sequence.modifiers.push(KeyModifier.Shift);
        }
        if (keybinding.altKey) {
            sequence.modifiers.push(KeyModifier.Alt);
        }
        if (keybinding.metaKey && sequence.modifiers.indexOf(KeyModifier.CtrlCmd) === -1) {
            sequence.modifiers.push(KeyModifier.CtrlCmd);
        }
        return KeyCode.createKeyCode(sequence);
    }
    static keySequence(keybinding) {
        return keybinding.parts.map(part => this.keyCode(part));
    }
    static monaco2BrowserKeyCode(keyCode) {
        for (let i = 0; i < KEY_CODE_MAP.length; i++) {
            if (KEY_CODE_MAP[i] === keyCode) {
                return i;
            }
        }
        return -1;
    }
    getLabel() {
        return monaco.keybindings.UILabelProvider.toLabel(monaco.platform.OS, this.parts, p => p.keyLabel);
    }
    getAriaLabel() {
        return monaco.keybindings.UILabelProvider.toLabel(monaco.platform.OS, this.parts, p => p.keyAriaLabel);
    }
    getElectronAccelerator() {
        if (this.isChord()) {
            // Electron cannot handle chords
            // eslint-disable-next-line no-null/no-null
            return null;
        }
        return monaco.keybindings.ElectronAcceleratorLabelProvider.toLabel(monaco.platform.OS, this.parts, p => p.keyLabel);
    }
    getUserSettingsLabel() {
        return monaco.keybindings.UserSettingsLabelProvider.toLabel(monaco.platform.OS, this.parts, p => p.keyLabel);
    }
    isWYSIWYG() {
        return true;
    }
    isChord() {
        return this.parts.length > 1;
    }
    getDispatchParts() {
        return this.keySequence.map(keyCode => monaco.keybindings.USLayoutResolvedKeybinding.getDispatchStr(this.toKeybinding(keyCode)));
    }
    getSingleModifierDispatchParts() {
        return []; /* NOOP */
    }
    getParts() {
        return this.parts;
    }
    toKeybinding(keyCode) {
        return new monaco.keybindings.SimpleKeybinding(keyCode.ctrl, keyCode.shift, keyCode.alt, keyCode.meta, KEY_CODE_MAP[keyCode.key.keyCode]);
    }
}

//# sourceMappingURL=../../lib/browser/monaco-resolved-keybinding.js.map
