import {Disposable} from './disposable';

/**
 * Represents a typed event.
 */
export interface Event<T> {

  /**
   * An emitter will print a warning if more listeners are added for this event.
   * The event.maxListeners allows the limit to be modified for this specific event.
   * The value can be set to 0 to indicate an unlimited number of listener.
   */
  maxListeners: number

  /**
   *
   * @param listener The listener function will be call when the event happens.
   * @param thisArgs The 'this' which will be used when calling the event listener.
   * @param disposables An array to which a {{IDisposable}} will be added.
   * @return a disposable to remove the listener again.
   */
  (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable;
}

export namespace Event {
  const _disposable = {
    dispose(): void {
    }
  };
  export const None: Event<any> = Object.assign(function (): { dispose(): void } {
    return _disposable;
  }, {
    get maxListeners(): number {
      return 0;
    },
    set maxListeners(maxListeners: number) {
    }
  });

  /**
   * Given an event and a `map` function, returns another event which maps each element
   * through the mapping function.
   */
  export function map<I, O>(event: Event<I>, mapFunc: (i: I) => O): Event<O> {
    return Object.assign((listener: (e: O) => any, thisArgs?: any, disposables?: Disposable[]) => event(i => listener.call(thisArgs, mapFunc(i)), undefined, disposables), {
      maxListeners: 0,
    });
  }
}
