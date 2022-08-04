var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ApplicationShell } from './shell';
import { inject, injectable, postConstruct } from 'inversify';
import { WidgetManager } from './widget-manager';
import { Emitter } from '../common';
let WidgetOpenHandler = class WidgetOpenHandler {
    shell;
    widgetManager;
    onCreatedEmitter = new Emitter();
    /**
     * Emit when a new widget is created.
     */
    onCreated = this.onCreatedEmitter.event;
    /**
     * Retrieves all open widgets that have been opened by this handler.
     *
     * @returns all open widgets for this open handler.
     */
    get all() {
        return this.widgetManager.getWidgets(this.id);
    }
    /**
     * Open a widget for the given uri and options.
     * Reject if the given options are not widget options or a widget cannot be opened.
     * @param uri the uri of the resource that should be opened.
     * @param options the widget opener options.
     *
     * @returns promise of the widget that resolves when the widget has been opened.
     */
    async open(uri, options) {
        const widget = await this.getOrCreateWidget(uri, options);
        await this.doOpen(widget, options);
        return widget;
    }
    /**
     * Tries to get an existing widget for the given uri.
     * @param uri the uri of the widget.
     *
     * @returns a promise that resolves to the existing widget or `undefined` if no widget for the given uri exists.
     */
    getByUri(uri) {
        return this.getWidget(uri);
    }
    /**
     * Return an existing widget for the given uri or creates a new one.
     *
     * It does not open a widget, use {@link WidgetOpenHandler#open} instead.
     * @param uri uri of the widget.
     *
     * @returns a promise of the existing or newly created widget.
     */
    getOrCreateByUri(uri) {
        return this.getOrCreateWidget(uri);
    }
    /**
     * Closes all widgets that have been opened by this open handler.
     * @param options the close options that should be applied to all widgets.
     *
     * @returns a promise of all closed widgets that resolves after they have been closed.
     */
    async closeAll(options) {
        const closed = await Promise.all(this.all.map(widget => this.shell.closeWidget(widget.id, options)));
        return closed.filter(widget => !!widget);
    }
    init() {
        this.widgetManager.onDidCreateWidget(({ factoryId, widget }) => {
            if (factoryId === this.id) {
                this.onCreatedEmitter.fire(widget);
            }
        });
    }
    async doOpen(widget, options) {
        const op = {
            mode: 'activate',
            ...options
        };
        if (!widget.isAttached) {
            this.shell.addWidget(widget, op.widgetOptions || { area: 'main' });
        }
        if (op.mode === 'activate') {
            await this.shell.activateWidget(widget.id);
        }
        else if (op.mode === 'reveal') {
            await this.shell.revealWidget(widget.id);
        }
    }
    tryGetPendingWidget(uri, options) {
        const factoryOptions = this.createWidgetOptions(uri, options);
        return this.widgetManager.tryGetPendingWidget(this.id, factoryOptions);
    }
    getWidget(uri, options) {
        const widgetOptions = this.createWidgetOptions(uri, options);
        return this.widgetManager.getWidget(this.id, widgetOptions);
    }
    getOrCreateWidget(uri, options) {
        const widgetOptions = this.createWidgetOptions(uri, options);
        return this.widgetManager.getOrCreateWidget(this.id, widgetOptions);
    }
};
__decorate([
    inject(ApplicationShell)
], WidgetOpenHandler.prototype, "shell", void 0);
__decorate([
    inject(WidgetManager)
], WidgetOpenHandler.prototype, "widgetManager", void 0);
__decorate([
    postConstruct()
], WidgetOpenHandler.prototype, "init", null);
WidgetOpenHandler = __decorate([
    injectable()
], WidgetOpenHandler);
export { WidgetOpenHandler };

//# sourceMappingURL=../../lib/browser/widget-open-handler.js.map
