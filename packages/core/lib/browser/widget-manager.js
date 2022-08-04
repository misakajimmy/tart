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
import { inject, injectable, named } from 'inversify';
import { Widget } from '@lumino/widgets';
import { ContributionProvider, Emitter, WaitUntilEvent } from '../common';
/* eslint-disable @typescript-eslint/no-explicit-any */
export const WidgetFactory = Symbol('WidgetFactory');
/**
 * The {@link WidgetManager} is the common component responsible for creating and managing widgets. Additional widget factories
 * can be registered by using the {@link WidgetFactory} contribution point. To identify a widget, created by a factory, the factory id and
 * the creation options are used. This key is commonly referred to as `description` of the widget.
 */
let WidgetManager = class WidgetManager {
    _cachedFactories;
    widgets = new Map();
    widgetPromises = new Map();
    pendingWidgetPromises = new Map();
    factoryProvider;
    onWillCreateWidgetEmitter = new Emitter();
    /**
     * An event can be used to participate in the widget creation.
     * Listeners may not dispose the given widget.
     */
    onWillCreateWidget = this.onWillCreateWidgetEmitter.event;
    onDidCreateWidgetEmitter = new Emitter();
    onDidCreateWidget = this.onDidCreateWidgetEmitter.event;
    get factories() {
        if (!this._cachedFactories) {
            this._cachedFactories = new Map();
            for (const factory of this.factoryProvider.getContributions()) {
                if (factory.id) {
                    this._cachedFactories.set(factory.id, factory);
                }
                else {
                    // this.logger.error('Invalid ID for factory: ' + factory + ". ID was: '" + factory.id + "'.");
                }
            }
        }
        return this._cachedFactories;
    }
    /**
     * Get the list of widgets created by the given widget factory.
     * @param factoryId the widget factory id.
     *
     * @returns the list of widgets created by the factory with the given id.
     */
    getWidgets(factoryId) {
        const result = [];
        for (const [key, widget] of this.widgets.entries()) {
            if (this.fromKey(key).factoryId === factoryId) {
                result.push(widget);
            }
        }
        return result;
    }
    /**
     * Try to get the existing widget for the given description.
     * @param factoryId The widget factory id.
     * @param options The widget factory specific information.
     *
     * @returns the widget if available, else `undefined`.
     */
    tryGetWidget(factoryId, options) {
        const key = this.toKey({ factoryId, options });
        const existing = this.widgetPromises.get(key);
        if (existing instanceof Widget) {
            return existing;
        }
        return undefined;
    }
    /**
     * Try to get the existing widget for the given description.
     * @param factoryId The widget factory id.
     * @param options The widget factory specific information.
     *
     * @returns A promise that resolves to the widget, if any exists. The promise may be pending, so be cautious when assuming that it will not reject.
     */
    tryGetPendingWidget(factoryId, options) {
        const key = this.toKey({ factoryId, options });
        return this.doGetWidget(key);
    }
    /**
     * Get the widget for the given description.
     * @param factoryId The widget factory id.
     * @param options The widget factory specific information.
     *
     * @returns a promise resolving to the widget if available, else `undefined`.
     */
    async getWidget(factoryId, options) {
        const key = this.toKey({ factoryId, options });
        const pendingWidget = this.doGetWidget(key);
        const widget = pendingWidget && await pendingWidget;
        return widget;
    }
    /**
     * Creates a new widget or returns the existing widget for the given description.
     * @param factoryId the widget factory id.
     * @param options the widget factory specific information.
     *
     * @returns a promise resolving to the widget.
     */
    async getOrCreateWidget(factoryId, options) {
        const key = this.toKey({ factoryId, options });
        const existingWidget = this.doGetWidget(key);
        if (existingWidget) {
            return existingWidget;
        }
        const factory = this.factories.get(factoryId);
        if (!factory) {
            throw Error("No widget factory '" + factoryId + "' has been registered.");
        }
        try {
            const widgetPromise = factory.createWidget(options);
            this.pendingWidgetPromises.set(key, widgetPromise);
            const widget = await widgetPromise;
            await WaitUntilEvent.fire(this.onWillCreateWidgetEmitter, { factoryId, widget });
            this.widgetPromises.set(key, widgetPromise);
            this.widgets.set(key, widget);
            widget.disposed.connect(() => {
                this.widgets.delete(key);
                this.widgetPromises.delete(key);
            });
            this.onDidCreateWidgetEmitter.fire({ factoryId, widget });
            return widget;
        }
        finally {
            this.pendingWidgetPromises.delete(key);
        }
    }
    /**
     * Get the widget construction options.
     * @param widget the widget.
     *
     * @returns the widget construction options if the widget was created through the manager, else `undefined`.
     */
    getDescription(widget) {
        for (const [key, aWidget] of this.widgets.entries()) {
            if (aWidget === widget) {
                return this.fromKey(key);
            }
        }
        return undefined;
    }
    doGetWidget(key) {
        const pendingWidget = this.widgetPromises.get(key) ?? this.pendingWidgetPromises.get(key);
        if (pendingWidget) {
            return pendingWidget;
        }
        return undefined;
    }
    /**
     * Convert the widget construction options to string.
     * @param options the widget construction options.
     *
     * @returns the widget construction options represented as a string.
     */
    toKey(options) {
        return JSON.stringify(options);
    }
    /**
     * Convert the key into the widget construction options object.
     * @param key the key.
     *
     * @returns the widget construction options object.
     */
    fromKey(key) {
        return JSON.parse(key);
    }
};
__decorate([
    inject(ContributionProvider),
    named(WidgetFactory)
], WidgetManager.prototype, "factoryProvider", void 0);
WidgetManager = __decorate([
    injectable()
], WidgetManager);
export { WidgetManager };

//# sourceMappingURL=../../lib/browser/widget-manager.js.map
