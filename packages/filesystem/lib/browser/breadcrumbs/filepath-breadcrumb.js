import { FilepathBreadcrumbType } from './filepath-breadcrumbs-contribution';
export class FilepathBreadcrumb {
    constructor(uri, label, longLabel, iconClass, containerClass) {
        this.uri = uri;
        this.label = label;
        this.longLabel = longLabel;
        this.iconClass = iconClass;
        this.containerClass = containerClass;
    }
    get id() {
        return this.type.toString() + '_' + this.uri.toString();
    }
    get type() {
        return FilepathBreadcrumbType;
    }
}
(function (FilepathBreadcrumb) {
    function is(breadcrumb) {
        return 'uri' in breadcrumb;
    }
    FilepathBreadcrumb.is = is;
})(FilepathBreadcrumb || (FilepathBreadcrumb = {}));

//# sourceMappingURL=../../../lib/browser/breadcrumbs/filepath-breadcrumb.js.map
