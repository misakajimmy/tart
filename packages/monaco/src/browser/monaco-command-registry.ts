import {MonacoEditor} from './monaco-editor';
import {inject, injectable} from 'inversify';
import {MonacoEditorProvider} from './monaco-editor-provider';
import {Command, CommandHandler, CommandRegistry, SelectionService} from '@tartjs/core/lib/common';
import {TextEditorSelection} from '@tartjs/editor';

export interface MonacoEditorCommandHandler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(editor: MonacoEditor, ...args: any[]): any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isEnabled?(editor: MonacoEditor, ...args: any[]): boolean;
}

@injectable()
export class MonacoCommandRegistry {

    @inject(MonacoEditorProvider)
    protected readonly monacoEditors: MonacoEditorProvider;

    @inject(CommandRegistry) protected readonly commands: CommandRegistry;

    @inject(SelectionService) protected readonly selectionService: SelectionService;

    validate(command: string): string | undefined {
        return this.commands.commandIds.indexOf(command) !== -1 ? command : undefined;
    }

    registerCommand(command: Command, handler: MonacoEditorCommandHandler): void {
        this.commands.registerCommand({
            ...command,
            id: command.id
        }, this.newHandler(handler));
    }

    registerHandler(command: string, handler: MonacoEditorCommandHandler): void {
        this.commands.registerHandler(command, this.newHandler(handler));
    }

    protected newHandler(monacoHandler: MonacoEditorCommandHandler): CommandHandler {
        return {
            execute: (...args) => this.execute(monacoHandler, ...args),
            isEnabled: (...args) => this.isEnabled(monacoHandler, ...args),
            isVisible: (...args) => this.isVisible(monacoHandler, ...args)
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected execute(monacoHandler: MonacoEditorCommandHandler, ...args: any[]): any {
        const editor = this.monacoEditors.current;
        if (editor) {
            return Promise.resolve(monacoHandler.execute(editor, ...args));
        }
        return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected isEnabled(monacoHandler: MonacoEditorCommandHandler, ...args: any[]): boolean {
        const editor = this.monacoEditors.current;
        return !!editor && (!monacoHandler.isEnabled || monacoHandler.isEnabled(editor, ...args));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected isVisible(monacoHandler: MonacoEditorCommandHandler, ...args: any[]): boolean {
        return TextEditorSelection.is(this.selectionService.selection);
    }

}
