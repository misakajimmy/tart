import URI from '@tartjs/core/lib/common/uri';
import {DefaultUriLabelProviderContribution, URIIconReference} from '@tartjs/core/lib/browser';
import {FileStat} from '@tartjs/filesystem/lib/common/files';
import {injectable, postConstruct} from 'inversify';

@injectable()
export class WorkspaceUriLabelProviderContribution extends DefaultUriLabelProviderContribution {

  @postConstruct()
  async init(): Promise<void> {
    // no-op, backward compatibility
  }

  canHandle(element: object): number {
    if ((element instanceof URI && element.scheme === 'file' || URIIconReference.is(element) || FileStat.is(element))) {
      return 10;
    }
    return 0;
  }

  getIcon(element: URI | URIIconReference | FileStat): string {
    return super.getIcon(this.asURIIconReference(element));
  }

  getName(element: URI | URIIconReference | FileStat): string | undefined {
    return super.getName(this.asURIIconReference(element));
  }

  /**
   * trims the workspace root from a file uri, if it is a child.
   */
  getLongName(element: URI | URIIconReference | FileStat): string | undefined {
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

  protected asURIIconReference(element: URI | URIIconReference | FileStat): URI | URIIconReference {
    if (FileStat.is(element)) {
      return URIIconReference.create(element.isDirectory ? 'folder' : 'file', element.resource);
    }
    const uri = this.getUri(element);
    // if (uri && this.workspaceVariable.getWorkspaceRootUri(uri)?.isEqual(uri)) {
    //     return URIIconReference.create('folder', uri);
    // }
    return element;
  }

  protected getUri(element: URI | URIIconReference | FileStat): URI | undefined {
    if (FileStat.is(element)) {
      return element.resource;
    }
    return super.getUri(element);
  }
}
