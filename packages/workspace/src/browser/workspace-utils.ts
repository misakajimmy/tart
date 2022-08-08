/**
 * Collection of workspace utility functions
 * @class
 */
import URI from '@tart/core/lib/common/uri';
import {inject, injectable} from 'inversify';
import {WorkspaceService} from './workspace-service';

@injectable()
export class WorkspaceUtils {

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  /**
   * Determine if root directory exists
   * for a given array of URIs
   * @param uris
   */
  containsRootDirectory(uris: URI[]): boolean {
    // obtain all roots URIs for a given workspace
    const rootUris = this.workspaceService.tryGetRoots().map(root => root.resource);
    // return true if at least a single URI is a root directory
    return rootUris.some(rootUri => uris.some(uri => uri.isEqualOrParent(rootUri)));
  }
}
