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
import { CommandRegistry } from '@tart/core/lib/common/command';
import { DisposableCollection, Emitter } from '@tart/core/lib/common';
export const MonacoCommandServiceFactory = Symbol('MonacoCommandServiceFactory');
let MonacoCommandService = class MonacoCommandService {
    constructor(commandRegistry) {
        this.commandRegistry = commandRegistry;
        this.onWillExecuteCommandEmitter = new Emitter();
        this.onDidExecuteCommandEmitter = new Emitter();
        this.toDispose = new DisposableCollection(this.onWillExecuteCommandEmitter, this.onDidExecuteCommandEmitter);
        this.delegateListeners = new DisposableCollection();
        this.toDispose.push(this.commandRegistry.onWillExecuteCommand(e => this.onWillExecuteCommandEmitter.fire(e)));
        this.toDispose.push(this.commandRegistry.onDidExecuteCommand(e => this.onDidExecuteCommandEmitter.fire(e)));
    }
    get onWillExecuteCommand() {
        return this.onWillExecuteCommandEmitter.event;
    }
    get onDidExecuteCommand() {
        return this.onDidExecuteCommandEmitter.event;
    }
    dispose() {
        this.toDispose.dispose();
    }
    setDelegate(delegate) {
        if (this.toDispose.disposed) {
            return;
        }
        this.delegateListeners.dispose();
        this.toDispose.push(this.delegateListeners);
        this.delegate = delegate;
        if (this.delegate) {
            this.delegateListeners.push(this.delegate['_onWillExecuteCommand'].event(event => this.onWillExecuteCommandEmitter.fire(event)));
            this.delegateListeners.push(this.delegate['_onDidExecuteCommand'].event(event => this.onDidExecuteCommandEmitter.fire(event)));
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeCommand(commandId, ...args) {
        try {
            await this.commandRegistry.executeCommand(commandId, ...args);
        }
        catch (e) {
            if (e.code === 'NO_ACTIVE_HANDLER') {
                return this.executeMonacoCommand(commandId, ...args);
            }
            throw e;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeMonacoCommand(commandId, ...args) {
        if (this.delegate) {
            return this.delegate.executeCommand(commandId, ...args);
        }
        throw new Error(`command '${commandId}' not found`);
    }
};
MonacoCommandService = __decorate([
    injectable(),
    __param(0, inject(CommandRegistry))
], MonacoCommandService);
export { MonacoCommandService };

//# sourceMappingURL=../../lib/browser/monaco-command-service.js.map
