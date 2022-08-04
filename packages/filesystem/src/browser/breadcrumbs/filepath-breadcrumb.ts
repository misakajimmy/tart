import {Breadcrumb} from '@tart/core';
import URI from '@tart/core/lib/common/uri';
import {FilepathBreadcrumbType} from './filepath-breadcrumbs-contribution';

export class FilepathBreadcrumb implements Breadcrumb {
    constructor(
        readonly uri: URI,
        readonly label: string,
        readonly longLabel: string,
        readonly iconClass: string,
        readonly containerClass: string,
    ) {
    }

    get id(): string {
        return this.type.toString() + '_' + this.uri.toString();
    }

    get type(): symbol {
        return FilepathBreadcrumbType;
    }
}

export namespace FilepathBreadcrumb {
    export function is(breadcrumb: Breadcrumb): breadcrumb is FilepathBreadcrumb {
        return 'uri' in breadcrumb;
    }
}
