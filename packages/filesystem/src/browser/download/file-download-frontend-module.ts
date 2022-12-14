import {ContainerModule} from 'inversify';
import {CommandContribution} from '@tartjs/core/lib/common';
import {FileDownloadCommandContribution} from './file-download-command-contribution';

export default new ContainerModule(bind => {
    bind(CommandContribution).to(FileDownloadCommandContribution).inSingletonScope();
});
