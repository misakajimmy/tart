import { WidgetOpenHandler } from './widget-open-handler';
export * from './navigatable-type';
export class NavigatableWidgetOpenHandler extends WidgetOpenHandler {
    createWidgetOptions(uri, options) {
        return {
            kind: 'navigatable',
            uri: this.serializeUri(uri)
        };
    }
    serializeUri(uri) {
        if (uri.scheme === 'file') {
            return uri.withoutFragment().normalizePath().toString();
        }
        else {
            return uri.withoutFragment().toString();
        }
    }
    init() {
        super.init();
    }
}

//# sourceMappingURL=../../lib/browser/navigatable.js.map
