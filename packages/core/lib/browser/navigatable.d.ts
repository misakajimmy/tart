import { NavigatableWidget, NavigatableWidgetOptions } from './navigatable-type';
import { WidgetOpenerOptions, WidgetOpenHandler } from './widget-open-handler';
import URI from '../common/uri';
export * from './navigatable-type';
export declare abstract class NavigatableWidgetOpenHandler<W extends NavigatableWidget> extends WidgetOpenHandler<W> {
    protected createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): NavigatableWidgetOptions;
    protected serializeUri(uri: URI): string;
    protected init(): void;
}
