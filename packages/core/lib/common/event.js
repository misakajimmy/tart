export var Event;
(function (Event) {
    const _disposable = {
        dispose() {
        }
    };
    Event.None = Object.assign(function () {
        return _disposable;
    }, {
        get maxListeners() {
            return 0;
        },
        set maxListeners(maxListeners) {
        }
    });
    /**
     * Given an event and a `map` function, returns another event which maps each element
     * through the mapping function.
     */
    function map(event, mapFunc) {
        return Object.assign((listener, thisArgs, disposables) => event(i => listener.call(thisArgs, mapFunc(i)), undefined, disposables), {
            maxListeners: 0,
        });
    }
    Event.map = map;
})(Event || (Event = {}));

//# sourceMappingURL=../../lib/common/event.js.map
