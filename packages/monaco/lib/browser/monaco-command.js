var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, optional } from 'inversify';
import { CommandRegistry } from '@tart/core/lib/common';
import { MonacoEditorService } from './monaco-editor-service';
import { CommonCommands } from '@tart/core';
import { MonacoCommandRegistry } from './monaco-command-registry';
import { ProtocolToMonacoConverter } from './protocol-to-monaco-converter';
import { QuickInputService } from '@tart/core/lib/common/quick-pick-service';
import { MonacoTextModelService } from './monaco-text-model-service';
import { ApplicationShell } from '@tart/core/lib/browser';
import { MonacoEditor } from './monaco-editor';
import { nls } from '@tart/core/lib/common/nls';
import { EditorManager } from '@tart/editor/lib/browser/editor-manager';
import { EditorCommands } from '@tart/editor/lib/browser/editor-command';
export var MonacoCommands;
(function (MonacoCommands) {
    MonacoCommands.COMMON_ACTIONS = new Map([
        ['undo', CommonCommands.UNDO.id],
        ['redo', CommonCommands.REDO.id],
        ['editor.action.selectAll', CommonCommands.SELECT_ALL.id],
        ['actions.find', CommonCommands.FIND.id],
        ['editor.action.startFindReplaceAction', CommonCommands.REPLACE.id]
    ]);
    MonacoCommands.GO_TO_DEFINITION = 'editor.action.revealDefinition';
    MonacoCommands.EXCLUDE_ACTIONS = new Set([
        'editor.action.quickCommand',
        'editor.action.clipboardCutAction',
        'editor.action.clipboardCopyAction',
        'editor.action.clipboardPasteAction'
    ]);
})(MonacoCommands || (MonacoCommands = {}));
let MonacoEditorCommandHandlers = class MonacoEditorCommandHandlers {
    registerCommands() {
        this.registerMonacoCommands();
        this.registerEditorCommandHandlers();
    }
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
    registerMonacoCommands() {
        const editorRegistry = monaco.editorExtensions.EditorExtensionsRegistry;
        const editorActions = new Map(editorRegistry.getEditorActions().map(({ id, label }) => [id, label]));
        const { codeEditorService, textModelService, contextKeyService } = this;
        const [, globalInstantiationService] = monaco.services.StaticServices.init({
            codeEditorService,
            textModelService,
            contextKeyService
        });
        const monacoCommands = monaco.commands.CommandsRegistry.getCommands();
        for (const id of monacoCommands.keys()) {
            if (MonacoCommands.EXCLUDE_ACTIONS.has(id)) {
                continue;
            }
            const handler = {
                execute: (...args) => {
                    /*
                     * We check monaco focused code editor first since they can contain inline like the debug console and embedded editors like in the peek reference.
                     * If there is not such then we check last focused editor tracked by us.
                     */
                    const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
                    if (editorActions.has(id)) {
                        const action = editor && editor.getAction(id);
                        if (!action) {
                            return;
                        }
                        return action.run();
                    }
                    const editorCommand = !!editorRegistry.getEditorCommand(id) ||
                        !(id.startsWith('_execute') || id === 'setContext' || MonacoCommands.COMMON_ACTIONS.has(id));
                    const instantiationService = editorCommand ? editor && editor['_instantiationService'] : globalInstantiationService;
                    if (!instantiationService) {
                        return;
                    }
                    return instantiationService.invokeFunction(monacoCommands.get(id).handler, ...args);
                },
                isEnabled: () => {
                    const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
                    if (editorActions.has(id)) {
                        const action = editor && editor.getAction(id);
                        return !!action && action.isSupported();
                    }
                    if (!!editorRegistry.getEditorCommand(id)) {
                        return !!editor;
                    }
                    return true;
                }
            };
            const label = editorActions.get(id);
            this.commandRegistry.registerCommand({ id, label }, handler);
            const coreCommand = MonacoCommands.COMMON_ACTIONS.get(id);
            if (coreCommand) {
                this.commandRegistry.registerHandler(coreCommand, handler);
            }
        }
    }
    registerEditorCommandHandlers() {
        this.monacoCommandRegistry.registerHandler(EditorCommands.SHOW_REFERENCES.id, this.newShowReferenceHandler());
        this.monacoCommandRegistry.registerHandler(EditorCommands.CONFIG_INDENTATION.id, this.newConfigIndentationHandler());
        this.monacoCommandRegistry.registerHandler(EditorCommands.CONFIG_EOL.id, this.newConfigEolHandler());
        this.monacoCommandRegistry.registerHandler(EditorCommands.INDENT_USING_SPACES.id, this.newConfigTabSizeHandler(true));
        this.monacoCommandRegistry.registerHandler(EditorCommands.INDENT_USING_TABS.id, this.newConfigTabSizeHandler(false));
        this.monacoCommandRegistry.registerHandler(EditorCommands.REVERT_EDITOR.id, this.newRevertActiveEditorHandler());
        this.monacoCommandRegistry.registerHandler(EditorCommands.REVERT_AND_CLOSE.id, this.newRevertAndCloseActiveEditorHandler());
    }
    newShowReferenceHandler() {
        return {
            execute: (editor, uri, position, locations) => {
                editor.commandService.executeCommand('editor.action.showReferences', monaco.Uri.parse(uri), this.p2m.asPosition(position), locations.map(l => this.p2m.asLocation(l)));
            }
        };
    }
    newConfigIndentationHandler() {
        return {
            execute: editor => this.configureIndentation(editor)
        };
    }
    configureIndentation(editor) {
        var _a;
        const items = [true, false].map(useSpaces => ({
            label: nls.localize(`vscode/indentation/indentUsing${useSpaces ? 'Spaces' : 'Tabs'}`, `Indent Using ${useSpaces ? 'Spaces' : 'Tabs'}`),
            execute: () => this.configureTabSize(editor, useSpaces)
        }));
        (_a = this.quickInputService) === null || _a === void 0 ? void 0 : _a.showQuickPick(items, { placeholder: nls.localizeByDefault('Select Action') });
    }
    newConfigEolHandler() {
        return {
            execute: editor => this.configureEol(editor)
        };
    }
    configureEol(editor) {
        var _a;
        const items = ['LF', 'CRLF'].map(lineEnding => ({
            label: lineEnding,
            execute: () => this.setEol(editor, lineEnding)
        }));
        (_a = this.quickInputService) === null || _a === void 0 ? void 0 : _a.showQuickPick(items, { placeholder: nls.localizeByDefault('Select End of Line Sequence') });
    }
    setEol(editor, lineEnding) {
        const model = editor.document && editor.document.textEditorModel;
        if (model) {
            if (lineEnding === 'CRLF' || lineEnding === '\r\n') {
                model.pushEOL(monaco.editor.EndOfLineSequence.CRLF);
            }
            else {
                model.pushEOL(monaco.editor.EndOfLineSequence.LF);
            }
        }
    }
    newConfigTabSizeHandler(useSpaces) {
        return {
            execute: editor => this.configureTabSize(editor, useSpaces)
        };
    }
    configureTabSize(editor, useSpaces) {
        var _a;
        const model = editor.document && editor.document.textEditorModel;
        if (model) {
            const { tabSize } = model.getOptions();
            const sizes = Array.from(Array(8), (_, x) => x + 1);
            const tabSizeOptions = sizes.map(size => ({
                label: size === tabSize ? size + '   ' + nls.localizeByDefault('Configured Tab Size') : size.toString(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                execute: () => model.updateOptions({
                    tabSize: size || tabSize,
                    insertSpaces: useSpaces
                })
            }));
            (_a = this.quickInputService) === null || _a === void 0 ? void 0 : _a.showQuickPick(tabSizeOptions, { placeholder: nls.localizeByDefault('Select Tab Size for Current File') });
        }
    }
    newRevertActiveEditorHandler() {
        return {
            execute: () => this.revertEditor(this.getActiveEditor().editor),
        };
    }
    newRevertAndCloseActiveEditorHandler() {
        return {
            execute: async () => this.revertAndCloseActiveEditor(this.getActiveEditor())
        };
    }
    getActiveEditor() {
        const widget = this.editorManager.currentEditor;
        return { widget, editor: widget && MonacoEditor.getCurrent(this.editorManager) };
    }
    async revertEditor(editor) {
        if (editor) {
            return editor.document.revert();
        }
    }
    async revertAndCloseActiveEditor(current) {
        if (current.editor && current.widget) {
            try {
                await this.revertEditor(current.editor);
                current.widget.close();
            }
            catch (error) {
                await this.shell.closeWidget(current.widget.id, { save: false });
            }
        }
    }
};
__decorate([
    inject(MonacoCommandRegistry)
], MonacoEditorCommandHandlers.prototype, "monacoCommandRegistry", void 0);
__decorate([
    inject(CommandRegistry)
], MonacoEditorCommandHandlers.prototype, "commandRegistry", void 0);
__decorate([
    inject(ProtocolToMonacoConverter)
], MonacoEditorCommandHandlers.prototype, "p2m", void 0);
__decorate([
    inject(QuickInputService),
    optional()
], MonacoEditorCommandHandlers.prototype, "quickInputService", void 0);
__decorate([
    inject(MonacoEditorService)
], MonacoEditorCommandHandlers.prototype, "codeEditorService", void 0);
__decorate([
    inject(MonacoTextModelService)
], MonacoEditorCommandHandlers.prototype, "textModelService", void 0);
__decorate([
    inject(monaco.contextKeyService.ContextKeyService)
], MonacoEditorCommandHandlers.prototype, "contextKeyService", void 0);
__decorate([
    inject(ApplicationShell)
], MonacoEditorCommandHandlers.prototype, "shell", void 0);
__decorate([
    inject(EditorManager)
], MonacoEditorCommandHandlers.prototype, "editorManager", void 0);
MonacoEditorCommandHandlers = __decorate([
    injectable()
], MonacoEditorCommandHandlers);
export { MonacoEditorCommandHandlers };

//# sourceMappingURL=../../lib/browser/monaco-command.js.map
