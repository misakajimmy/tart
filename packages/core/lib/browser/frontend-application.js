var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, named } from 'inversify';
import { ApplicationShell } from './shell';
import { Widget } from '@lumino/widgets';
import { CommandRegistry, ContributionProvider, MenuModelRegistry, } from '../common';
import { KeybindingRegistry } from './keybinding';
import { ApplicationShellLayoutMigrationError, ShellLayoutRestorer } from './shell/shell-layout-restorer';
import { FrontendApplicationStateService } from './frontend-application-state';
import { WindowService } from './window/window-service';
/**
 * Clients can implement to get a callback for contributing widgets to a shell on start.
 */
export const FrontendApplicationContribution = Symbol('FrontendApplicationContribution');
const TIMER_WARNING_THRESHOLD = 100;
let FrontendApplication = class FrontendApplication {
    commands;
    menus;
    keybindings;
    layoutRestorer;
    contributions;
    _shell;
    stateService;
    windowsService;
    inComposition = false;
    constructor(commands, menus, keybindings, layoutRestorer, contributions, _shell, stateService) {
        this.commands = commands;
        this.menus = menus;
        this.keybindings = keybindings;
        this.layoutRestorer = layoutRestorer;
        this.contributions = contributions;
        this._shell = _shell;
        this.stateService = stateService;
    }
    get shell() {
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
    async start(props) {
        await this.startContributions();
        this.stateService.state = 'started_contributions';
        const { host } = props;
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
    attachShell(host) {
        Widget.attach(this.shell, host);
    }
    /**
     * Initialize the shell layout either using the layout restorer service or, if no layout has
     * been stored, by creating the default layout.
     */
    async initializeLayout() {
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
    async createDefaultLayout() {
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.initializeLayout) {
                await this.measure(contribution.constructor.name + '.initializeLayout', () => contribution.initializeLayout(this));
            }
        }
    }
    /**
     * Try to restore the shell layout from the storage service. Resolves to `true` if successful.
     */
    async restoreLayout() {
        try {
            return await this.layoutRestorer.restoreLayout(this);
        }
        catch (error) {
            if (ApplicationShellLayoutMigrationError.is(error)) {
                console.warn(error.message);
                console.info('Initializing the default layout instead...');
            }
            else {
                console.error('Could not restore layout', error);
            }
            return false;
        }
    }
    /**
     * Initialize and start the frontend application contributions.
     */
    async startContributions() {
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.initialize) {
                try {
                    await this.measure(contribution.constructor.name + '.initialize', () => contribution.initialize());
                }
                catch (error) {
                    console.error('Could not initialize contribution', error);
                }
            }
        }
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.configure) {
                try {
                    await this.measure(contribution.constructor.name + '.configure', () => contribution.configure(this));
                }
                catch (error) {
                    console.error('Could not configure contribution', error);
                }
            }
        }
        /**
         * FIXME:
         * - decouple commands & menus
         * - consider treat commands, keybindings and menus as frontend application contributions
         */
        await this.measure('commands.onStart', () => this.commands.onStart());
        await this.measure('keybindings.onStart', () => this.keybindings.onStart());
        await this.measure('menus.onStart', () => this.menus.onStart());
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.onStart) {
                try {
                    await this.measure(contribution.constructor.name + '.onStart', () => contribution.onStart(this));
                }
                catch (error) {
                    console.error('Could not start contribution', error);
                }
            }
        }
    }
    async measure(name, fn) {
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
            }
            else {
                console.debug(`${contribution} took: ${item.duration.toFixed(1)} ms`);
            }
        }
        performance.clearMeasures(name);
        return result;
    }
    async fireOnDidInitializeLayout() {
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.onDidInitializeLayout) {
                await this.measure(contribution.constructor.name + '.onDidInitializeLayout', () => contribution.onDidInitializeLayout(this));
            }
        }
    }
    /**
     * Stop the frontend application contributions. This is called when the window is unloaded.
     */
    stopContributions() {
        console.info('>>> Stopping frontend contributions...');
        for (const contribution of this.contributions.getContributions()) {
            if (contribution.onStop) {
                try {
                    contribution.onStop(this);
                }
                catch (error) {
                    console.error('Could not stop contribution', error);
                }
            }
        }
        console.info('<<< All frontend contributions have been stopped.');
    }
    /**
     * Register global event listeners.
     */
    registerEventListeners() {
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
};
__decorate([
    inject(WindowService)
], FrontendApplication.prototype, "windowsService", void 0);
FrontendApplication = __decorate([
    injectable(),
    __param(0, inject(CommandRegistry)),
    __param(1, inject(MenuModelRegistry)),
    __param(2, inject(KeybindingRegistry)),
    __param(3, inject(ShellLayoutRestorer)),
    __param(4, inject(ContributionProvider)),
    __param(4, named(FrontendApplicationContribution)),
    __param(5, inject(ApplicationShell)),
    __param(6, inject(FrontendApplicationStateService))
], FrontendApplication);
export { FrontendApplication };
export default FrontendApplication;

//# sourceMappingURL=../../lib/browser/frontend-application.js.map
