import {ContainerModule} from 'inversify';
import {FrontendApplication, FrontendApplicationContribution} from './frontend-application';
import {FrontendApplicationStateService} from './frontend-application-state';
import {bindContributionProvider} from '../common';
import {ApplicationShell} from './shell';

export const FrontendApplicationModule = new ContainerModule((bind) => {
  bind(ApplicationShell).toSelf().inSingletonScope();
  bind(FrontendApplication).toSelf().inSingletonScope();

  bind(FrontendApplicationStateService).toSelf().inSingletonScope();
  bindContributionProvider(bind, FrontendApplicationContribution);
});


export default FrontendApplicationModule;
