var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NavigatorWidgetFactory_1;
import { codicon, ViewContainer, WidgetManager } from '@tart/core';
import { nls } from '@tart/core/lib/common/nls';
import { inject, injectable } from 'inversify';
import { OpenEditorsWidget } from './open-editors-widget/navigator-open-editors-widget';
import { FILE_NAVIGATOR_ID } from './navigator-widget';
export const EXPLORER_VIEW_CONTAINER_ID = 'explorer-view-container';
export const EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS = {
    label: nls.localizeByDefault('Explorer'),
    iconClass: codicon('files'),
    closeable: true
};
let NavigatorWidgetFactory = NavigatorWidgetFactory_1 = class NavigatorWidgetFactory {
    constructor() {
        this.id = NavigatorWidgetFactory_1.ID;
        this.openEditorsWidgetOptions = {
            order: 0,
            canHide: true,
            initiallyCollapsed: true,
            initiallyHidden: true,
            // this property currently has no effect (https://github.com/eclipse-theia/theia/issues/7755)
            weight: 20
        };
        this.fileNavigatorWidgetOptions = {
            order: 1,
            canHide: false,
            initiallyCollapsed: false,
            weight: 80,
            disableDraggingToOtherContainers: true
        };
    }
    async createWidget() {
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
};
NavigatorWidgetFactory.ID = EXPLORER_VIEW_CONTAINER_ID;
__decorate([
    inject(ViewContainer.Factory)
], NavigatorWidgetFactory.prototype, "viewContainerFactory", void 0);
__decorate([
    inject(WidgetManager)
], NavigatorWidgetFactory.prototype, "widgetManager", void 0);
NavigatorWidgetFactory = NavigatorWidgetFactory_1 = __decorate([
    injectable()
], NavigatorWidgetFactory);
export { NavigatorWidgetFactory };

//# sourceMappingURL=../../lib/browser/navigator-widget-factory.js.map
