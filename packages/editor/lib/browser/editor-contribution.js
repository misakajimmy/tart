var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, optional } from 'inversify';
import { DiffUris } from '@tart/core';
import { Command, DisposableCollection } from '@tart/core/lib/common';
import { ContextKeyService } from '@tart/core/lib/browser/context-key-service';
import { EditorManager } from './editor-manager';
import { StatusBar, StatusBarAlignment } from '@tart/core/lib/browser/status-bar';
import { LanguageService } from '@tart/core/lib/browser/language-service';
import { EditorCommands } from './editor-command';
import { SUPPORTED_ENCODINGS } from '@tart/core/lib/browser/supported-encodings';
import { QuickInputService } from '@tart/core/lib/common/quick-pick-service';
export const TEST = Command.toDefaultLocalizedCommand({
    id: 'textEditor.commands.configEol',
    category: 'EDITOR_CATEGORY',
    label: 'Change End of Line Sequence'
});
let EditorContribution = class EditorContribution {
    constructor() {
        this.toDisposeOnCurrentEditorChanged = new DisposableCollection();
    }
    onStart() {
        this.initEditorContextKeys();
        this.updateStatusBar();
        this.editorManager.onCurrentEditorChanged(() => this.updateStatusBar());
    }
    registerCommands(commands) {
        commands.registerCommand(EditorCommands.SHOW_ALL_OPENED_EDITORS, {
            execute: () => { var _a; return (_a = this.quickInputService) === null || _a === void 0 ? void 0 : _a.open('edt '); }
        });
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: EditorCommands.SHOW_ALL_OPENED_EDITORS.id,
            keybinding: 'ctrlcmd+k ctrlcmd+p'
        });
    }
    initEditorContextKeys() {
        const editorIsOpen = this.contextKeyService.createKey('editorIsOpen', false);
        const textCompareEditorVisible = this.contextKeyService.createKey('textCompareEditor', false);
        const updateContextKeys = () => {
            const widgets = this.editorManager.all;
            editorIsOpen.set(!!widgets.length);
            textCompareEditorVisible.set(widgets.some(widget => DiffUris.isDiffUri(widget.editor.uri)));
        };
        updateContextKeys();
        for (const widget of this.editorManager.all) {
            widget.disposed.connect(updateContextKeys);
        }
        this.editorManager.onCreated(widget => {
            updateContextKeys();
            widget.disposed.connect(updateContextKeys);
        });
    }
    updateStatusBar() {
        this.toDisposeOnCurrentEditorChanged.dispose();
        const widget = this.editorManager.currentEditor;
        const editor = widget && widget.editor;
        this.updateLanguageStatus(editor);
        this.updateEncodingStatus(editor);
        this.setCursorPositionStatus(editor);
        if (editor) {
            this.toDisposeOnCurrentEditorChanged.pushAll([
                editor.onLanguageChanged(() => this.updateLanguageStatus(editor)),
                editor.onEncodingChanged(() => this.updateEncodingStatus(editor)),
                editor.onEncodingChanged(() => this.setCursorPositionStatus(editor)),
            ]);
        }
    }
    updateLanguageStatus(editor) {
        if (!editor) {
            this.statusBar.removeElement('editor-status-language');
            return;
        }
        const language = this.languages.getLanguage(editor.document.languageId);
        const languageName = language ? language.name : '';
        this.statusBar.setElement('editor-status-language', {
            text: languageName,
            alignment: StatusBarAlignment.RIGHT,
            priority: 1,
            command: EditorCommands.CHANGE_LANGUAGE.id,
            tooltip: 'Select Language Mode'
        });
    }
    updateEncodingStatus(editor) {
        if (!editor) {
            this.statusBar.removeElement('editor-status-encoding');
            return;
        }
        this.statusBar.setElement('editor-status-encoding', {
            text: SUPPORTED_ENCODINGS[editor.getEncoding()].labelShort,
            alignment: StatusBarAlignment.RIGHT,
            priority: 10,
            command: EditorCommands.CHANGE_ENCODING.id,
            tooltip: 'Select Encoding'
        });
    }
    setCursorPositionStatus(editor) {
        if (!editor) {
            this.statusBar.removeElement('editor-status-cursor-position');
            return;
        }
        const { cursor } = editor;
        this.statusBar.setElement('editor-status-cursor-position', {
            text: 'Ln {' + (cursor.line + 1) + '}, Col {' + editor.getVisibleColumn(cursor) + '}',
            alignment: StatusBarAlignment.RIGHT,
            priority: 100,
            tooltip: EditorCommands.GOTO_LINE_COLUMN.label,
            command: EditorCommands.GOTO_LINE_COLUMN.id
        });
    }
};
__decorate([
    inject(StatusBar)
], EditorContribution.prototype, "statusBar", void 0);
__decorate([
    inject(EditorManager)
], EditorContribution.prototype, "editorManager", void 0);
__decorate([
    inject(LanguageService)
], EditorContribution.prototype, "languages", void 0);
__decorate([
    inject(ContextKeyService)
], EditorContribution.prototype, "contextKeyService", void 0);
__decorate([
    inject(QuickInputService),
    optional()
], EditorContribution.prototype, "quickInputService", void 0);
EditorContribution = __decorate([
    injectable()
], EditorContribution);
export { EditorContribution };

//# sourceMappingURL=../../lib/browser/editor-contribution.js.map
