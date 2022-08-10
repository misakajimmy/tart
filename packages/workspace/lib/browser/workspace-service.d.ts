import { PreferenceSchemaProvider, PreferenceServiceImpl, WindowService } from '@tart/core';
import { BaseStat, FileStat } from '@tart/filesystem/lib/common/files';
import { Deferred } from '@tart/core/lib/common/promise-util';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { WorkspacePreferences } from './workspace-preference';
import { Disposable, DisposableCollection, Emitter, Event, MaybePromise } from '@tart/core/lib/common';
import { FileSystemPreferences } from '@tart/filesystem/lib/browser/filesystem-preferences';
/**
 *  The workspace service
 */
export declare class WorkspaceService {
    protected deferredRoots: Deferred<FileStat[]>;
    protected readonly fileService: FileService;
    protected preferences: WorkspacePreferences;
    protected readonly windowService: WindowService;
    protected readonly preferenceImpl: PreferenceServiceImpl;
    protected readonly schemaProvider: PreferenceSchemaProvider;
    protected readonly fsPreferences: FileSystemPreferences;
    protected applicationName: string;
    protected readonly onWorkspaceLocationChangedEmitter: Emitter<FileStat>;
    protected readonly toDisposeOnWorkspace: DisposableCollection;
    protected readonly onWorkspaceChangeEmitter: Emitter<FileStat[]>;
    protected readonly rootWatchers: Map<string, Disposable>;
    protected _workspace: FileStat | undefined;
    get workspace(): FileStat | undefined;
    protected _roots: FileStat[];
    get roots(): Promise<FileStat[]>;
    protected _ready: Deferred<void>;
    get ready(): Promise<void>;
    get onWorkspaceLocationChanged(): Event<FileStat | undefined>;
    get onWorkspaceChanged(): Event<FileStat[]>;
    get saved(): boolean;
    /**
     * Returns `true` if theia has an opened workspace or folder
     * @returns {boolean}
     */
    get opened(): boolean;
    tryGetRoots(): FileStat[];
    /**
     * Returns the workspace root uri that the given file belongs to.
     * In case that the file is found in more than one workspace roots, returns the root that is closest to the file.
     * If the file is not from the current workspace, returns `undefined`.
     * @param uri URI of the file
     */
    getWorkspaceRootUri(uri: URI | undefined): URI | undefined;
    /**
     * Adds root folder(s) to the workspace
     * @param uris URI or URIs of the root folder(s) to add
     */
    addRoot(uris: URI[] | URI): Promise<void>;
    spliceRoots(start: number, deleteCount?: number, ...rootsToAdd: URI[]): Promise<URI[]>;
    /**
     * Save workspace data into a file
     * @param uri URI or FileStat of the workspace file
     */
    save(uri: URI | FileStat): Promise<void>;
    /**
     * Opens directory, or recreates a workspace from the file that `uri` points to.
     */
    open(uri: URI, options?: WorkspaceInput): void;
    protected init(): Promise<void>;
    protected setWorkspace(workspaceStat: FileStat | undefined): Promise<void>;
    protected updateTitle(): void;
    /**
     * Resolves to the default workspace URI as string.
     *
     * The default implementation tries to extract the default workspace location
     * from the `window.location.hash`, then falls-back to the most recently
     * used workspace root from the server.
     *
     * It is not ensured that the resolved workspace URI is valid, it can point
     * to a non-existing location.
     */
    protected getDefaultWorkspaceUri(): MaybePromise<string | undefined>;
    protected formatTitle(title?: string): string;
    protected doGetDefaultWorkspaceUri(): Promise<string | undefined>;
    protected writeWorkspaceFile(workspaceFile: FileStat | undefined, workspaceData: WorkspaceData): Promise<FileStat | undefined>;
    protected watchRoot(root: FileStat): Promise<void>;
    protected getExcludes(uri: string): string[];
    protected watchRoots(): Promise<void>;
    protected updateWorkspace(): Promise<void>;
    protected updateRoots(): Promise<void>;
    /**
     * returns a FileStat if the argument URI points to an existing directory. Otherwise, `undefined`.
     */
    protected toValidRoot(uri: URI | string | undefined): Promise<FileStat | undefined>;
    protected computeRoots(): Promise<FileStat[]>;
    protected getWorkspaceDataFromFile(): Promise<WorkspaceData | undefined>;
    /**
     * Set the URL fragment to the given workspace path.
     */
    protected setURLFragment(workspacePath: string): void;
    protected doOpen(uri: URI, options?: WorkspaceInput): Promise<void>;
    protected shouldPreserveWindow(options?: WorkspaceInput): boolean;
    protected reloadWindow(): void;
    protected openNewWindow(workspacePath: string): void;
    protected openWindow(uri: FileStat, options?: WorkspaceInput): void;
    /**
     * returns a FileStat if the argument URI points to a file or directory. Otherwise, `undefined`.
     */
    protected toFileStat(uri: URI | string | undefined): Promise<FileStat | undefined>;
    /**
     * Check if the file should be considered as a workspace file.
     *
     * Example: We should not try to read the contents of an .exe file.
     */
    protected isWorkspaceFile(fileStat: FileStat): boolean;
}
export interface WorkspaceInput {
    /**
     * Tests whether the same window should be used or a new one has to be opened after setting the workspace root. By default it is `false`.
     */
    preserveWindow?: boolean;
}
export interface WorkspaceData {
    folders: Array<{
        path: string;
        name?: string;
    }>;
    [key: string]: {
        [id: string]: any;
    };
}
export declare namespace WorkspaceData {
    function is(data: any): data is WorkspaceData;
    function buildWorkspaceData(folders: string[] | FileStat[], additionalFields?: Partial<WorkspaceData>): WorkspaceData;
    function transformToRelative(data: WorkspaceData, workspaceFile?: FileStat): WorkspaceData;
    function transformToAbsolute(data: WorkspaceData, workspaceFile?: BaseStat): WorkspaceData;
}
