import {ContainerModule} from 'inversify';
import {DefaultFileDialogService, FileDialogService} from './file-dialog-service';
import {LocationListRenderer, LocationListRendererFactory, LocationListRendererOptions} from '../location';
import {
    FileDialogTreeFiltersRenderer,
    FileDialogTreeFiltersRendererFactory,
    FileDialogTreeFiltersRendererOptions
} from './file-dialog-tree-filters-renderer';

export const FileDialogModule = new ContainerModule(bind => {
    bind(DefaultFileDialogService).toSelf().inSingletonScope();
    bind(FileDialogService).toService(DefaultFileDialogService);
    bind(LocationListRendererFactory).toFactory(context => (options: LocationListRendererOptions) => {
        const childContainer = context.container.createChild();
        childContainer.bind(LocationListRendererOptions).toConstantValue(options);
        childContainer.bind(LocationListRenderer).toSelf().inSingletonScope();
        return childContainer.get(LocationListRenderer);
    });
    bind(FileDialogTreeFiltersRendererFactory).toFactory(context => (options: FileDialogTreeFiltersRendererOptions) => {
        const childContainer = context.container.createChild();
        childContainer.bind(FileDialogTreeFiltersRendererOptions).toConstantValue(options);
        childContainer.bind(FileDialogTreeFiltersRenderer).toSelf().inSingletonScope();
        return childContainer.get(FileDialogTreeFiltersRenderer);
    });
});

export default FileDialogModule;
