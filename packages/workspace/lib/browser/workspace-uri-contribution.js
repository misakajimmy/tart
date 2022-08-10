var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import URI from '@tart/core/lib/common/uri';
import { DefaultUriLabelProviderContribution, URIIconReference } from '@tart/core/lib/browser';
import { FileStat } from '@tart/filesystem/lib/common/files';
import { injectable, postConstruct } from 'inversify';
let WorkspaceUriLabelProviderContribution = class WorkspaceUriLabelProviderContribution extends DefaultUriLabelProviderContribution {
    async init() {
        // no-op, backward compatibility
    }
    canHandle(element) {
        if ((element instanceof URI && element.scheme === 'file' || URIIconReference.is(element) || FileStat.is(element))) {
            return 10;
        }
        return 0;
    }
    getIcon(element) {
        return super.getIcon(this.asURIIconReference(element));
    }
    getName(element) {
        return super.getName(this.asURIIconReference(element));
    }
    /**
     * trims the workspace root from a file uri, if it is a child.
     */
    getLongName(element) {
        const uri = this.getUri(element);
        if (uri) {
            const formatting = this.findFormatting(uri);
            if (formatting) {
                return this.formatUri(uri, formatting);
            }
        }
        // const relativePath = uri && this.workspaceVariable.getWorkspaceRelativePath(uri);
        const relativePath = uri;
        return super.getLongName(this.asURIIconReference(element));
    }
    asURIIconReference(element) {
        if (FileStat.is(element)) {
            return URIIconReference.create(element.isDirectory ? 'folder' : 'file', element.resource);
        }
        const uri = this.getUri(element);
        // if (uri && this.workspaceVariable.getWorkspaceRootUri(uri)?.isEqual(uri)) {
        //     return URIIconReference.create('folder', uri);
        // }
        return element;
    }
    getUri(element) {
        if (FileStat.is(element)) {
            return element.resource;
        }
        return super.getUri(element);
    }
};
__decorate([
    postConstruct()
], WorkspaceUriLabelProviderContribution.prototype, "init", null);
WorkspaceUriLabelProviderContribution = __decorate([
    injectable()
], WorkspaceUriLabelProviderContribution);
export { WorkspaceUriLabelProviderContribution };

//# sourceMappingURL=../../lib/browser/workspace-uri-contribution.js.map
