import { UriCommandHandler } from '@tart/core/lib/common/uri-command-handler';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { ApplicationShell } from '@tart/core';
import { WorkspaceService } from './workspace-service';
import { FileSystemPreferences } from '@tart/filesystem/lib/browser/filesystem-preferences';
import { FileDeleteOptions } from '@tart/filesystem/lib/common/files';
import { WorkspaceUtils } from './workspace-utils';
export declare class WorkspaceDeleteHandler implements UriCommandHandler<URI[]> {
    protected readonly fileService: FileService;
    protected readonly shell: ApplicationShell;
    protected readonly workspaceUtils: WorkspaceUtils;
    protected readonly workspaceService: WorkspaceService;
    protected readonly fsPreferences: FileSystemPreferences;
    /**
     * Determine if the command is visible.
     *
     * @param uris URIs of selected resources.
     * @returns `true` if the command is visible.
     */
    isVisible(uris: URI[]): boolean;
    /**
     * Determine if the command is enabled.
     *
     * @param uris URIs of selected resources.
     * @returns `true` if the command is enabled.
     */
    isEnabled(uris: URI[]): boolean;
    /**
     * Execute the command.
     *
     * @param uris URIs of selected resources.
     */
    execute(uris: URI[]): Promise<void>;
    /**
     * Display dialog to confirm deletion.
     *
     * @param uris URIs of selected resources.
     */
    protected confirm(uris: URI[], options: FileDeleteOptions): Promise<boolean | undefined>;
    /**
     * Get the dialog confirmation message for deletion.
     *
     * @param uris URIs of selected resources.
     */
    protected getConfirmMessage(uris: URI[]): string | HTMLElement;
    /**
     * Get which URI are presently dirty.
     *
     * @param uris URIs of selected resources.
     * @returns An array of dirty URI.
     */
    protected getDirty(uris: URI[]): URI[];
    /**
     * Perform deletion of a given URI.
     *
     * @param uri URI of selected resource.
     */
    protected delete(uri: URI, options: FileDeleteOptions): Promise<void>;
    /**
     * Close widget without saving changes.
     *
     * @param uri URI of a selected resource.
     */
    protected closeWithoutSaving(uri: URI): Promise<void>;
}
