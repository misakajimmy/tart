/**
 * Collection of workspace utility functions
 * @class
 */
import URI from '@tart/core/lib/common/uri';
import { WorkspaceService } from './workspace-service';
export declare class WorkspaceUtils {
    protected readonly workspaceService: WorkspaceService;
    /**
     * Determine if root directory exists
     * for a given array of URIs
     * @param uris
     */
    containsRootDirectory(uris: URI[]): boolean;
}
