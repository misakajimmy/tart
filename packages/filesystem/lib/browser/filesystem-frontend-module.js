import '../assets/style/index.css';
import { ContainerModule } from 'inversify';
import { FileService, FileServiceContribution } from './file-service';
import { VirtualFileServiceContribution } from './virtual-file-service-contribution';
import { VirtualFileSystemProvider } from '../common/virtual-file-system-provider';
import { bindContributionProvider, CommandContribution, ResourceResolver } from '@tart/core/lib/common';
import { FileSystemFrontendContribution } from './filesystem-frontend-contribution';
import { BreadcrumbsContribution, FrontendApplicationContribution, LabelProviderContribution } from '@tart/core';
import { bindFileSystemPreferences } from './filesystem-preferences';
import { FileResourceResolver } from './file-resource';
import { BreadcrumbsFileTreeWidget, createFileTreeBreadcrumbsWidget } from './breadcrumbs/filepath-breadcrumbs-container';
import { FilepathBreadcrumbsContribution } from './breadcrumbs/filepath-breadcrumbs-contribution';
import { FileTreeLabelProvider } from './file-tree/file-tree-label-provider';
import { FileUploadService } from './file-upload-service';
import { StorageFileSystemProvider } from "../common/storage-file-system-provider";
import FileSystemAccess from "../common/storage/file-system-access";
export const FilesystemFrontendModule = new ContainerModule((bind) => {
    bindFileSystemPreferences(bind);
    bindContributionProvider(bind, FileServiceContribution);
    bind(FileService).toSelf().inSingletonScope();
    bind(FileSystemAccess).toSelf().inSingletonScope();
    bind(VirtualFileSystemProvider).toSelf().inSingletonScope();
    bind(StorageFileSystemProvider).toSelf().inSingletonScope();
    bind(VirtualFileServiceContribution).toSelf().inSingletonScope();
    bind(FileServiceContribution).toService(VirtualFileServiceContribution);
    bindFileResource(bind);
    bind(FileSystemFrontendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(FileSystemFrontendContribution);
    bind(FrontendApplicationContribution).toService(FileSystemFrontendContribution);
    bind(FileTreeLabelProvider).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(FileTreeLabelProvider);
    bind(BreadcrumbsFileTreeWidget).toDynamicValue(ctx => createFileTreeBreadcrumbsWidget(ctx.container));
    bind(FilepathBreadcrumbsContribution).toSelf().inSingletonScope();
    bind(BreadcrumbsContribution).toService(FilepathBreadcrumbsContribution);
    bind(FileUploadService).toSelf().inSingletonScope();
});
export function bindFileResource(bind) {
    bind(FileResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(FileResourceResolver);
}
export default FilesystemFrontendModule;

//# sourceMappingURL=../../lib/browser/filesystem-frontend-module.js.map
