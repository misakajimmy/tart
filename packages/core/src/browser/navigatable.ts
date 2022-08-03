import {NavigatableWidget, NavigatableWidgetOptions} from './navigatable-type';
import {WidgetOpenerOptions, WidgetOpenHandler} from './widget-open-handler';
import URI from '../common/uri';

export * from './navigatable-type';

export abstract class NavigatableWidgetOpenHandler<W extends NavigatableWidget> extends WidgetOpenHandler<W> {

  protected createWidgetOptions(uri: URI, options?: WidgetOpenerOptions): NavigatableWidgetOptions {
    return {
      kind: 'navigatable',
      uri: this.serializeUri(uri)
    };
  }

  protected serializeUri(uri: URI): string {
    if (uri.scheme === 'file') {
      return uri.withoutFragment().normalizePath().toString();
    } else {
      return uri.withoutFragment().toString();
    }
  }

  protected init() {
    super.init();
  }
}
