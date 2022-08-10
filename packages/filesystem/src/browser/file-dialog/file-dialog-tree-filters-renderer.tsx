import React from 'react';
import {FileDialogTree} from './file-dialog-tree';
import {inject, injectable} from 'inversify';
import {ReactRenderer} from '@tartjs/core';

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
    [name: string]: string[];
}

export const FileDialogTreeFiltersRendererFactory = Symbol('FileDialogTreeFiltersRendererFactory');

export interface FileDialogTreeFiltersRendererFactory {
    (options: FileDialogTreeFiltersRendererOptions): FileDialogTreeFiltersRenderer;
}

export const FileDialogTreeFiltersRendererOptions = Symbol('FileDialogTreeFiltersRendererOptions');

export interface FileDialogTreeFiltersRendererOptions {
    suppliedFilters: FileDialogTreeFilters;
    fileDialogTree: FileDialogTree;
}

@injectable()
export class FileDialogTreeFiltersRenderer extends ReactRenderer {

    readonly appliedFilters: FileDialogTreeFilters;
    readonly suppliedFilters: FileDialogTreeFilters;
    readonly fileDialogTree: FileDialogTree;

    constructor(
        @inject(FileDialogTreeFiltersRendererOptions) readonly options: FileDialogTreeFiltersRendererOptions
    ) {
        super();
        this.suppliedFilters = options.suppliedFilters;
        this.fileDialogTree = options.fileDialogTree;
        this.appliedFilters = {...this.suppliedFilters, 'All Files': [],};
    }

    get locationList(): HTMLSelectElement | undefined {
        const locationList = this.host.getElementsByClassName(FILE_TREE_FILTERS_LIST_CLASS)[0];
        if (locationList instanceof HTMLSelectElement) {
            return locationList;
        }
        return undefined;
    }

    protected readonly handleFilterChanged = (e: React.ChangeEvent<HTMLSelectElement>) => this.onFilterChanged(e);

    protected doRender(): React.ReactNode {
        if (!this.appliedFilters) {
            return undefined;
        }

        const options = Object.keys(this.appliedFilters).map(value => this.renderLocation(value));
        return <select className={'tart-select ' + FILE_TREE_FILTERS_LIST_CLASS}
                       onChange={this.handleFilterChanged}>{...options}</select>;
    }

    protected renderLocation(value: string): React.ReactNode {
        return <option value={value} key={value}>{value}</option>;
    }

    protected onFilterChanged(e: React.ChangeEvent<HTMLSelectElement>): void {
        const locationList = this.locationList;
        if (locationList) {
            const value = locationList.value;
            const filters = this.appliedFilters[value];
            this.fileDialogTree.setFilter(filters);
        }

        e.preventDefault();
        e.stopPropagation();
    }

}
