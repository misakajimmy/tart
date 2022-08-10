import {inject, injectable, postConstruct} from 'inversify';
import {PreferenceSchemaProvider, PreferenceScope, PreferenceServiceImpl, WindowService} from '@tart/core';
import {BaseStat, FileStat} from '@tart/filesystem/lib/common/files';
import {Deferred} from '@tart/core/lib/common/promise-util';
import URI from '@tart/core/lib/common/uri';
import * as jsoncparser from 'jsonc-parser';
import Ajv from 'ajv';
import {FileService} from '@tart/filesystem/lib/browser/file-service';
import {VSCODE_EXT, WM_EXT} from '../common';
import {WorkspacePreferences} from './workspace-preference';
import {Disposable, DisposableCollection, Emitter, Event, MaybePromise} from '@tart/core/lib/common';
import {workspaceSchema} from './workspace-schema-updater';
import {FileSystemPreferences} from '@tart/filesystem/lib/browser/filesystem-preferences';
import {DEFAULT_WINDOW_HASH} from '@tart/core/lib/common/window';
import {FrontendApplicationConfigProvider} from '@tart/core/lib/browser/frontend-application-config-provider';

/**
 *  The workspace service
 */
@injectable()
export class WorkspaceService {

  protected deferredRoots = new Deferred<FileStat[]>();
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(WorkspacePreferences)
  protected preferences: WorkspacePreferences;
  @inject(WindowService)
  protected readonly windowService: WindowService;
  @inject(PreferenceServiceImpl)
  protected readonly preferenceImpl: PreferenceServiceImpl;
  @inject(PreferenceSchemaProvider)
  protected readonly schemaProvider: PreferenceSchemaProvider;
  @inject(FileSystemPreferences)
  protected readonly fsPreferences: FileSystemPreferences;
  protected applicationName: string;
  protected readonly onWorkspaceLocationChangedEmitter = new Emitter<FileStat | undefined>();
  protected readonly toDisposeOnWorkspace = new DisposableCollection();
  protected readonly onWorkspaceChangeEmitter = new Emitter<FileStat[]>();
  protected readonly rootWatchers = new Map<string, Disposable>();

  protected _workspace: FileStat | undefined;

  get workspace(): FileStat | undefined {
    return this._workspace;
  }

  protected _roots: FileStat[] = [];

  get roots(): Promise<FileStat[]> {
    return this.deferredRoots.promise;
  }

  protected _ready = new Deferred<void>();

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get onWorkspaceLocationChanged(): Event<FileStat | undefined> {
    return this.onWorkspaceLocationChangedEmitter.event;
  }

  get onWorkspaceChanged(): Event<FileStat[]> {
    return this.onWorkspaceChangeEmitter.event;
  }

  get saved(): boolean {
    return !!this._workspace && !this._workspace.isDirectory;
  }

  /**
   * Returns `true` if theia has an opened workspace or folder
   * @returns {boolean}
   */
  get opened(): boolean {
    return !!this._workspace;
  }

  tryGetRoots(): FileStat[] {
    return this._roots;
  }

  /**
   * Returns the workspace root uri that the given file belongs to.
   * In case that the file is found in more than one workspace roots, returns the root that is closest to the file.
   * If the file is not from the current workspace, returns `undefined`.
   * @param uri URI of the file
   */
  getWorkspaceRootUri(uri: URI | undefined): URI | undefined {
    if (!uri) {
      const root = this.tryGetRoots()[0];
      if (root) {
        return root.resource;
      }
      return undefined;
    }
    const rootUris: URI[] = [];
    for (const root of this.tryGetRoots()) {
      const rootUri = root.resource;
      if (rootUri && rootUri.isEqualOrParent(uri)) {
        rootUris.push(rootUri);
      }
    }
    return rootUris.sort((r1, r2) => r2.toString().length - r1.toString().length)[0];
  }

  /**
   * Adds root folder(s) to the workspace
   * @param uris URI or URIs of the root folder(s) to add
   */
  async addRoot(uris: URI[] | URI): Promise<void> {
    const toAdd = Array.isArray(uris) ? uris : [uris];
    await this.spliceRoots(this._roots.length, 0, ...toAdd);
  }

  async spliceRoots(start: number, deleteCount?: number, ...rootsToAdd: URI[]): Promise<URI[]> {
    if (!this._workspace) {
      throw new Error('There is not active workspace');
    }
    const dedup = new Set<string>();
    const roots = this._roots.map(root => (dedup.add(root.resource.toString()), root.resource.toString()));
    const toAdd: string[] = [];
    for (const root of rootsToAdd) {
      const uri = root.toString();
      if (!dedup.has(uri)) {
        dedup.add(uri);
        toAdd.push(uri);
      }
    }
    const toRemove = roots.splice(start, deleteCount || 0, ...toAdd);
    if (!toRemove.length && !toAdd.length) {
      return [];
    }
    if (this._workspace.isDirectory) {
      // const untitledWorkspace = await this.getUntitledWorkspace();
      const untitledWorkspace = new URI();
      await this.save(untitledWorkspace);
    }
    const currentData = await this.getWorkspaceDataFromFile();
    const newData = WorkspaceData.buildWorkspaceData(roots, currentData);
    await this.writeWorkspaceFile(this._workspace, newData);
    await this.updateWorkspace();
    return toRemove.map(root => new URI(root));
  }

  /**
   * Save workspace data into a file
   * @param uri URI or FileStat of the workspace file
   */
  async save(uri: URI | FileStat): Promise<void> {
    const resource = uri instanceof URI ? uri : uri.resource;
    if (!await this.fileService.exists(resource)) {
      await this.fileService.create(resource);
    }
    const workspaceData: WorkspaceData = {folders: [], settings: {}};
    if (!this.saved) {
      for (const p of Object.keys(this.schemaProvider.getCombinedSchema().properties)) {
        if (this.schemaProvider.isValidInScope(p, PreferenceScope.Default)) {
          continue;
        }
        const preferences = this.preferenceImpl.inspect(p);
        // if (preferences && preferences.workspaceValue) {
        //     workspaceData.settings![p] = preferences.workspaceValue;
        // }
      }
    }
    let stat = await this.toFileStat(resource);
    Object.assign(workspaceData, await this.getWorkspaceDataFromFile());
    console.log(stat);
    stat = await this.writeWorkspaceFile(stat, WorkspaceData.buildWorkspaceData(this._roots, workspaceData));
    console.log(stat);
    await this.setWorkspace(stat);
    this.onWorkspaceLocationChangedEmitter.fire(stat);
  }

  /**
   * Opens directory, or recreates a workspace from the file that `uri` points to.
   */
  open(uri: URI, options?: WorkspaceInput): void {
    this.doOpen(uri, options);
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.applicationName = FrontendApplicationConfigProvider.get().applicationName;
    const wsUri = await this.getDefaultWorkspaceUri();
    const wsStat = await this.toFileStat(wsUri);
    await this.setWorkspace(wsStat);
    this._ready.resolve();
  }

  protected async setWorkspace(workspaceStat: FileStat | undefined): Promise<void> {
    if (this._workspace && workspaceStat &&
        this._workspace.resource === workspaceStat.resource &&
        this._workspace.mtime === workspaceStat.mtime &&
        this._workspace.etag === workspaceStat.etag &&
        this._workspace.size === workspaceStat.size) {
      return;
    }
    this.toDisposeOnWorkspace.dispose();
    this._workspace = workspaceStat;
    if (this._workspace) {
      const uri = this._workspace.resource;
      if (this._workspace.isFile) {
        this.toDisposeOnWorkspace.push(this.fileService.watch(uri));
        this.onWorkspaceLocationChangedEmitter.fire(this._workspace);
      }
      this.setURLFragment(uri.path.toString());
    } else {
      this.setURLFragment('');
    }
    this.updateTitle();
    await this.updateWorkspace();
  }

  protected updateTitle(): void {
    let title: string | undefined;
    if (this._workspace) {
      const displayName = this._workspace.name;
      if (!this._workspace.isDirectory &&
          (displayName.endsWith(`.${WM_EXT}`) || displayName.endsWith(`.${VSCODE_EXT}`))) {
        title = displayName.slice(0, displayName.lastIndexOf('.'));
      } else {
        title = displayName;
      }
    }
    document.title = this.formatTitle(title);
  }

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
  protected getDefaultWorkspaceUri(): MaybePromise<string | undefined> {
    return this.doGetDefaultWorkspaceUri();
  }

  protected formatTitle(title?: string): string {
    const name = this.applicationName;
    return title ? `${title} — ${name}` : name;
  }

  // async getUntitledWorkspace(): Promise<URI> {
  //     return getTemporaryWorkspaceFileUri(this.envVariableServer);
  // }

  protected async doGetDefaultWorkspaceUri(): Promise<string | undefined> {

    // If an empty window is explicitly requested do not restore a previous workspace.
    // Note: `window.location.hash` includes leading "#" if non-empty.
    if (window.location.hash === `#${DEFAULT_WINDOW_HASH}`) {
      window.location.hash = '';
      return undefined;
    }

    // Prefer the workspace path specified as the URL fragment, if present.
    if (window.location.hash.length > 1) {
      // Remove the leading # and decode the URI.
      const wpPath = decodeURI(window.location.hash.substring(1));
      const workspaceUri = new URI().withPath(wpPath).withScheme('file');
      let workspaceStat: FileStat | undefined;
      try {
        workspaceStat = await this.fileService.resolve(workspaceUri);
      } catch {
      }
      if (workspaceStat && !workspaceStat.isDirectory && !this.isWorkspaceFile(workspaceStat)) {
        console.error(`Not a valid workspace file: ${workspaceUri}`);
        return undefined;
      }
      return workspaceUri.toString();
    } else {
      // Else, ask the server for its suggested workspace (usually the one
      // specified on the CLI, or the most recent).
      // return this.server.getMostRecentlyUsedWorkspace();
    }
  }

  protected async writeWorkspaceFile(workspaceFile: FileStat | undefined, workspaceData: WorkspaceData): Promise<FileStat | undefined> {
    if (workspaceFile) {
      const data = JSON.stringify(WorkspaceData.transformToRelative(workspaceData, workspaceFile));
      const edits = jsoncparser.format(data, undefined, {tabSize: 3, insertSpaces: true, eol: ''});
      const result = jsoncparser.applyEdits(data, edits);
      await this.fileService.write(workspaceFile.resource, result);
      return this.fileService.resolve(workspaceFile.resource);
    }
  }

  protected async watchRoot(root: FileStat): Promise<void> {
    const uriStr = root.resource.toString();
    if (this.rootWatchers.has(uriStr)) {
      return;
    }
    // const excludes = this.getExcludes(uriStr);
    const excludes = [];
    const watcher = this.fileService.watch(new URI(uriStr), {
      recursive: true,
      excludes
    });
    this.rootWatchers.set(uriStr, new DisposableCollection(
        watcher,
        Disposable.create(() => this.rootWatchers.delete(uriStr))
    ));
  }

  protected getExcludes(uri: string): string[] {
    const patterns = this.fsPreferences.get('files.watcherExclude', undefined, uri);
    return Object.keys(patterns).filter(pattern => patterns[pattern]);
  }

  protected async watchRoots(): Promise<void> {
    const rootUris = new Set(this._roots.map(r => r.resource.toString()));
    for (const [uri, watcher] of this.rootWatchers.entries()) {
      if (!rootUris.has(uri)) {
        watcher.dispose();
      }
    }
    for (const root of this._roots) {
      this.watchRoot(root);
    }
  }

  protected async updateWorkspace(): Promise<void> {
    await this.updateRoots();
    this.watchRoots();
  }

  protected async updateRoots(): Promise<void> {
    const newRoots = await this.computeRoots();
    let rootsChanged = false;
    if (newRoots.length !== this._roots.length || newRoots.length === 0) {
      rootsChanged = true;
    } else {
      for (const newRoot of newRoots) {
        if (!this._roots.some(r => r.resource.toString() === newRoot.resource.toString())) {
          rootsChanged = true;
          break;
        }
      }
    }
    if (rootsChanged) {
      this._roots = newRoots;
      this.deferredRoots.resolve(this._roots); // in order to resolve first
      this.deferredRoots = new Deferred<FileStat[]>();
      this.deferredRoots.resolve(this._roots);
      this.onWorkspaceChangeEmitter.fire(this._roots);
    }
  }

  /**
   * returns a FileStat if the argument URI points to an existing directory. Otherwise, `undefined`.
   */
  protected async toValidRoot(uri: URI | string | undefined): Promise<FileStat | undefined> {
    const fileStat = await this.toFileStat(uri);
    if (fileStat && fileStat.isDirectory) {
      return fileStat;
    }
    return undefined;
  }

  protected async computeRoots(): Promise<FileStat[]> {
    const roots: FileStat[] = [];
    if (this._workspace) {
      if (this._workspace.isDirectory) {
        return [this._workspace];
      }

      const workspaceData = await this.getWorkspaceDataFromFile();
      if (workspaceData) {
        for (const {path} of workspaceData.folders) {
          const valid = await this.toValidRoot(path);
          if (valid) {
            roots.push(valid);
          } else {
            roots.push(FileStat.dir(path));
          }
        }
      }
    }
    return roots;
  }

  protected async getWorkspaceDataFromFile(): Promise<WorkspaceData | undefined> {
    if (this._workspace && await this.fileService.exists(this._workspace.resource)) {
      if (this._workspace.isDirectory) {
        return {
          folders: [{path: this._workspace.resource.toString()}]
        };
      } else if (this.isWorkspaceFile(this._workspace)) {
        const stat = await this.fileService.read(this._workspace.resource);
        const strippedContent = jsoncparser.stripComments(stat.value);
        const data = jsoncparser.parse(strippedContent);
        if (data && WorkspaceData.is(data)) {
          return WorkspaceData.transformToAbsolute(data, stat);
        }
        // this.logger.error(`Unable to retrieve workspace data from the file: '${this.labelProvider.getLongName(this._workspace)}'. Please check if the file is corrupted.`);
      } else {
        // this.logger.warn(`Not a valid workspace file: ${this.labelProvider.getLongName(this._workspace)}`);
      }
    }
  }

  /**
   * Set the URL fragment to the given workspace path.
   */
  protected setURLFragment(workspacePath: string): void {
    window.location.hash = encodeURI(workspacePath);
  }

  protected async doOpen(uri: URI, options?: WorkspaceInput): Promise<void> {
    const rootUri = uri.toString();
    const stat = await this.toFileStat(rootUri);
    if (stat) {
      if (!stat.isDirectory && !this.isWorkspaceFile(stat)) {
        const message = `Not a valid workspace file: ${uri}`;
        throw new Error(message);
      }
      // The same window has to be preserved too (instead of opening a new one), if the workspace root is not yet available and we are setting it for the first time.
      // Option passed as parameter has the highest priority (for api developers), then the preference, then the default.
      await this.roots;
      const {preserveWindow} = {
        preserveWindow: this.preferences['workspace.preserveWindow'] || !this.opened,
        ...options
      };
      // await this.server.setMostRecentlyUsedWorkspace(rootUri);
      if (preserveWindow) {
        this._workspace = stat;
      }
      console.log(stat);
      console.log(preserveWindow);
      this.openWindow(stat, {preserveWindow});
      return;
    }
    throw new Error('Invalid workspace root URI. Expected an existing directory location.');
  }

  protected shouldPreserveWindow(options?: WorkspaceInput): boolean {
    return options !== undefined && !!options.preserveWindow;
  }

  protected reloadWindow(): void {
    // Set the new workspace path as the URL fragment.
    if (this._workspace !== undefined) {
      this.setURLFragment(this._workspace.resource.path.toString());
    } else {
      this.setURLFragment('');
    }

    window.location.reload();
  }

  protected openNewWindow(workspacePath: string): void {
    const url = new URL(window.location.href);
    url.hash = encodeURI(workspacePath);
    this.windowService.openNewWindow(url.toString());
  }

  protected openWindow(uri: FileStat, options?: WorkspaceInput): void {
    const workspacePath = uri.resource.path.toString();

    if (this.shouldPreserveWindow(options)) {
      this.reloadWindow();
    } else {
      try {
        this.openNewWindow(workspacePath);
      } catch (error) {
        // Fall back to reloading the current window in case the browser has blocked the new window
        this._workspace = uri;
        // this.logger.error(error.toString()).then(() => this.reloadWindow());
      }
    }
  }

  /**
   * returns a FileStat if the argument URI points to a file or directory. Otherwise, `undefined`.
   */
  protected async toFileStat(uri: URI | string | undefined): Promise<FileStat | undefined> {
    if (!uri) {
      return undefined;
    }
    let uriStr = uri.toString();
    try {
      if (uriStr.endsWith('/')) {
        uriStr = uriStr.slice(0, -1);
      }
      const normalizedUri = new URI(uriStr).normalizePath();
      return await this.fileService.resolve(normalizedUri);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Check if the file should be considered as a workspace file.
   *
   * Example: We should not try to read the contents of an .exe file.
   */
  protected isWorkspaceFile(fileStat: FileStat): boolean {
    return fileStat.resource.path.ext === `.${WM_EXT}` || fileStat.resource.path.ext === `.${VSCODE_EXT}`;
  }
}

export interface WorkspaceInput {

  /**
   * Tests whether the same window should be used or a new one has to be opened after setting the workspace root. By default it is `false`.
   */
  preserveWindow?: boolean;
}

export interface WorkspaceData {
  folders: Array<{ path: string, name?: string }>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: { [id: string]: any };
}

export namespace WorkspaceData {
  const validateSchema = new Ajv().compile(workspaceSchema);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function is(data: any): data is WorkspaceData {
    return !!validateSchema(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function buildWorkspaceData(folders: string[] | FileStat[], additionalFields?: Partial<WorkspaceData>): WorkspaceData {
    let roots: string[] = [];
    if (folders.length > 0) {
      if (typeof folders[0] !== 'string') {
        roots = (<FileStat[]>folders).map(folder => folder.resource.toString());
      } else {
        roots = <string[]>folders;
      }
    }
    const data: WorkspaceData = {
      folders: roots.map(folder => ({path: folder}))
    };
    if (additionalFields) {
      delete additionalFields.folders;
      Object.assign(data, additionalFields);
    }
    return data;
  }

  export function transformToRelative(data: WorkspaceData, workspaceFile?: FileStat): WorkspaceData {
    const folderUris: string[] = [];
    const workspaceFileUri = new URI(workspaceFile ? workspaceFile.resource.toString() : '').withScheme('file');
    for (const {path} of data.folders) {
      const folderUri = new URI(path).withScheme('file');
      const rel = workspaceFileUri.parent.relative(folderUri);
      if (rel) {
        folderUris.push(rel.toString());
      } else {
        folderUris.push(folderUri.toString());
      }
    }
    return buildWorkspaceData(folderUris, data);
  }

  export function transformToAbsolute(data: WorkspaceData, workspaceFile?: BaseStat): WorkspaceData {
    if (workspaceFile) {
      const folders: string[] = [];
      for (const folder of data.folders) {
        const path = folder.path;
        if (path.startsWith('file:///')) {
          folders.push(path);
        } else {
          folders.push(workspaceFile.resource.withScheme('file').parent.resolve(path).toString());
        }

      }
      return Object.assign(data, buildWorkspaceData(folders, data));
    }
    return data;
  }
}
