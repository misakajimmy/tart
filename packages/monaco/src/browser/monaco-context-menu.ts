import {inject, injectable} from 'inversify';
import {MenuPath} from '@tart/core/lib/common/menu';
import {ContextMenuRenderer, toAnchor} from '@tart/core/lib/browser';
import {Menu} from '@lumino/widgets';
import {CommandRegistry} from '@lumino/commands';
import {EDITOR_CONTEXT_MENU} from '@tart/editor/lib';
import IContextMenuService = monaco.editor.IContextMenuService;
import IContextMenuDelegate = monaco.editor.IContextMenuDelegate;

@injectable()
export class MonacoContextMenuService implements IContextMenuService {

    constructor(@inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer) {
    }

    showContextMenu(delegate: IContextMenuDelegate): void {
        const anchor = toAnchor(delegate.getAnchor());
        const actions = delegate.getActions();

        // Actions for editor context menu come as 'MenuItemAction' items
        // In case of 'Quick Fix' actions come as 'CodeActionAction' items
        if (actions.length > 0 && actions[0] instanceof monaco.actions.MenuItemAction) {
            this.contextMenuRenderer.render({
                menuPath: this.menuPath(),
                anchor,
                onHide: () => delegate.onHide(false)
            });
        } else {
            const commands = new CommandRegistry();
            const menu = new Menu({
                commands
            });

            for (const action of actions) {
                const commandId = 'quickfix_' + actions.indexOf(action);
                commands.addCommand(commandId, {
                    label: action.label,
                    className: action.class,
                    isToggled: () => action.checked,
                    isEnabled: () => action.enabled,
                    execute: () => action.run()
                });
                menu.addItem({
                    type: 'command',
                    command: commandId
                });
            }
            menu.aboutToClose.connect(() => delegate.onHide(false));
            menu.open(anchor.x, anchor.y);
        }
    }

    protected menuPath(): MenuPath {
        return EDITOR_CONTEXT_MENU;
    }

}
