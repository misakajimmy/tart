/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ShellLayoutRestorer_1;
import { inject, injectable, named } from 'inversify';
import { WidgetManager } from '../widget-manager';
import { StorageService } from '../storage-service';
import { Command } from '../../common/command';
// import { ThemeService } from '../theming';
import { ContributionProvider } from '../../common/contribution-provider';
import { applicationShellLayoutVersion } from './application-shell';
import { CommonCommands } from '../common-frontend-contribution';
export var StatefulWidget;
(function (StatefulWidget) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return arg !== undefined && typeof arg['storeState'] === 'function' && typeof arg['restoreState'] === 'function';
    }
    StatefulWidget.is = is;
})(StatefulWidget || (StatefulWidget = {}));
export var ApplicationShellLayoutMigrationError;
(function (ApplicationShellLayoutMigrationError) {
    const code = 'ApplicationShellLayoutMigrationError';
    function create(message) {
        return Object.assign(new Error(`Could not migrate layout to version ${applicationShellLayoutVersion}.` + (message ? '\n' + message : '')), { code });
    }
    ApplicationShellLayoutMigrationError.create = create;
    function is(error) {
        return !!error && 'code' in error && error['code'] === code;
    }
    ApplicationShellLayoutMigrationError.is = is;
})(ApplicationShellLayoutMigrationError || (ApplicationShellLayoutMigrationError = {}));
export const ApplicationShellLayoutMigration = Symbol('ApplicationShellLayoutMigration');
export const RESET_LAYOUT = Command.toLocalizedCommand({
    id: 'reset.layout',
    category: CommonCommands.VIEW_CATEGORY,
    label: 'Reset Workbench Layout'
}, 'tart/core/resetWorkbenchLayout', CommonCommands.VIEW_CATEGORY_KEY);
let ShellLayoutRestorer = ShellLayoutRestorer_1 = class ShellLayoutRestorer {
    widgetManager;
    storageService;
    storageKey = 'layout';
    shouldStoreLayout = true;
    migrations;
    constructor(widgetManager, 
    // @inject(ILogger) protected logger: ILogger,
    storageService) {
        this.widgetManager = widgetManager;
        this.storageService = storageService;
    }
    registerCommands(commands) {
        commands.registerCommand(RESET_LAYOUT, {
            execute: async () => this.resetLayout()
        });
    }
    storeLayout(app) {
        if (this.shouldStoreLayout) {
            try {
                console.info('>>> Storing the layout...');
                const layoutData = app.shell.getLayoutData();
                const serializedLayoutData = this.deflate(layoutData);
                this.storageService.setData(this.storageKey, serializedLayoutData);
                console.info('<<< The layout has been successfully stored.');
            }
            catch (error) {
                this.storageService.setData(this.storageKey, undefined);
                console.error('Error during serialization of layout data', error);
            }
        }
    }
    async restoreLayout(app) {
        console.info('>>> Restoring the layout state...');
        const serializedLayoutData = await this.storageService.getData(this.storageKey);
        if (serializedLayoutData === undefined) {
            console.info('<<< Nothing to restore.');
            return false;
        }
        const layoutData = await this.inflate(serializedLayoutData);
        await app.shell.setLayoutData(layoutData);
        console.info('<<< The layout has been successfully restored.');
        return true;
    }
    async resetLayout() {
        console.info('>>> Resetting layout...');
        this.shouldStoreLayout = false;
        this.storageService.setData(this.storageKey, undefined);
        // ThemeService.get().reset(); // Theme service cannot use DI, so the current theme ID is stored elsewhere. Hence the explicit reset.
        console.info('<<< The layout has been successfully reset.');
        window.location.reload();
    }
    isWidgetProperty(propertyName) {
        return propertyName === 'widget';
    }
    isWidgetsProperty(propertyName) {
        return propertyName === 'widgets';
    }
    /**
     * Turns the layout data to a string representation.
     */
    deflate(data) {
        return JSON.stringify(data, (property, value) => {
            if (this.isWidgetProperty(property)) {
                const description = this.convertToDescription(value);
                return description;
            }
            else if (this.isWidgetsProperty(property)) {
                const descriptions = [];
                for (const widget of value) {
                    const description = this.convertToDescription(widget);
                    if (description) {
                        descriptions.push(description);
                    }
                }
                return descriptions;
            }
            return value;
        });
    }
    /**
     * Creates the layout data from its string representation.
     */
    async inflate(layoutData) {
        const parseContext = new ShellLayoutRestorer_1.ParseContext();
        const layout = this.parse(layoutData, parseContext);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let layoutVersion;
        try {
            layoutVersion = 'version' in layout && Number(layout.version);
        }
        catch { /* no-op */
        }
        if (typeof layoutVersion !== 'number' || Number.isNaN(layoutVersion)) {
            throw new Error('could not resolve a layout version');
        }
        if (layoutVersion !== applicationShellLayoutVersion) {
            if (layoutVersion < applicationShellLayoutVersion) {
                console.warn(`Layout version ${layoutVersion} is behind current layout version ${applicationShellLayoutVersion}, trying to migrate...`);
            }
            else {
                console.warn(`Layout version ${layoutVersion} is ahead current layout version ${applicationShellLayoutVersion}, trying to load anyway...`);
            }
            console.info(`Please use '${RESET_LAYOUT.label}' command if the layout looks bogus.`);
        }
        const migrations = this.migrations.getContributions()
            .filter(m => m.layoutVersion > layoutVersion && m.layoutVersion <= applicationShellLayoutVersion)
            .sort((m, m2) => m.layoutVersion - m2.layoutVersion);
        if (migrations.length) {
            console.info(`Found ${migrations.length} migrations from layout version ${layoutVersion} to version ${applicationShellLayoutVersion}, migrating...`);
        }
        const context = { layout, layoutVersion, migrations };
        await this.fireWillInflateLayout(context);
        await parseContext.inflate(context);
        return layout;
    }
    async fireWillInflateLayout(context) {
        for (const migration of context.migrations) {
            if (migration.onWillInflateLayout) {
                // don't catch exceptions, if one migration fails all should fail.
                await migration.onWillInflateLayout(context);
            }
        }
    }
    parse(layoutData, parseContext) {
        return JSON.parse(layoutData, (property, value) => {
            if (this.isWidgetsProperty(property)) {
                const widgets = parseContext.filteredArray();
                const descs = value;
                for (let i = 0; i < descs.length; i++) {
                    parseContext.push(async (context) => {
                        widgets[i] = await this.convertToWidget(descs[i], context);
                    });
                }
                return widgets;
            }
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const copy = {};
                for (const p in value) {
                    if (this.isWidgetProperty(p)) {
                        parseContext.push(async (context) => {
                            copy[p] = await this.convertToWidget(value[p], context);
                        });
                    }
                    else {
                        copy[p] = value[p];
                    }
                }
                return copy;
            }
            return value;
        });
    }
    async fireWillInflateWidget(desc, context) {
        for (const migration of context.migrations) {
            if (migration.onWillInflateWidget) {
                // don't catch exceptions, if one migration fails all should fail.
                const migrated = await migration.onWillInflateWidget(desc, context);
                if (migrated) {
                    if (migrated.innerWidgetState && typeof migrated.innerWidgetState !== 'string') {
                        // in order to inflate nested widgets
                        migrated.innerWidgetState = JSON.stringify(migrated.innerWidgetState);
                    }
                    desc = migrated;
                }
            }
        }
        return desc;
    }
    async convertToWidget(desc, context) {
        if (!desc.constructionOptions) {
            return undefined;
        }
        try {
            desc = await this.fireWillInflateWidget(desc, context);
            const widget = await this.widgetManager.getOrCreateWidget(desc.constructionOptions.factoryId, desc.constructionOptions.options);
            if (StatefulWidget.is(widget) && desc.innerWidgetState !== undefined) {
                try {
                    let oldState;
                    if (typeof desc.innerWidgetState === 'string') {
                        const parseContext = new ShellLayoutRestorer_1.ParseContext();
                        oldState = this.parse(desc.innerWidgetState, parseContext);
                        await parseContext.inflate({ ...context, parent: widget });
                    }
                    else {
                        oldState = desc.innerWidgetState;
                    }
                    widget.restoreState(oldState);
                }
                catch (e) {
                    if (ApplicationShellLayoutMigrationError.is(e)) {
                        throw e;
                    }
                    console.warn(`Couldn't restore widget state for ${widget.id}. Error: ${e} `);
                }
            }
            if (widget.isDisposed) {
                return undefined;
            }
            return widget;
        }
        catch (e) {
            if (ApplicationShellLayoutMigrationError.is(e)) {
                throw e;
            }
            console.warn(`Couldn't restore widget for ${desc.constructionOptions.factoryId}. Error: ${e} `);
            return undefined;
        }
    }
    convertToDescription(widget) {
        const desc = this.widgetManager.getDescription(widget);
        if (desc) {
            if (StatefulWidget.is(widget)) {
                const innerState = widget.storeState();
                return innerState ? {
                    constructionOptions: desc,
                    innerWidgetState: this.deflate(innerState)
                } : undefined;
            }
            else {
                return {
                    constructionOptions: desc,
                    innerWidgetState: undefined
                };
            }
        }
    }
};
__decorate([
    inject(ContributionProvider),
    named(ApplicationShellLayoutMigration)
], ShellLayoutRestorer.prototype, "migrations", void 0);
ShellLayoutRestorer = ShellLayoutRestorer_1 = __decorate([
    injectable(),
    __param(0, inject(WidgetManager)),
    __param(1, inject(StorageService))
], ShellLayoutRestorer);
export { ShellLayoutRestorer };
(function (ShellLayoutRestorer) {
    class ParseContext {
        toInflate = [];
        toFilter = [];
        /**
         * Returns an array, which will be filtered from undefined elements
         * after resolving promises, that create widgets.
         */
        filteredArray() {
            const array = [];
            this.toFilter.push(array);
            return array;
        }
        push(toInflate) {
            this.toInflate.push(toInflate);
        }
        async inflate(context) {
            const pending = [];
            while (this.toInflate.length) {
                pending.push(this.toInflate.pop()(context));
            }
            await Promise.all(pending);
            if (this.toFilter.length) {
                this.toFilter.forEach(array => {
                    for (let i = 0; i < array.length; i++) {
                        if (array[i] === undefined) {
                            array.splice(i--, 1);
                        }
                    }
                });
            }
        }
    }
    ShellLayoutRestorer.ParseContext = ParseContext;
})(ShellLayoutRestorer || (ShellLayoutRestorer = {}));

//# sourceMappingURL=../../../lib/browser/shell/shell-layout-restorer.js.map
