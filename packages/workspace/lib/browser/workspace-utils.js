var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { WorkspaceService } from './workspace-service';
let WorkspaceUtils = class WorkspaceUtils {
    /**
     * Determine if root directory exists
     * for a given array of URIs
     * @param uris
     */
    containsRootDirectory(uris) {
        // obtain all roots URIs for a given workspace
        const rootUris = this.workspaceService.tryGetRoots().map(root => root.resource);
        // return true if at least a single URI is a root directory
        return rootUris.some(rootUri => uris.some(uri => uri.isEqualOrParent(rootUri)));
    }
};
__decorate([
    inject(WorkspaceService)
], WorkspaceUtils.prototype, "workspaceService", void 0);
WorkspaceUtils = __decorate([
    injectable()
], WorkspaceUtils);
export { WorkspaceUtils };

//# sourceMappingURL=../../lib/browser/workspace-utils.js.map
