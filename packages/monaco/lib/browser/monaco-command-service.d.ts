/// <reference types="@theia/monaco-editor-core/monaco" />
import { CommandRegistry } from '@tart/core/lib/common/command';
import { Disposable, DisposableCollection, Emitter } from '@tart/core/lib/common';
import ICommandEvent = monaco.commands.ICommandEvent;
import ICommandService = monaco.commands.ICommandService;
export declare const MonacoCommandServiceFactory: unique symbol;
export interface MonacoCommandServiceFactory {
    (): MonacoCommandService;
}
export declare class MonacoCommandService implements ICommandService, Disposable {
    protected readonly commandRegistry: CommandRegistry;
    protected readonly onWillExecuteCommandEmitter: Emitter<ICommandEvent>;
    protected readonly onDidExecuteCommandEmitter: Emitter<ICommandEvent>;
    protected readonly toDispose: DisposableCollection;
    protected delegate: monaco.services.StandaloneCommandService | undefined;
    protected readonly delegateListeners: DisposableCollection;
    constructor(commandRegistry: CommandRegistry);
    get onWillExecuteCommand(): monaco.IEvent<ICommandEvent>;
    get onDidExecuteCommand(): monaco.IEvent<ICommandEvent>;
    dispose(): void;
    setDelegate(delegate: monaco.services.StandaloneCommandService | undefined): void;
    executeCommand(commandId: any, ...args: any[]): Promise<any>;
    executeMonacoCommand(commandId: any, ...args: any[]): Promise<any>;
}
