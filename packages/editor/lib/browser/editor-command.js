import { Command } from '@tart/core/lib/common';
import { CommonCommands } from '@tart/core';
import { nls } from '@tart/core/lib/common/nls';
export var EditorCommands;
(function (EditorCommands) {
    const EDITOR_CATEGORY = 'Editor';
    const EDITOR_CATEGORY_KEY = nls.getDefaultKey(EDITOR_CATEGORY);
    EditorCommands.GOTO_LINE_COLUMN = Command.toLocalizedCommand({
        id: 'editor.action.gotoLine',
        label: 'Go to Line/Column'
    }, 'vscode/gotoLineQuickAccess/gotoLineQuickAccess');
    /**
     * Show editor references
     */
    EditorCommands.SHOW_REFERENCES = {
        id: 'textEditor.commands.showReferences'
    };
    /**
     * Change indentation configuration (i.e., indent using tabs / spaces, and how many spaces per tab)
     */
    EditorCommands.CONFIG_INDENTATION = {
        id: 'textEditor.commands.configIndentation'
    };
    EditorCommands.CONFIG_EOL = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.configEol',
        category: EDITOR_CATEGORY,
        label: 'Change End of Line Sequence'
    });
    EditorCommands.INDENT_USING_SPACES = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.indentUsingSpaces',
        category: EDITOR_CATEGORY,
        label: 'Indent Using Spaces'
    });
    EditorCommands.INDENT_USING_TABS = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.indentUsingTabs',
        category: EDITOR_CATEGORY,
        label: 'Indent Using Tabs'
    });
    EditorCommands.CHANGE_LANGUAGE = Command.toDefaultLocalizedCommand({
        id: 'textEditor.change.language',
        category: EDITOR_CATEGORY,
        label: 'Change Language Mode'
    });
    EditorCommands.CHANGE_ENCODING = Command.toDefaultLocalizedCommand({
        id: 'textEditor.change.encoding',
        category: EDITOR_CATEGORY,
        label: 'Change File Encoding'
    });
    EditorCommands.REVERT_EDITOR = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.files.revert',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Revert File',
    });
    EditorCommands.REVERT_AND_CLOSE = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.revertAndCloseActiveEditor',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Revert and Close Editor'
    });
    /**
     * Command for going back to the last editor navigation location.
     */
    EditorCommands.GO_BACK = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.go.back',
        category: EDITOR_CATEGORY,
        label: 'Go Back'
    });
    /**
     * Command for going to the forthcoming editor navigation location.
     */
    EditorCommands.GO_FORWARD = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.go.forward',
        category: EDITOR_CATEGORY,
        label: 'Go Forward'
    });
    /**
     * Command that reveals the last text edit location, if any.
     */
    EditorCommands.GO_LAST_EDIT = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.go.lastEdit',
        category: EDITOR_CATEGORY,
        label: 'Go to Last Edit Location'
    });
    /**
     * Command that clears the editor navigation history.
     */
    EditorCommands.CLEAR_EDITOR_HISTORY = Command.toDefaultLocalizedCommand({
        id: 'textEditor.commands.clear.history',
        category: EDITOR_CATEGORY,
        label: 'Clear Editor History'
    });
    /**
     * Command that displays all editors that are currently opened.
     */
    EditorCommands.SHOW_ALL_OPENED_EDITORS = Command.toLocalizedCommand({
        id: 'workbench.action.showAllEditors',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Show All Opened Editors'
    }, 'wm/editor/showAllEditors', EDITOR_CATEGORY_KEY);
    /**
     * Command that toggles the minimap.
     */
    EditorCommands.TOGGLE_MINIMAP = Command.toDefaultLocalizedCommand({
        id: 'editor.action.toggleMinimap',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Toggle Minimap'
    });
    /**
     * Command that toggles the rendering of whitespace characters in the editor.
     */
    EditorCommands.TOGGLE_RENDER_WHITESPACE = Command.toDefaultLocalizedCommand({
        id: 'editor.action.toggleRenderWhitespace',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Toggle Render Whitespace'
    });
    /**
     * Command that toggles the word wrap.
     */
    EditorCommands.TOGGLE_WORD_WRAP = Command.toDefaultLocalizedCommand({
        id: 'editor.action.toggleWordWrap',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Toggle Word Wrap'
    });
    /**
     * Command that re-opens the last closed editor.
     */
    EditorCommands.REOPEN_CLOSED_EDITOR = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.reopenClosedEditor',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Reopen Closed Editor'
    });
    /**
     * Opens a second instance of the current editor, splitting the view in the direction specified.
     */
    EditorCommands.SPLIT_EDITOR_RIGHT = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditorRight',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor Right'
    });
    EditorCommands.SPLIT_EDITOR_DOWN = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditorDown',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor Down'
    });
    EditorCommands.SPLIT_EDITOR_UP = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditorUp',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor Up'
    });
    EditorCommands.SPLIT_EDITOR_LEFT = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditorLeft',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor Left'
    });
    /**
     * Default horizontal split: right.
     */
    EditorCommands.SPLIT_EDITOR_HORIZONTAL = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditor',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor'
    });
    /**
     * Default vertical split: down.
     */
    EditorCommands.SPLIT_EDITOR_VERTICAL = Command.toDefaultLocalizedCommand({
        id: 'workbench.action.splitEditorOrthogonal',
        category: CommonCommands.VIEW_CATEGORY,
        label: 'Split Editor Orthogonal'
    });
})(EditorCommands || (EditorCommands = {}));

//# sourceMappingURL=../../lib/browser/editor-command.js.map
