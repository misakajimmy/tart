var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import React from 'react';
import { inject, injectable } from 'inversify';
import { ReactRenderer } from '@tart/core';
export const FILE_TREE_FILTERS_LIST_CLASS = 'tart-FileTreeFiltersList';
/**
 * A set of file filters that are used by the dialog. Each entry is a human readable label,
 * like "TypeScript", and an array of extensions, e.g.
 * ```ts
 * {
 *  'Images': ['png', 'jpg']
 *  'TypeScript': ['ts', 'tsx']
 * }
 * ```
 */
export class FileDialogTreeFilters {
}
export const FileDialogTreeFiltersRendererFactory = Symbol('FileDialogTreeFiltersRendererFactory');
export const FileDialogTreeFiltersRendererOptions = Symbol('FileDialogTreeFiltersRendererOptions');
let FileDialogTreeFiltersRenderer = class FileDialogTreeFiltersRenderer extends ReactRenderer {
    constructor(options) {
        super();
        this.options = options;
        this.handleFilterChanged = (e) => this.onFilterChanged(e);
        this.suppliedFilters = options.suppliedFilters;
        this.fileDialogTree = options.fileDialogTree;
        this.appliedFilters = Object.assign(Object.assign({}, this.suppliedFilters), { 'All Files': [] });
    }
    get locationList() {
        const locationList = this.host.getElementsByClassName(FILE_TREE_FILTERS_LIST_CLASS)[0];
        if (locationList instanceof HTMLSelectElement) {
            return locationList;
        }
        return undefined;
    }
    doRender() {
        if (!this.appliedFilters) {
            return undefined;
        }
        const options = Object.keys(this.appliedFilters).map(value => this.renderLocation(value));
        return React.createElement("select", { className: 'tart-select ' + FILE_TREE_FILTERS_LIST_CLASS, onChange: this.handleFilterChanged }, ...options);
    }
    renderLocation(value) {
        return React.createElement("option", { value: value, key: value }, value);
    }
    onFilterChanged(e) {
        const locationList = this.locationList;
        if (locationList) {
            const value = locationList.value;
            const filters = this.appliedFilters[value];
            this.fileDialogTree.setFilter(filters);
        }
        e.preventDefault();
        e.stopPropagation();
    }
};
FileDialogTreeFiltersRenderer = __decorate([
    injectable(),
    __param(0, inject(FileDialogTreeFiltersRendererOptions))
], FileDialogTreeFiltersRenderer);
export { FileDialogTreeFiltersRenderer };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog-tree-filters-renderer.js.map
