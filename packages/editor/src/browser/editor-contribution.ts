import {inject, injectable, optional} from 'inversify';
import {DiffUris, FrontendApplicationContribution, KeybindingContribution, KeybindingRegistry} from '@tart/core';
import {Command, CommandContribution, CommandRegistry, DisposableCollection} from '@tart/core/lib/common';
import {ContextKeyService} from '@tart/core/lib/browser/context-key-service';
import {EditorManager} from './editor-manager';
import {TextEditor} from './editor';
import {StatusBar, StatusBarAlignment} from '@tart/core/lib/browser/status-bar';
import {LanguageService} from '@tart/core/lib/browser/language-service';
import {EditorCommands} from './editor-command';
import {SUPPORTED_ENCODINGS} from '@tart/core/lib/browser/supported-encodings';
import {QuickInputService} from '@tart/core/lib/common/quick-pick-service';

export const TEST = Command.toDefaultLocalizedCommand({
  id: 'textEditor.commands.configEol',
  category: 'EDITOR_CATEGORY',
  label: 'Change End of Line Sequence'
});

@injectable()
export class EditorContribution implements FrontendApplicationContribution, KeybindingContribution, CommandContribution {

  @inject(StatusBar) protected readonly statusBar: StatusBar;
  @inject(EditorManager) protected readonly editorManager: EditorManager;
  @inject(LanguageService) protected readonly languages: LanguageService;

  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;

  @inject(QuickInputService) @optional()
  protected readonly quickInputService: QuickInputService;
  protected readonly toDisposeOnCurrentEditorChanged = new DisposableCollection();

  onStart(): void {
    this.initEditorContextKeys();

    this.updateStatusBar();
    this.editorManager.onCurrentEditorChanged(() => this.updateStatusBar());
  }

  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(EditorCommands.SHOW_ALL_OPENED_EDITORS, {
      execute: () => this.quickInputService?.open('edt ')
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry) {
    keybindings.registerKeybinding({
      command: EditorCommands.SHOW_ALL_OPENED_EDITORS.id,
      keybinding: 'ctrlcmd+k ctrlcmd+p'
    });
  }

  protected initEditorContextKeys(): void {
    const editorIsOpen = this.contextKeyService.createKey<boolean>('editorIsOpen', false);
    const textCompareEditorVisible = this.contextKeyService.createKey<boolean>('textCompareEditor', false);
    const updateContextKeys = () => {
      const widgets = this.editorManager.all;
      editorIsOpen.set(!!widgets.length);
      textCompareEditorVisible.set(widgets.some(widget => DiffUris.isDiffUri(widget.editor.uri)));
    }
    updateContextKeys();
    for (const widget of this.editorManager.all) {
      widget.disposed.connect(updateContextKeys);
    }
    this.editorManager.onCreated(widget => {
      updateContextKeys();
      widget.disposed.connect(updateContextKeys);
    });
  }

  protected updateStatusBar(): void {
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

  protected updateLanguageStatus(editor: TextEditor | undefined): void {
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

  protected updateEncodingStatus(editor: TextEditor | undefined): void {
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

  protected setCursorPositionStatus(editor: TextEditor | undefined): void {
    if (!editor) {
      this.statusBar.removeElement('editor-status-cursor-position');
      return;
    }
    const {cursor} = editor;
    this.statusBar.setElement('editor-status-cursor-position', {
      text: 'Ln {' + (cursor.line + 1) + '}, Col {' + editor.getVisibleColumn(cursor) + '}',
      alignment: StatusBarAlignment.RIGHT,
      priority: 100,
      tooltip: EditorCommands.GOTO_LINE_COLUMN.label,
      command: EditorCommands.GOTO_LINE_COLUMN.id
    });
  }
}
