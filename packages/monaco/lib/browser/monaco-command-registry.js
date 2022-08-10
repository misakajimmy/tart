var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { MonacoEditorProvider } from './monaco-editor-provider';
import { CommandRegistry, SelectionService } from '@tart/core/lib/common';
import { TextEditorSelection } from '@tart/editor';
let MonacoCommandRegistry = class MonacoCommandRegistry {
    validate(command) {
        return this.commands.commandIds.indexOf(command) !== -1 ? command : undefined;
    }
    registerCommand(command, handler) {
        this.commands.registerCommand(Object.assign(Object.assign({}, command), { id: command.id }), this.newHandler(handler));
    }
    registerHandler(command, handler) {
        this.commands.registerHandler(command, this.newHandler(handler));
    }
    newHandler(monacoHandler) {
        return {
            execute: (...args) => this.execute(monacoHandler, ...args),
            isEnabled: (...args) => this.isEnabled(monacoHandler, ...args),
            isVisible: (...args) => this.isVisible(monacoHandler, ...args)
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(monacoHandler, ...args) {
        const editor = this.monacoEditors.current;
        if (editor) {
            return Promise.resolve(monacoHandler.execute(editor, ...args));
        }
        return Promise.resolve();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isEnabled(monacoHandler, ...args) {
        const editor = this.monacoEditors.current;
        return !!editor && (!monacoHandler.isEnabled || monacoHandler.isEnabled(editor, ...args));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isVisible(monacoHandler, ...args) {
        return TextEditorSelection.is(this.selectionService.selection);
    }
};
__decorate([
    inject(MonacoEditorProvider)
], MonacoCommandRegistry.prototype, "monacoEditors", void 0);
__decorate([
    inject(CommandRegistry)
], MonacoCommandRegistry.prototype, "commands", void 0);
__decorate([
    inject(SelectionService)
], MonacoCommandRegistry.prototype, "selectionService", void 0);
MonacoCommandRegistry = __decorate([
    injectable()
], MonacoCommandRegistry);
export { MonacoCommandRegistry };

//# sourceMappingURL=../../lib/browser/monaco-command-registry.js.map
