import {Disposable, Emitter, Event} from '@tart/core/lib/common';
import {inject, injectable} from 'inversify';
import {
    Breadcrumb,
    BreadcrumbsContribution,
    CompositeTreeNode,
    LabelProvider,
    SelectableTreeNode,
    Widget
} from '@tart/core/lib/browser';
import {FilepathBreadcrumb} from './filepath-breadcrumb';
import {BreadcrumbsFileTreeWidget} from './filepath-breadcrumbs-container';
import {DirNode} from '../file-tree';
import {FileService} from '../file-service';
import {FileStat} from '../../common/files';
import URI from '@tart/core/lib/common/uri';

export const FilepathBreadcrumbType = Symbol('FilepathBreadcrumb');

export interface FilepathBreadcrumbClassNameFactory {
    (location: URI, index: number): string;
}

@injectable()
export class FilepathBreadcrumbsContribution implements BreadcrumbsContribution {

    readonly type = FilepathBreadcrumbType;
    readonly priority: number = 100;
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;
    @inject(FileService)
    protected readonly fileSystem: FileService;
    @inject(BreadcrumbsFileTreeWidget)
    protected readonly breadcrumbsFileTreeWidget: BreadcrumbsFileTreeWidget;
    protected readonly onDidChangeBreadcrumbsEmitter = new Emitter<URI>();

    get onDidChangeBreadcrumbs(): Event<URI> {
        return this.onDidChangeBreadcrumbsEmitter.event;
    }

    async computeBreadcrumbs(uri: URI): Promise<Breadcrumb[]> {
        if (uri.scheme !== 'file') {
            return [];
        }
        const getContainerClass = this.getContainerClassCreator(uri);
        const getIconClass = this.getIconClassCreator(uri);
        return uri.allLocations
            .map((location, index) => {
                const icon = getIconClass(location, index);
                const containerClass = getContainerClass(location, index);
                return new FilepathBreadcrumb(
                    location,
                    this.labelProvider.getName(location),
                    this.labelProvider.getLongName(location),
                    icon,
                    containerClass,
                );
            })
            .filter(b => this.filterBreadcrumbs(uri, b))
            .reverse();
    }

    async attachPopupContent(breadcrumb: Breadcrumb, parent: HTMLElement): Promise<Disposable | undefined> {
        if (!FilepathBreadcrumb.is(breadcrumb)) {
            return undefined;
        }
        const folderFileStat = await this.fileSystem.resolve(breadcrumb.uri.parent);
        if (folderFileStat) {
            const rootNode = await this.createRootNode(folderFileStat);
            if (rootNode) {
                const {model} = this.breadcrumbsFileTreeWidget;
                await model.navigateTo({...rootNode, visible: false});
                Widget.attach(this.breadcrumbsFileTreeWidget, parent);
                const toDisposeOnTreePopulated = model.onChanged(() => {
                    if (CompositeTreeNode.is(model.root) && model.root.children.length > 0) {
                        toDisposeOnTreePopulated.dispose();
                        const targetNode = model.getNode(breadcrumb.uri.path.toString());
                        if (targetNode && SelectableTreeNode.is(targetNode)) {
                            model.selectNode(targetNode);
                        }
                        this.breadcrumbsFileTreeWidget.activate();
                    }
                });
                return {
                    dispose: () => {
                        // Clear model otherwise the next time a popup is opened the old model is rendered first
                        // and is shown for a short time period.
                        toDisposeOnTreePopulated.dispose();
                        this.breadcrumbsFileTreeWidget.model.root = undefined;
                        Widget.detach(this.breadcrumbsFileTreeWidget);
                    }
                };
            }
        }
    }

    protected getContainerClassCreator(fileURI: URI): FilepathBreadcrumbClassNameFactory {
        return (location, index) => location.isEqual(fileURI) ? 'file' : 'folder';
    }

    protected getIconClassCreator(fileURI: URI): FilepathBreadcrumbClassNameFactory {
        return (location, index) => location.isEqual(fileURI) ? this.labelProvider.getIcon(location) + ' file-icon' : '';
    }

    protected filterBreadcrumbs(_: URI, breadcrumb: FilepathBreadcrumb): boolean {
        return !breadcrumb.uri.path.isRoot;
    }

    protected async createRootNode(folderToOpen: FileStat): Promise<DirNode | undefined> {
        const folderUri = folderToOpen.resource;
        const rootUri = folderToOpen.isDirectory ? folderUri : folderUri.parent;
        const rootStat = await this.fileSystem.resolve(rootUri);
        if (rootStat) {
            return DirNode.createRoot(rootStat);
        }
    }
}
