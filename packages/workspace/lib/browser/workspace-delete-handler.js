var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import URI from '@tart/core/lib/common/uri';
import { FileService } from '@tart/filesystem/lib/browser/file-service';
import { ApplicationShell, ConfirmDialog, NavigatableWidget, SaveableWidget } from '@tart/core';
import { WorkspaceService } from './workspace-service';
import { FileSystemPreferences } from '@tart/filesystem/lib/browser/filesystem-preferences';
import { WorkspaceUtils } from './workspace-utils';
let WorkspaceDeleteHandler = class WorkspaceDeleteHandler {
    /**
     * Determine if the command is visible.
     *
     * @param uris URIs of selected resources.
     * @returns `true` if the command is visible.
     */
    isVisible(uris) {
        return !!uris.length && !this.workspaceUtils.containsRootDirectory(uris);
    }
    /**
     * Determine if the command is enabled.
     *
     * @param uris URIs of selected resources.
     * @returns `true` if the command is enabled.
     */
    isEnabled(uris) {
        return !!uris.length && !this.workspaceUtils.containsRootDirectory(uris);
    }
    /**
     * Execute the command.
     *
     * @param uris URIs of selected resources.
     */
    async execute(uris) {
        const distinctUris = URI.getDistinctParents(uris);
        const resolved = {
            recursive: true,
            useTrash: this.fsPreferences['files.enableTrash'] && distinctUris[0] && this.fileService.hasCapability(distinctUris[0], 4096 /* FileSystemProviderCapabilities.Trash */)
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
    confirm(uris, options) {
        let title = `File${uris.length === 1 ? '' : 's'}`;
        if (options.useTrash) {
            title = 'Move ' + title + ' to Trash';
        }
        else {
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
    getConfirmMessage(uris) {
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
    getDirty(uris) {
        const dirty = new Map();
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
    async delete(uri, options) {
        try {
            await Promise.all([
                this.closeWithoutSaving(uri),
                this.fileService.delete(uri, options)
            ]);
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * Close widget without saving changes.
     *
     * @param uri URI of a selected resource.
     */
    async closeWithoutSaving(uri) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pending = [];
        for (const [, widget] of NavigatableWidget.getAffected(this.shell.widgets, uri)) {
            pending.push(this.shell.closeWidget(widget.id, { save: false }));
        }
        await Promise.all(pending);
    }
};
__decorate([
    inject(FileService)
], WorkspaceDeleteHandler.prototype, "fileService", void 0);
__decorate([
    inject(ApplicationShell)
], WorkspaceDeleteHandler.prototype, "shell", void 0);
__decorate([
    inject(WorkspaceUtils)
], WorkspaceDeleteHandler.prototype, "workspaceUtils", void 0);
__decorate([
    inject(WorkspaceService)
], WorkspaceDeleteHandler.prototype, "workspaceService", void 0);
__decorate([
    inject(FileSystemPreferences)
], WorkspaceDeleteHandler.prototype, "fsPreferences", void 0);
WorkspaceDeleteHandler = __decorate([
    injectable()
], WorkspaceDeleteHandler);
export { WorkspaceDeleteHandler };

//# sourceMappingURL=../../lib/browser/workspace-delete-handler.js.map
