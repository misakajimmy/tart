import { Command } from '@tart/core/lib/common';
export declare namespace EditorCommands {
    const GOTO_LINE_COLUMN: Command;
    /**
     * Show editor references
     */
    const SHOW_REFERENCES: Command;
    /**
     * Change indentation configuration (i.e., indent using tabs / spaces, and how many spaces per tab)
     */
    const CONFIG_INDENTATION: Command;
    const CONFIG_EOL: Command;
    const INDENT_USING_SPACES: Command;
    const INDENT_USING_TABS: Command;
    const CHANGE_LANGUAGE: Command;
    const CHANGE_ENCODING: Command;
    const REVERT_EDITOR: Command;
    const REVERT_AND_CLOSE: Command;
    /**
     * Command for going back to the last editor navigation location.
     */
    const GO_BACK: Command;
    /**
     * Command for going to the forthcoming editor navigation location.
     */
    const GO_FORWARD: Command;
    /**
     * Command that reveals the last text edit location, if any.
     */
    const GO_LAST_EDIT: Command;
    /**
     * Command that clears the editor navigation history.
     */
    const CLEAR_EDITOR_HISTORY: Command;
    /**
     * Command that displays all editors that are currently opened.
     */
    const SHOW_ALL_OPENED_EDITORS: Command;
    /**
     * Command that toggles the minimap.
     */
    const TOGGLE_MINIMAP: Command;
    /**
     * Command that toggles the rendering of whitespace characters in the editor.
     */
    const TOGGLE_RENDER_WHITESPACE: Command;
    /**
     * Command that toggles the word wrap.
     */
    const TOGGLE_WORD_WRAP: Command;
    /**
     * Command that re-opens the last closed editor.
     */
    const REOPEN_CLOSED_EDITOR: Command;
    /**
     * Opens a second instance of the current editor, splitting the view in the direction specified.
     */
    const SPLIT_EDITOR_RIGHT: Command;
    const SPLIT_EDITOR_DOWN: Command;
    const SPLIT_EDITOR_UP: Command;
    const SPLIT_EDITOR_LEFT: Command;
    /**
     * Default horizontal split: right.
     */
    const SPLIT_EDITOR_HORIZONTAL: Command;
    /**
     * Default vertical split: down.
     */
    const SPLIT_EDITOR_VERTICAL: Command;
}
