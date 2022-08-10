import { ContainerModule } from 'inversify';
import { WorkspaceFrontendContribution } from './workspace-frontend-contribution';
import { FrontendApplicationContribution, KeybindingContribution, LabelProviderContribution } from '@tart/core';
import { CommandContribution, MenuContribution } from '@tart/core/lib/common';
import { bindWorkspacePreferences } from './workspace-preference';
import { WorkspaceService } from './workspace-service';
import { FileMenuContribution, WorkspaceCommandContribution } from './workspace-commands';
import { WorkspaceUriLabelProviderContribution } from './workspace-uri-contribution';
import { createOpenFileDialogContainer, createSaveFileDialogContainer, OpenFileDialog, OpenFileDialogFactory, SaveFileDialog, SaveFileDialogFactory } from '@tart/filesystem';
import { WorkspaceDeleteHandler } from './workspace-delete-handler';
import { WorkspaceUtils } from './workspace-utils';
export const WorkspaceFrontendModule = new ContainerModule(((bind, unbind, isBound, rebind) => {
    bindWorkspacePreferences(bind);
    bind(WorkspaceService).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(WorkspaceService);
    bind(WorkspaceFrontendContribution).toSelf().inSingletonScope();
    for (const identifier of [FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution]) {
        bind(identifier).toService(WorkspaceFrontendContribution);
    }
    bind(OpenFileDialogFactory).toFactory(ctx => (props) => {
        return createOpenFileDialogContainer(ctx.container, props).get(OpenFileDialog);
    });
    bind(SaveFileDialogFactory).toFactory(ctx => (props) => createSaveFileDialogContainer(ctx.container, props).get(SaveFileDialog));
    bind(FileMenuContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(FileMenuContribution);
    bind(WorkspaceDeleteHandler).toSelf().inSingletonScope();
    bind(LabelProviderContribution).to(WorkspaceUriLabelProviderContribution).inSingletonScope();
    bind(WorkspaceUtils).toSelf().inSingletonScope();
    bind(WorkspaceCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(WorkspaceCommandContribution);
}));
export default WorkspaceFrontendModule;

//# sourceMappingURL=../../lib/browser/workspace-frontend-module.js.map
