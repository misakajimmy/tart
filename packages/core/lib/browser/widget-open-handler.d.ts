import { OpenerOptions, OpenHandler } from './opener-service';
import { ApplicationShell } from './shell';
import { BaseWidget } from './widgets';
import { WidgetManager } from './widget-manager';
import URI from '../common/uri';
import { Emitter, Event, MaybePromise } from '../common';
export declare type WidgetOpenMode = 'open' | 'reveal' | 'activate';
/**
 * `WidgetOpenerOptions` define serializable generic options used by the {@link WidgetOpenHandler}.
 */
export interface WidgetOpenerOptions extends OpenerOptions {
    /**
     * Determines whether the widget should be only opened, revealed or activated.
     * By default is `activate`.
     */
    mode?: WidgetOpenMode;
    /**
     * Specify how an opened widget should be added to the shell.
     * By default to the main area.
     */
    widgetOptions?: ApplicationShell.WidgetOptions;
}
export declare abstract class WidgetOpenHandler<W extends BaseWidget> implements OpenHandler {
    /**
     * The widget open handler id.
     *
     * #### Implementation
     * - A widget factory for this id should be registered.
     * - Subclasses should not implement `WidgetFactory`
     * to avoid exposing capabilities to create a widget outside of `WidgetManager`.
     */
    abstract readonly id: string;
    protected readonly shell: ApplicationShell;
    protected readonly widgetManager: WidgetManager;
    protected readonly onCreatedEmitter: Emitter<W>;
    /**
     * Emit when a new widget is created.
     */
    readonly onCreated: Event<W>;
    /**
     * Retrieves all open widgets that have been opened by this handler.
     *
     * @returns all open widgets for this open handler.
     */
    get all(): W[];
    abstract canHandle(uri: URI, options?: WidgetOpenerOptions): MaybePromise<number>;
    /**
     * Open a widget for the given uri and options.
     * Reject if the given options are not widget options or a widget cannot be opened.
     * @param uri the uri of the resource that should be opened.
     * @param options the widget opener options.
     *
     * @returns promise of the widget that resolves when the widget has been opened.
     */
    open(uri: URI, options?: WidgetOpenerOptions): Promise<W>;
    /**
     * Tries to get an existing widget for the given uri.
     * @param uri the uri of the widget.
     *
     * @returns a promise that resolves to the existing widget or `undefined` if no widget for the given uri exists.
     */
    getByUri(uri: URI): Promise<W | undefined>;
    /**
     * Return an existing widget for the given uri or creates a new one.
     *
     * It does not open a widget, use {@link WidgetOpenHandler#open} instead.
     * @param uri uri of the widget.
     *
     * @returns a promise of the existing or newly created widget.
     */
    getOrCreateByUri(uri: URI): Promise<W>;
    /**
     * Closes all widgets that have been opened by this open handler.
     * @param options the close options that should be applied to all widgets.
     *
     * @returns a promise of all closed widgets that resolves after they have been closed.
     */
    closeAll(options?: ApplicationShell.CloseOptions): Promise<W[]>;
    protected init(): void;
    protected doOpen(widget: W, options?: WidgetOpenerOptions): Promise<void>;
    protected tryGetPendingWidget(uri: URI, options?: WidgetOpenerOptions): MaybePromise<W> | undefined;
    protected getWidget(uri: URI, options?: WidgetOpenerOptions): Promise<W | undefined>;
    protected getOrCreateWidget(uri: URI, options?: WidgetOpenerOptions): Promise<W>;
    protected abstract createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): Object;
}
