import URI from '@tart/core/lib/common/uri';
import { FileStat } from '../../common/files';
export declare namespace FileSystemUtils {
    /**
     * Generate unique URI for a given parent which does not collide
     *
     * @param parentUri the `URI` of the parent
     * @param parent the `FileStat` of the parent
     * @param name the resource name
     * @param ext the resource extension
     */
    function generateUniqueResourceURI(parentUri: URI, parent: FileStat, name: string, ext?: string): URI;
}
