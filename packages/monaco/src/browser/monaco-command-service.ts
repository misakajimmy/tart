import {inject, injectable} from 'inversify';
import {CommandRegistry} from '@tartjs/core/lib/common/command';
import {Disposable, DisposableCollection, Emitter} from '@tartjs/core/lib/common';
import ICommandEvent = monaco.commands.ICommandEvent;
import ICommandService = monaco.commands.ICommandService;

export const MonacoCommandServiceFactory = Symbol('MonacoCommandServiceFactory');

export interface MonacoCommandServiceFactory {
    (): MonacoCommandService;
}

@injectable()
export class MonacoCommandService implements ICommandService, Disposable {

    protected readonly onWillExecuteCommandEmitter = new Emitter<ICommandEvent>();
    protected readonly onDidExecuteCommandEmitter = new Emitter<ICommandEvent>();
    protected readonly toDispose = new DisposableCollection(
        this.onWillExecuteCommandEmitter,
        this.onDidExecuteCommandEmitter
    );

    protected delegate: monaco.services.StandaloneCommandService | undefined;
    protected readonly delegateListeners = new DisposableCollection();

    constructor(
        @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry
    ) {
        this.toDispose.push(this.commandRegistry.onWillExecuteCommand(e => this.onWillExecuteCommandEmitter.fire(e)));
        this.toDispose.push(this.commandRegistry.onDidExecuteCommand(e => this.onDidExecuteCommandEmitter.fire(e)));
    }

    get onWillExecuteCommand(): monaco.IEvent<ICommandEvent> {
        return this.onWillExecuteCommandEmitter.event;
    }

    get onDidExecuteCommand(): monaco.IEvent<ICommandEvent> {
        return this.onDidExecuteCommandEmitter.event;
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    setDelegate(delegate: monaco.services.StandaloneCommandService | undefined): void {
        if (this.toDispose.disposed) {
            return;
        }
        this.delegateListeners.dispose();
        this.toDispose.push(this.delegateListeners);
        this.delegate = delegate;
        if (this.delegate) {
            this.delegateListeners.push(this.delegate['_onWillExecuteCommand'].event(event =>
                this.onWillExecuteCommandEmitter.fire(event)
            ));
            this.delegateListeners.push(this.delegate['_onDidExecuteCommand'].event(event =>
                this.onDidExecuteCommandEmitter.fire(event)
            ));
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeCommand(commandId: any, ...args: any[]): Promise<any> {
        try {
            await this.commandRegistry.executeCommand(commandId, ...args);
        } catch (e) {
            if (e.code === 'NO_ACTIVE_HANDLER') {
                return this.executeMonacoCommand(commandId, ...args);
            }
            throw e;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeMonacoCommand(commandId: any, ...args: any[]): Promise<any> {
        if (this.delegate) {
            return this.delegate.executeCommand(commandId, ...args);
        }
        throw new Error(`command '${commandId}' not found`);
    }

}
