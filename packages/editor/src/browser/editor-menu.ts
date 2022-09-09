import {MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MenuPath} from '@tartjs/core/lib/common';
import {injectable} from 'inversify';
import {CommonCommands, CommonMenus} from '@tartjs/core';
import {nls} from '@tartjs/core/lib/common/nls';
import {EditorCommands} from './editor-command';

export const EDITOR_CONTEXT_MENU: MenuPath = ['editor_context_menu'];

export namespace EditorContextMenu {
  export const NAVIGATION = [...EDITOR_CONTEXT_MENU, 'navigation'];
  export const MODIFICATION = [...EDITOR_CONTEXT_MENU, '1_modification'];
  export const CUT_COPY_PASTE = [...EDITOR_CONTEXT_MENU, '9_cutcopypaste'];
  export const COMMANDS = [...EDITOR_CONTEXT_MENU, 'z_commands'];
  export const UNDO_REDO = [...EDITOR_CONTEXT_MENU, '1_undo'];
}

export namespace EditorMainMenu {

  /**
   * The main `Go` menu item.
   */
  export const GO = [...MAIN_MENU_BAR, '5_go'];

  /**
   * Navigation menu group in the `Go` main-menu.
   */
  export const NAVIGATION_GROUP = [...GO, '1_navigation_group'];

  /**
   * Workspace menu group in the `Go` main-menu.
   */
  export const WORKSPACE_GROUP = [...GO, '2_workspace_group'];

  /**
   * Language features menu group in the `Go` main-menu.
   */
  export const LANGUAGE_FEATURES_GROUP = [...GO, '3_language_features_group'];

  /**
   * Location menu group in the `Go` main-menu.
   */
  export const LOCATION_GROUP = [...GO, '4_locations'];
}

@injectable()
export class EditorMenuContribution implements MenuContribution {

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(EditorContextMenu.UNDO_REDO, {
      commandId: CommonCommands.UNDO.id
    });
    registry.registerMenuAction(EditorContextMenu.UNDO_REDO, {
      commandId: CommonCommands.REDO.id
    });

    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.CUT.id,
      order: '0'
    });
    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.COPY.id,
      order: '1'
    });
    registry.registerMenuAction(EditorContextMenu.CUT_COPY_PASTE, {
      commandId: CommonCommands.PASTE.id,
      order: '2'
    });

    // Editor navigation. Go > Back and Go > Forward.
    registry.registerSubmenu(EditorMainMenu.GO, nls.localizeByDefault('Go'));
    registry.registerMenuAction(EditorMainMenu.NAVIGATION_GROUP, {
      commandId: EditorCommands.GO_BACK.id,
      label: EditorCommands.GO_BACK.label,
      order: '1'
    });
    registry.registerMenuAction(EditorMainMenu.NAVIGATION_GROUP, {
      commandId: EditorCommands.GO_FORWARD.id,
      label: EditorCommands.GO_FORWARD.label,
      order: '2'
    });
    registry.registerMenuAction(EditorMainMenu.NAVIGATION_GROUP, {
      commandId: EditorCommands.GO_LAST_EDIT.id,
      label: nls.localizeByDefault('Last Edit Location'),
      order: '3'
    });

    registry.registerMenuAction(EditorMainMenu.LOCATION_GROUP, {
      commandId: EditorCommands.GOTO_LINE_COLUMN.id,
      order: '1'
    });

    // Toggle Commands.
    registry.registerMenuAction(CommonMenus.VIEW_TOGGLE, {
      commandId: EditorCommands.TOGGLE_WORD_WRAP.id,
      label: EditorCommands.TOGGLE_WORD_WRAP.label,
      order: '0'
    });
    registry.registerMenuAction(CommonMenus.VIEW_TOGGLE, {
      commandId: EditorCommands.TOGGLE_MINIMAP.id,
      label: EditorCommands.TOGGLE_MINIMAP.label,
      order: '1',
    });
    registry.registerMenuAction(CommonMenus.VIEW_TOGGLE, {
      commandId: EditorCommands.TOGGLE_RENDER_WHITESPACE.id,
      label: EditorCommands.TOGGLE_RENDER_WHITESPACE.label,
      order: '2'
    });
    registry.registerMenuAction(CommonMenus.FILE_CLOSE, {
      commandId: CommonCommands.CLOSE_MAIN_TAB.id,
      label: nls.localizeByDefault('Close Editor'),
      order: '1'
    });
  }

}
