var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, postConstruct } from 'inversify';
import { ContextKeyService } from '@tart/core';
let NavigatorContextKeyService = class NavigatorContextKeyService {
    get explorerViewletVisible() {
        return this._explorerViewletVisible;
    }
    /** True if Explorer view has keyboard focus. */
    get explorerViewletFocus() {
        return this._explorerViewletFocus;
    }
    /** True if File Explorer section has keyboard focus. */
    get filesExplorerFocus() {
        return this._filesExplorerFocus;
    }
    get explorerResourceIsFolder() {
        return this._explorerResourceIsFolder;
    }
    init() {
        this._explorerViewletVisible = this.contextKeyService.createKey('explorerViewletVisible', false);
        this._explorerViewletFocus = this.contextKeyService.createKey('explorerViewletFocus', false);
        this._filesExplorerFocus = this.contextKeyService.createKey('filesExplorerFocus', false);
        this._explorerResourceIsFolder = this.contextKeyService.createKey('explorerResourceIsFolder', false);
    }
};
__decorate([
    inject(ContextKeyService)
], NavigatorContextKeyService.prototype, "contextKeyService", void 0);
__decorate([
    postConstruct()
], NavigatorContextKeyService.prototype, "init", null);
NavigatorContextKeyService = __decorate([
    injectable()
], NavigatorContextKeyService);
export { NavigatorContextKeyService };

//# sourceMappingURL=../../lib/browser/navigator-context-key-service.js.map
