import {codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager} from '@tart/core';
import {nls} from '@tart/core/lib/common/nls';
import {inject, injectable} from 'inversify';
import {OpenEditorsWidget} from './open-editors-widget/navigator-open-editors-widget';
import {FILE_NAVIGATOR_ID} from './navigator-widget';

export const EXPLORER_VIEW_CONTAINER_ID = 'explorer-view-container';
export const EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
  label: nls.localizeByDefault('Explorer'),
  iconClass: codicon('files'),
  closeable: true
};

@injectable()
export class NavigatorWidgetFactory implements WidgetFactory {
  static ID = EXPLORER_VIEW_CONTAINER_ID;

  readonly id = NavigatorWidgetFactory.ID;

  protected openEditorsWidgetOptions: ViewContainer.Factory.WidgetOptions = {
    order: 0,
    canHide: true,
    initiallyCollapsed: true,
    initiallyHidden: true,
    // this property currently has no effect (https://github.com/eclipse-theia/theia/issues/7755)
    weight: 20
  };

  protected fileNavigatorWidgetOptions: ViewContainer.Factory.WidgetOptions = {
    order: 1,
    canHide: false,
    initiallyCollapsed: false,
    weight: 80,
    disableDraggingToOtherContainers: true
  };

  @inject(ViewContainer.Factory)
  protected readonly viewContainerFactory: ViewContainer.Factory;
  @inject(WidgetManager) protected readonly widgetManager: WidgetManager;

  async createWidget(): Promise<ViewContainer> {
    const viewContainer = this.viewContainerFactory({
      id: EXPLORER_VIEW_CONTAINER_ID,
      progressLocationId: 'explorer'
    });
    viewContainer.setTitleOptions(EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS);
    const openEditorsWidget = await this.widgetManager.getOrCreateWidget(OpenEditorsWidget.ID);
    const navigatorWidget = await this.widgetManager.getOrCreateWidget(FILE_NAVIGATOR_ID);
    viewContainer.addWidget(openEditorsWidget, this.openEditorsWidgetOptions);
    viewContainer.addWidget(navigatorWidget, this.fileNavigatorWidgetOptions);
    return viewContainer;
  }
}
