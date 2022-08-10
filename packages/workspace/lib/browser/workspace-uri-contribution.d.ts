import URI from '@tart/core/lib/common/uri';
import { DefaultUriLabelProviderContribution, URIIconReference } from '@tart/core/lib/browser';
import { FileStat } from '@tart/filesystem/lib/common/files';
export declare class WorkspaceUriLabelProviderContribution extends DefaultUriLabelProviderContribution {
    init(): Promise<void>;
    canHandle(element: object): number;
    getIcon(element: URI | URIIconReference | FileStat): string;
    getName(element: URI | URIIconReference | FileStat): string | undefined;
    /**
     * trims the workspace root from a file uri, if it is a child.
     */
    getLongName(element: URI | URIIconReference | FileStat): string | undefined;
    protected asURIIconReference(element: URI | URIIconReference | FileStat): URI | URIIconReference;
    protected getUri(element: URI | URIIconReference | FileStat): URI | undefined;
}
