import { CommandContribution, CommandRegistry } from '@tart/core/lib/common';
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoCommandRegistry, MonacoEditorCommandHandler } from './monaco-command-registry';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { QuickInputService } from '@tart/core/lib/common/quick-pick-service';
import { MonacoTextModelService } from './monaco-text-model-service';
import { ApplicationShell } from '@tart/core/lib/browser';
import { MonacoEditor } from './monaco-editor';
import { EditorManager } from '@tart/editor/lib/browser/editor-manager';
import { EditorWidget } from '@tart/editor/lib/browser/editor-widget';
export declare namespace MonacoCommands {
    const COMMON_ACTIONS: Map<string, string>;
    const GO_TO_DEFINITION = "editor.action.revealDefinition";
    const EXCLUDE_ACTIONS: Set<string>;
}
export declare class MonacoEditorCommandHandlers implements CommandContribution {
    protected readonly monacoCommandRegistry: MonacoCommandRegistry;
    protected readonly commandRegistry: CommandRegistry;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly quickInputService: QuickInputService;
    protected readonly codeEditorService: MonacoEditorService;
    protected readonly textModelService: MonacoTextModelService;
    protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService;
    protected readonly shell: ApplicationShell;
    protected editorManager: EditorManager;
    registerCommands(): void;
    /**
     * Register commands from Monaco to Wm registry.
     *
     * Monaco has different kind of commands which should be handled differently by Wm.
     *
     * ### Editor Actions
     *
     * They should be registered with a label to be visible in the quick command palette.
     *
     * Such actions should be enabled only if the current editor is available and
     * it supports such action in the current context.
     *
     * ### Editor Commands
     *
     * Such actions should be enabled only if the current editor is available.
     *
     * `actions.find` and `editor.action.startFindReplaceAction` are registered as handlers for `find` and `replace`.
     * If handlers are not enabled then the core should prevent the default browser behavior.
     * Other Wm extensions can register alternative implementations using custom enablement.
     *
     * ### Global Commands
     *
     * These commands are not necessary dependent on the current editor and enabled always.
     * But they depend on services which are global in VS Code, but bound to the editor in Monaco,
     * i.e. `ICodeEditorService` or `IContextKeyService`. We should take care of providing Wm implementations for such services.
     *
     * #### Global Native or Editor Commands
     *
     * Namely: `undo`, `redo` and `editor.action.selectAll`. They depend on `ICodeEditorService`.
     * They will try to delegate to the current editor and if it is not available delegate to the browser.
     * They are registered as handlers for corresponding core commands always.
     * Other Wm extensions can provide alternative implementations by introducing a dependency to `@wm/monaco` extension.
     *
     * #### Global Language Commands
     *
     * Like `_executeCodeActionProvider`, they depend on `ICodeEditorService` and `ITextModelService`.
     *
     * #### Global Context Commands
     *
     * It is `setContext`. It depends on `IContextKeyService`.
     *
     * #### Global Editor Commands
     *
     * Like `openReferenceToSide` and `openReference`, they depend on `IListService`.
     * We treat all commands which don't match any other category of global commands as global editor commands
     * and execute them using the instantiation service of the current editor.
     */
    protected registerMonacoCommands(): void;
    protected registerEditorCommandHandlers(): void;
    protected newShowReferenceHandler(): MonacoEditorCommandHandler;
    protected newConfigIndentationHandler(): MonacoEditorCommandHandler;
    protected configureIndentation(editor: MonacoEditor): void;
    protected newConfigEolHandler(): MonacoEditorCommandHandler;
    protected configureEol(editor: MonacoEditor): void;
    protected setEol(editor: MonacoEditor, lineEnding: string): void;
    protected newConfigTabSizeHandler(useSpaces: boolean): MonacoEditorCommandHandler;
    protected configureTabSize(editor: MonacoEditor, useSpaces: boolean): void;
    protected newRevertActiveEditorHandler(): MonacoEditorCommandHandler;
    protected newRevertAndCloseActiveEditorHandler(): MonacoEditorCommandHandler;
    protected getActiveEditor(): {
        widget?: EditorWidget;
        editor?: MonacoEditor;
    };
    protected revertEditor(editor?: MonacoEditor): Promise<void>;
    protected revertAndCloseActiveEditor(current: {
        widget?: EditorWidget;
        editor?: MonacoEditor;
    }): Promise<void>;
}
