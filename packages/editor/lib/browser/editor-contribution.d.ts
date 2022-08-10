import { FrontendApplicationContribution, KeybindingContribution, KeybindingRegistry } from '@tart/core';
import { Command, CommandContribution, CommandRegistry, DisposableCollection } from '@tart/core/lib/common';
import { ContextKeyService } from '@tart/core/lib/browser/context-key-service';
import { EditorManager } from './editor-manager';
import { TextEditor } from './editor';
import { StatusBar } from '@tart/core/lib/browser/status-bar';
import { LanguageService } from '@tart/core/lib/browser/language-service';
import { QuickInputService } from '@tart/core/lib/common/quick-pick-service';
export declare const TEST: Command;
export declare class EditorContribution implements FrontendApplicationContribution, KeybindingContribution, CommandContribution {
    protected readonly statusBar: StatusBar;
    protected readonly editorManager: EditorManager;
    protected readonly languages: LanguageService;
    protected readonly contextKeyService: ContextKeyService;
    protected readonly quickInputService: QuickInputService;
    protected readonly toDisposeOnCurrentEditorChanged: DisposableCollection;
    onStart(): void;
    registerCommands(commands: CommandRegistry): void;
    registerKeybindings(keybindings: KeybindingRegistry): void;
    protected initEditorContextKeys(): void;
    protected updateStatusBar(): void;
    protected updateLanguageStatus(editor: TextEditor | undefined): void;
    protected updateEncodingStatus(editor: TextEditor | undefined): void;
    protected setCursorPositionStatus(editor: TextEditor | undefined): void;
}
