import {inject, injectable} from 'inversify';
import {UriCommandHandler} from '@tartjs/core/lib/common/uri-command-handler';
import URI from '@tartjs/core/lib/common/uri';
import {FileService} from '@tartjs/filesystem/lib/browser/file-service';
import {ApplicationShell, ConfirmDialog, NavigatableWidget, SaveableWidget} from '@tartjs/core';
import {WorkspaceService} from './workspace-service';
import {FileSystemPreferences} from '@tartjs/filesystem/lib/browser/filesystem-preferences';
import {FileDeleteOptions, FileSystemProviderCapabilities} from '@tartjs/filesystem/lib/common/files';
import {WorkspaceUtils} from './workspace-utils';

@injectable()
export class WorkspaceDeleteHandler implements UriCommandHandler<URI[]> {

  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  @inject(WorkspaceUtils)
  protected readonly workspaceUtils: WorkspaceUtils;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(FileSystemPreferences)
  protected readonly fsPreferences: FileSystemPreferences;

  /**
   * Determine if the command is visible.
   *
   * @param uris URIs of selected resources.
   * @returns `true` if the command is visible.
   */
  isVisible(uris: URI[]): boolean {
    return !!uris.length && !this.workspaceUtils.containsRootDirectory(uris);
  }

  /**
   * Determine if the command is enabled.
   *
   * @param uris URIs of selected resources.
   * @returns `true` if the command is enabled.
   */
  isEnabled(uris: URI[]): boolean {
    return !!uris.length && !this.workspaceUtils.containsRootDirectory(uris);
  }

  /**
   * Execute the command.
   *
   * @param uris URIs of selected resources.
   */
  async execute(uris: URI[]): Promise<void> {
    const distinctUris = URI.getDistinctParents(uris);
    const resolved: FileDeleteOptions = {
      recursive: true,
      useTrash: this.fsPreferences['files.enableTrash'] && distinctUris[0] && this.fileService.hasCapability(distinctUris[0], FileSystemProviderCapabilities.Trash)
    };
    if (await this.confirm(distinctUris, resolved)) {
      await Promise.all(distinctUris.map(uri => this.delete(uri, resolved)));
    }
  }

  /**
   * Display dialog to confirm deletion.
   *
   * @param uris URIs of selected resources.
   */
  protected confirm(uris: URI[], options: FileDeleteOptions): Promise<boolean | undefined> {
    let title = `File${uris.length === 1 ? '' : 's'}`;
    if (options.useTrash) {
      title = 'Move ' + title + ' to Trash';
    } else {
      title = 'Delete ' + title;
    }
    return new ConfirmDialog({
      title,
      msg: this.getConfirmMessage(uris)
    }).open();
  }

  /**
   * Get the dialog confirmation message for deletion.
   *
   * @param uris URIs of selected resources.
   */
  protected getConfirmMessage(uris: URI[]): string | HTMLElement {
    const dirty = this.getDirty(uris);
    if (dirty.length) {
      if (dirty.length === 1) {
        return `Do you really want to delete ${dirty[0].path.base} with unsaved changes?`;
      }
      return `Do you really want to delete ${dirty.length} files with unsaved changes?`;
    }
    if (uris.length === 1) {
      return `Do you really want to delete ${uris[0].path.base}?`;
    }
    if (uris.length > 10) {
      return `Do you really want to delete all the ${uris.length} selected files?`;
    }
    const messageContainer = document.createElement('div');
    messageContainer.textContent = 'Do you really want to delete the following files?';
    const list = document.createElement('ul');
    list.style.listStyleType = 'none';
    for (const uri of uris) {
      const listItem = document.createElement('li');
      listItem.textContent = uri.path.base;
      list.appendChild(listItem);
    }
    messageContainer.appendChild(list);
    return messageContainer;
  }

  /**
   * Get which URI are presently dirty.
   *
   * @param uris URIs of selected resources.
   * @returns An array of dirty URI.
   */
  protected getDirty(uris: URI[]): URI[] {
    const dirty = new Map<string, URI>();
    const widgets = NavigatableWidget.getAffected(SaveableWidget.getDirty(this.shell.widgets), uris);
    for (const [resourceUri] of widgets) {
      dirty.set(resourceUri.toString(), resourceUri);
    }
    return [...dirty.values()];
  }

  /**
   * Perform deletion of a given URI.
   *
   * @param uri URI of selected resource.
   */
  protected async delete(uri: URI, options: FileDeleteOptions): Promise<void> {
    try {
      await Promise.all([
        this.closeWithoutSaving(uri),
        this.fileService.delete(uri, options)
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Close widget without saving changes.
   *
   * @param uri URI of a selected resource.
   */
  protected async closeWithoutSaving(uri: URI): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pending: Promise<any>[] = [];
    for (const [, widget] of NavigatableWidget.getAffected(this.shell.widgets, uri)) {
      pending.push(this.shell.closeWidget(widget.id, {save: false}));
    }
    await Promise.all(pending);
  }

}
