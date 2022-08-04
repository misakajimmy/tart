import { ApplicationShell } from './shell';
import { CommandRegistry, ContributionProvider, MaybePromise, MenuModelRegistry } from '../common';
import { KeybindingRegistry } from './keybinding';
import { ShellLayoutRestorer } from './shell/shell-layout-restorer';
import { FrontendApplicationStateService } from './frontend-application-state';
import { WindowService } from './window/window-service';
/**
 * Clients can implement to get a callback for contributing widgets to a shell on start.
 */
export declare const FrontendApplicationContribution: unique symbol;
export interface FrontendApplicationContribution {
    /**
     * Called on application startup before configure is called.
     */
    initialize?(): void;
    /**
     * Called before commands, key bindings and menus are initialized.
     * Should return a promise if it runs asynchronously.
     */
    configure?(app: FrontendApplication): MaybePromise<void>;
    /**
     * Called when the application is started. The application shell is not attached yet when this method runs.
     * Should return a promise if it runs asynchronously.
     */
    onStart?(app: FrontendApplication): MaybePromise<void>;
    /**
     * Called on `beforeunload` event, right before the window closes.
     * Return `true` in order to prevent exit.
     * Note: No async code allowed, this function has to run on one tick.
     */
    onWillStop?(app: FrontendApplication): boolean | void;
    /**
     * Called when an application is stopped or unloaded.
     *
     * Note that this is implemented using `window.beforeunload` which doesn't allow any asynchronous code anymore.
     * I.e. this is the last tick.
     */
    onStop?(app: FrontendApplication): void;
    /**
     * Called after the application shell has been attached in case there is no previous workbench layout state.
     * Should return a promise if it runs asynchronously.
     */
    initializeLayout?(app: FrontendApplication): MaybePromise<void>;
    /**
     * An event is emitted when a layout is initialized, but before the shell is attached.
     */
    onDidInitializeLayout?(app: FrontendApplication): MaybePromise<void>;
}
export interface IFrontendApplicationStartProps {
    host: HTMLElement;
}
export declare class FrontendApplication {
    protected readonly commands: CommandRegistry;
    protected readonly menus: MenuModelRegistry;
    protected readonly keybindings: KeybindingRegistry;
    protected readonly layoutRestorer: ShellLayoutRestorer;
    protected readonly contributions: ContributionProvider<FrontendApplicationContribution>;
    protected readonly _shell: ApplicationShell;
    protected readonly stateService: FrontendApplicationStateService;
    protected readonly windowsService: WindowService;
    protected inComposition: boolean;
    constructor(commands: CommandRegistry, menus: MenuModelRegistry, keybindings: KeybindingRegistry, layoutRestorer: ShellLayoutRestorer, contributions: ContributionProvider<FrontendApplicationContribution>, _shell: ApplicationShell, stateService: FrontendApplicationStateService);
    get shell(): ApplicationShell;
    /**
     * Start the frontend application.
     *
     * Start up consists of the following steps:
     * - start frontend contributions
     * - attach the application shell to the host element
     * - initialize the application shell layout
     * - reveal the application shell if it was hidden by a startup indicator
     */
    start(props: IFrontendApplicationStartProps): Promise<void>;
    /**
     * Attach the application shell to the host element. If a startup indicator is present, the shell is
     * inserted before that indicator so it is not visible yet.
     */
    protected attachShell(host: HTMLElement): void;
    /**
     * Initialize the shell layout either using the layout restorer service or, if no layout has
     * been stored, by creating the default layout.
     */
    protected initializeLayout(): Promise<void>;
    /**
     * Let the frontend application contributions initialize the shell layout. Override this
     * method in order to create an application-specific custom layout.
     */
    protected createDefaultLayout(): Promise<void>;
    /**
     * Try to restore the shell layout from the storage service. Resolves to `true` if successful.
     */
    protected restoreLayout(): Promise<boolean>;
    /**
     * Initialize and start the frontend application contributions.
     */
    protected startContributions(): Promise<void>;
    protected measure<T>(name: string, fn: () => MaybePromise<T>): Promise<T>;
    protected fireOnDidInitializeLayout(): Promise<void>;
    /**
     * Stop the frontend application contributions. This is called when the window is unloaded.
     */
    protected stopContributions(): void;
    /**
     * Register global event listeners.
     */
    protected registerEventListeners(): void;
}
export default FrontendApplication;
