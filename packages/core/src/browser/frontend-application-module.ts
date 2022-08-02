import {ContainerModule} from 'inversify';
import {FrontendApplication} from './frontend-application';
import {FrontendApplicationStateService} from './frontend-application-state';

export const FrontendApplicationModule = new ContainerModule((bind) => {
  bind(FrontendApplication).toSelf().inSingletonScope();

  bind(FrontendApplicationStateService).toSelf().inSingletonScope();
});


export default FrontendApplicationModule;
