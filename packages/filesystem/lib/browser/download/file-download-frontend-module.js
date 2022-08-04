import { ContainerModule } from 'inversify';
import { CommandContribution } from '@tart/core/lib/common';
import { FileDownloadCommandContribution } from './file-download-command-contribution';
export default new ContainerModule(bind => {
    bind(CommandContribution).to(FileDownloadCommandContribution).inSingletonScope();
});

//# sourceMappingURL=../../../lib/browser/download/file-download-frontend-module.js.map
