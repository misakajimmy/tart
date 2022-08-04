import { Disposable, Emitter, Event } from '@tart/core/lib/common';
import { Breadcrumb, BreadcrumbsContribution, LabelProvider } from '@tart/core/lib/browser';
import { FilepathBreadcrumb } from './filepath-breadcrumb';
import { BreadcrumbsFileTreeWidget } from './filepath-breadcrumbs-container';
import { DirNode } from '../file-tree';
import { FileService } from '../file-service';
import { FileStat } from '../../common/files';
import URI from '@tart/core/lib/common/uri';
export declare const FilepathBreadcrumbType: unique symbol;
export interface FilepathBreadcrumbClassNameFactory {
    (location: URI, index: number): string;
}
export declare class FilepathBreadcrumbsContribution implements BreadcrumbsContribution {
    readonly type: symbol;
    readonly priority: number;
    protected readonly labelProvider: LabelProvider;
    protected readonly fileSystem: FileService;
    protected readonly breadcrumbsFileTreeWidget: BreadcrumbsFileTreeWidget;
    protected readonly onDidChangeBreadcrumbsEmitter: Emitter<URI>;
    get onDidChangeBreadcrumbs(): Event<URI>;
    computeBreadcrumbs(uri: URI): Promise<Breadcrumb[]>;
    attachPopupContent(breadcrumb: Breadcrumb, parent: HTMLElement): Promise<Disposable | undefined>;
    protected getContainerClassCreator(fileURI: URI): FilepathBreadcrumbClassNameFactory;
    protected getIconClassCreator(fileURI: URI): FilepathBreadcrumbClassNameFactory;
    protected filterBreadcrumbs(_: URI, breadcrumb: FilepathBreadcrumb): boolean;
    protected createRootNode(folderToOpen: FileStat): Promise<DirNode | undefined>;
}
