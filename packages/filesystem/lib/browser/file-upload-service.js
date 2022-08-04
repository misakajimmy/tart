var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import URI from '@tart/core/lib/common/uri';
import { FileService } from './file-service';
import { EncodingService } from '@tart/core/lib/common/encoding-service';
import { BinaryBuffer } from "@tart/core/lib/common//buffer";
let FileUploadService = class FileUploadService {
    async upload(targetUri, parmas = {}) {
        let uri = targetUri.toString();
        if (!uri.endsWith('/')) {
            uri += '/';
        }
        for (let i = 0; i < parmas.source.files.length; i++) {
            const reader = new FileReader();
            const name = parmas.source.files[i].name;
            reader.readAsArrayBuffer(parmas.source.files[i]);
            reader.onload = () => {
                const data = reader.result;
                this.fileService.writeFile(new URI(uri + name), BinaryBuffer.wrap(new Uint8Array(data)));
            };
        }
    }
};
FileUploadService.TARGET = 'target';
FileUploadService.UPLOAD = 'upload';
__decorate([
    inject(FileService)
], FileUploadService.prototype, "fileService", void 0);
__decorate([
    inject(EncodingService)
], FileUploadService.prototype, "encodingService", void 0);
FileUploadService = __decorate([
    injectable()
], FileUploadService);
export { FileUploadService };

//# sourceMappingURL=../../lib/browser/file-upload-service.js.map
