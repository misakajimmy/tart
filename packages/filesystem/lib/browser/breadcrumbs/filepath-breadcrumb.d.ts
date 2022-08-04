import { Breadcrumb } from '@tart/core';
import URI from '@tart/core/lib/common/uri';
export declare class FilepathBreadcrumb implements Breadcrumb {
    readonly uri: URI;
    readonly label: string;
    readonly longLabel: string;
    readonly iconClass: string;
    readonly containerClass: string;
    constructor(uri: URI, label: string, longLabel: string, iconClass: string, containerClass: string);
    get id(): string;
    get type(): symbol;
}
export declare namespace FilepathBreadcrumb {
    function is(breadcrumb: Breadcrumb): breadcrumb is FilepathBreadcrumb;
}
