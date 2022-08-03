import {inject, injectable, named} from 'inversify';
import {ApplicationShell} from './shell';
import {Widget} from '@lumino/widgets';
import {CommandRegistry, ContributionProvider, MaybePromise, MenuModelRegistry,} from '../common';
import {KeybindingRegistry} from './keybinding';
import {ApplicationShellLayoutMigrationError, ShellLayoutRestorer} from './shell/shell-layout-restorer';
import {FrontendApplicationStateService} from './frontend-application-state';
import {WindowService} from './window/window-service';

/**
 * Clients can implement to get a callback for contributing widgets to a shell on start.
 */
export const FrontendApplicationContribution = Symbol('FrontendApplicationContribution');

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

const TIMER_WARNING_THRESHOLD = 100;

export interface IFrontendApplicationStartProps {
  host: HTMLElement;
}

@injectable()
export class FrontendApplication {

  @inject(WindowService)
  protected readonly windowsService: WindowService;
  protected inComposition = false;

  constructor(
      @inject(CommandRegistry) protected readonly commands: CommandRegistry,
      @inject(MenuModelRegistry) protected readonly menus: MenuModelRegistry,
      @inject(KeybindingRegistry) protected readonly keybindings: KeybindingRegistry,
      @inject(ShellLayoutRestorer) protected readonly layoutRestorer: ShellLayoutRestorer,
      @inject(ContributionProvider) @named(FrontendApplicationContribution)
      protected readonly contributions: ContributionProvider<FrontendApplicationContribution>,
      @inject(ApplicationShell) protected readonly _shell: ApplicationShell,
      @inject(FrontendApplicationStateService) protected readonly stateService: FrontendApplicationStateService,
  ) {
  }

  get shell(): ApplicationShell {
    return this._shell;
  }

  /**
   * Start the frontend application.
   *
   * Start up consists of the following steps:
   * - start frontend contributions
   * - attach the application shell to the host element
   * - initialize the application shell layout
   * - reveal the application shell if it was hidden by a startup indicator
   */
  async start(props: IFrontendApplicationStartProps): Promise<void> {
    await this.startContributions();
    this.stateService.state = 'started_contributions';

    const {host} = props;
    this.attachShell(host);
    this.stateService.state = 'attached_shell';

    await this.initializeLayout();
    this.stateService.state = 'initialized_layout';
    await this.fireOnDidInitializeLayout();

    this.registerEventListeners();
    this.stateService.state = 'ready';
  }

  /**
   * Attach the application shell to the host element. If a startup indicator is present, the shell is
   * inserted before that indicator so it is not visible yet.
   */
  protected attachShell(host: HTMLElement): void {
    Widget.attach(this.shell, host);
  }

  /**
   * Initialize the shell layout either using the layout restorer service or, if no layout has
   * been stored, by creating the default layout.
   */
  protected async initializeLayout(): Promise<void> {
    if (!await this.restoreLayout()) {
      // Fallback: Create the default shell layout
      await this.createDefaultLayout();
    }
    await this.shell.pendingUpdates;
  }

  /**
   * Let the frontend application contributions initialize the shell layout. Override this
   * method in order to create an application-specific custom layout.
   */
  protected async createDefaultLayout(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initializeLayout) {
        await this.measure(contribution.constructor.name + '.initializeLayout',
            () => contribution.initializeLayout!(this)
        );
      }
    }
  }

  /**
   * Try to restore the shell layout from the storage service. Resolves to `true` if successful.
   */
  protected async restoreLayout(): Promise<boolean> {
    try {
      return await this.layoutRestorer.restoreLayout(this);
    } catch (error) {
      if (ApplicationShellLayoutMigrationError.is(error)) {
        console.warn(error.message);
        console.info('Initializing the default layout instead...');
      } else {
        console.error('Could not restore layout', error);
      }
      return false;
    }
  }

  /**
   * Initialize and start the frontend application contributions.
   */
  protected async startContributions(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initialize) {
        try {
          await this.measure(contribution.constructor.name + '.initialize',
              () => contribution.initialize!()
          );
        } catch (error) {
          console.error('Could not initialize contribution', error);
        }
      }
    }

    for (const contribution of this.contributions.getContributions()) {
      if (contribution.configure) {
        try {
          await this.measure(contribution.constructor.name + '.configure',
              () => contribution.configure!(this)
          );
        } catch (error) {
          console.error('Could not configure contribution', error);
        }
      }
    }

    /**
     * FIXME:
     * - decouple commands & menus
     * - consider treat commands, keybindings and menus as frontend application contributions
     */
    await this.measure('commands.onStart',
        () => this.commands.onStart()
    );
    await this.measure('keybindings.onStart',
        () => this.keybindings.onStart()
    );
    await this.measure('menus.onStart',
        () => this.menus.onStart()
    );
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStart) {
        try {
          await this.measure(contribution.constructor.name + '.onStart',
              () => contribution.onStart!(this)
          );
        } catch (error) {
          console.error('Could not start contribution', error);
        }
      }
    }
  }

  protected async measure<T>(name: string, fn: () => MaybePromise<T>): Promise<T> {
    const startMark = name + '-start';
    const endMark = name + '-end';
    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    for (const item of performance.getEntriesByName(name)) {
      const contribution = `Frontend ${item.name}`;
      if (item.duration > TIMER_WARNING_THRESHOLD) {
        console.warn(`${contribution} is slow, took: ${item.duration.toFixed(1)} ms`);
      } else {
        console.debug(`${contribution} took: ${item.duration.toFixed(1)} ms`);
      }
    }
    performance.clearMeasures(name);
    return result;
  }

  protected async fireOnDidInitializeLayout(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onDidInitializeLayout) {
        await this.measure(contribution.constructor.name + '.onDidInitializeLayout',
            () => contribution.onDidInitializeLayout!(this)
        );
      }
    }
  }

  /**
   * Stop the frontend application contributions. This is called when the window is unloaded.
   */
  protected stopContributions(): void {
    console.info('>>> Stopping frontend contributions...');
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStop) {
        try {
          contribution.onStop(this);
        } catch (error) {
          console.error('Could not stop contribution', error);
        }
      }
    }
    console.info('<<< All frontend contributions have been stopped.');
  }

  /**
   * Register global event listeners.
   */
  protected registerEventListeners(): void {
    // console.log(this.windowsService);
    this.windowsService.onUnload(() => {
      this.stateService.state = 'closing_window';
      this.layoutRestorer.storeLayout(this);
      this.stopContributions();
    });
    window.addEventListener('resize', () => this.shell.update());
    document.addEventListener('keydown', event => {
      if (this.inComposition !== true) {
        this.keybindings.run(event);
      }
    }, true);
  }
}

export default FrontendApplication;
