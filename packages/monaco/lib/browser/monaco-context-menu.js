var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'inversify';
import { ContextMenuRenderer, toAnchor } from '@tart/core/lib/browser';
import { Menu } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { EDITOR_CONTEXT_MENU } from '@tart/editor/lib';
let MonacoContextMenuService = class MonacoContextMenuService {
    constructor(contextMenuRenderer) {
        this.contextMenuRenderer = contextMenuRenderer;
    }
    showContextMenu(delegate) {
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
        }
        else {
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
    menuPath() {
        return EDITOR_CONTEXT_MENU;
    }
};
MonacoContextMenuService = __decorate([
    injectable(),
    __param(0, inject(ContextMenuRenderer))
], MonacoContextMenuService);
export { MonacoContextMenuService };

//# sourceMappingURL=../../lib/browser/monaco-context-menu.js.map
