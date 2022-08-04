var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { StorageFileSystemProvider } from "../common/storage-file-system-provider";
let VirtualFileServiceContribution = class VirtualFileServiceContribution {
    registerFileSystemProviders(service) {
        const registering = this.provider.ready.then(() => {
            service.registerProvider('file', this.provider);
        });
        service.onWillActivateFileSystemProvider(event => {
            if (event.scheme === 'file') {
                event.waitUntil(registering);
            }
        });
    }
};
__decorate([
    inject(StorageFileSystemProvider)
], VirtualFileServiceContribution.prototype, "provider", void 0);
VirtualFileServiceContribution = __decorate([
    injectable()
], VirtualFileServiceContribution);
export { VirtualFileServiceContribution };

//# sourceMappingURL=../../lib/browser/virtual-file-service-contribution.js.map
