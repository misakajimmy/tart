import '../assets/style/index.css';
import '../assets/style/open-editors.css';

import {ContainerModule} from 'inversify';
import {NavigatorWidgetFactory} from './navigator-widget-factory';
import {bindViewContribution, FrontendApplicationContribution, WidgetFactory} from '@tartjs/core';
import {FileNavigatorContribution} from './navigator-contribution';
import {FILE_NAVIGATOR_ID, FileNavigatorWidget} from './navigator-widget';
import {bindContributionProvider} from '@tartjs/core/lib/common';
import {createFileNavigatorWidget} from './navigator-container';
import {OpenEditorsWidget} from './open-editors-widget/navigator-open-editors-widget';
import {OpenEditorsTreeDecorator} from './open-editors-widget/navigator-open-editors-decorator-service';
import {TabBarToolbarContribution} from '@tartjs/core/lib/browser/shell/tab-bar-toolbar';
import {NavigatorContextKeyService} from './navigator-context-key-service';
import {bindFileNavigatorPreferences} from './navigator-preferences';
import {NavigatorTreeDecorator} from './navigator-decorator-service';
import {FileNavigatorFilter} from './navigator-filter';

export const NavigatorFrontendModule = new ContainerModule((bind) => {
  bindFileNavigatorPreferences(bind);

  bind(FileNavigatorFilter).toSelf().inSingletonScope();

  bindViewContribution(bind, FileNavigatorContribution);

  bind(NavigatorContextKeyService).toSelf().inSingletonScope();

  bind(FrontendApplicationContribution).toService(FileNavigatorContribution);
  bind(TabBarToolbarContribution).toService(FileNavigatorContribution);

  bind(FileNavigatorWidget).toDynamicValue(ctx =>
      createFileNavigatorWidget(ctx.container)
  );
  bind(WidgetFactory).toDynamicValue(({container}) => ({
    id: FILE_NAVIGATOR_ID,
    createWidget: () => container.get(FileNavigatorWidget)
  })).inSingletonScope();

  bindContributionProvider(bind, NavigatorTreeDecorator);
  bindContributionProvider(bind, OpenEditorsTreeDecorator);
  // bind(OpenEditorsTreeDecorator).toService(NavigatorDeletedEditorDecorator);

  bind(WidgetFactory).toDynamicValue(({container}) => ({
    id: OpenEditorsWidget.ID,
    createWidget: () => OpenEditorsWidget.createWidget(container)
  })).inSingletonScope();

  bind(NavigatorWidgetFactory).toSelf().inSingletonScope();
  bind(WidgetFactory).toService(NavigatorWidgetFactory);
});

export default NavigatorFrontendModule;
