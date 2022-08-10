var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
// import { MonacoWorkspace } from './monaco-workspace';
let MonacoBulkEditService = class MonacoBulkEditService {
    async apply(edits, options) {
        if (this._previewHandler && ((options === null || options === void 0 ? void 0 : options.showPreview) || edits.some(value => { var _a; return (_a = value.metadata) === null || _a === void 0 ? void 0 : _a.needsConfirmation; }))) {
            edits = await this._previewHandler(edits, options);
            return { ariaSummary: '', success: true };
        }
        else {
            // return this.workspace.applyBulkEdit(edits);
        }
    }
    hasPreviewHandler() {
        return Boolean(this._previewHandler);
    }
    setPreviewHandler(handler) {
        this._previewHandler = handler;
        const disposePreviewHandler = () => {
            if (this._previewHandler === handler) {
                this._previewHandler = undefined;
            }
        };
        return {
            dispose() {
                disposePreviewHandler();
            }
        };
    }
};
MonacoBulkEditService = __decorate([
    injectable()
], MonacoBulkEditService);
export { MonacoBulkEditService };

//# sourceMappingURL=../../lib/browser/monaco-bulk-edit-service.js.map
