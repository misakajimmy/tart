import { BaseWidget } from './widgets';
export var Navigatable;
(function (Navigatable) {
    function is(arg) {
        return !!arg && 'getResourceUri' && 'createMoveToUri' in arg;
    }
    Navigatable.is = is;
})(Navigatable || (Navigatable = {}));
export var NavigatableWidget;
(function (NavigatableWidget) {
    function is(arg) {
        return arg instanceof BaseWidget && Navigatable.is(arg);
    }
    NavigatableWidget.is = is;
    function* getAffected(widgets, context) {
        const uris = Array.isArray(context) ? context : [context];
        return get(widgets, resourceUri => uris.some(uri => uri.isEqualOrParent(resourceUri)));
    }
    NavigatableWidget.getAffected = getAffected;
    function* get(widgets, filter = () => true) {
        for (const widget of widgets) {
            if (NavigatableWidget.is(widget)) {
                const resourceUri = widget.getResourceUri();
                if (resourceUri && filter(resourceUri)) {
                    yield [resourceUri, widget];
                }
            }
        }
    }
    NavigatableWidget.get = get;
})(NavigatableWidget || (NavigatableWidget = {}));
export var NavigatableWidgetOptions;
(function (NavigatableWidgetOptions) {
    function is(arg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!arg && 'kind' in arg && arg.kind === 'navigatable';
    }
    NavigatableWidgetOptions.is = is;
})(NavigatableWidgetOptions || (NavigatableWidgetOptions = {}));

//# sourceMappingURL=../../lib/browser/navigatable-type.js.map
