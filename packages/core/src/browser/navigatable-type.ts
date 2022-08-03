import URI from '../common/uri';
import {BaseWidget} from './widgets';
import {MaybeArray} from '../common';
import {Widget} from '@lumino/widgets';

/**
 * `Navigatable` provides an access to an URI of an underlying instance of `Resource`.
 */
export interface Navigatable {
  /**
   * Return an underlying resource URI.
   */
  getResourceUri(): URI | undefined;

  /**
   * Creates a new URI to which this navigatable should moved based on the given target resource URI.
   */
  createMoveToUri(resourceUri: URI): URI | undefined;
}

export namespace Navigatable {
  export function is(arg: Object | undefined): arg is Navigatable {
    return !!arg && 'getResourceUri' && 'createMoveToUri' in arg;
  }
}

export type NavigatableWidget = BaseWidget & Navigatable;
export namespace NavigatableWidget {
  export function is(arg: Object | undefined): arg is NavigatableWidget {
    return arg instanceof BaseWidget && Navigatable.is(arg);
  }

  export function* getAffected<T extends Widget>(
      widgets: Iterable<T>,
      context: MaybeArray<URI>
  ): IterableIterator<[URI, T & NavigatableWidget]> {
    const uris = Array.isArray(context) ? context : [context];
    return get(widgets, resourceUri => uris.some(uri => uri.isEqualOrParent(resourceUri)));
  }

  export function* get<T extends Widget>(
      widgets: Iterable<T>,
      filter: (resourceUri: URI) => boolean = () => true
  ): IterableIterator<[URI, T & NavigatableWidget]> {
    for (const widget of widgets) {
      if (NavigatableWidget.is(widget)) {
        const resourceUri = widget.getResourceUri();
        if (resourceUri && filter(resourceUri)) {
          yield [resourceUri, widget];
        }
      }
    }
  }
}

export interface NavigatableWidgetOptions {
  kind: 'navigatable',
  uri: string,
  counter?: number,
}

export namespace NavigatableWidgetOptions {
  export function is(arg: Object | undefined): arg is NavigatableWidgetOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!arg && 'kind' in arg && (arg as any).kind === 'navigatable';
  }
}
