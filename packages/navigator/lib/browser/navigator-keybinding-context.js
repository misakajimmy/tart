var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { ApplicationShell } from '@tart/core';
import { FileNavigatorWidget } from './navigator-widget';
export var NavigatorKeybindingContexts;
(function (NavigatorKeybindingContexts) {
    NavigatorKeybindingContexts.navigatorActive = 'navigatorActive';
})(NavigatorKeybindingContexts || (NavigatorKeybindingContexts = {}));
let NavigatorActiveContext = class NavigatorActiveContext {
    constructor() {
        this.id = NavigatorKeybindingContexts.navigatorActive;
    }
    isEnabled() {
        return this.applicationShell.activeWidget instanceof FileNavigatorWidget;
    }
};
__decorate([
    inject(ApplicationShell)
], NavigatorActiveContext.prototype, "applicationShell", void 0);
NavigatorActiveContext = __decorate([
    injectable()
], NavigatorActiveContext);
export { NavigatorActiveContext };

//# sourceMappingURL=../../lib/browser/navigator-keybinding-context.js.map
