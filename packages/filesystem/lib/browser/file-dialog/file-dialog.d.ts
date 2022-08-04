import { AbstractDialog, DialogProps, Panel } from '@tart/core';
import { FileDialogTreeFilters, FileDialogTreeFiltersRenderer, FileDialogTreeFiltersRendererFactory } from './file-dialog-tree-filters-renderer';
import { Message } from '@lumino/messaging';
import { MaybeArray } from '@tart/core/lib/common';
import { FileStatNode } from '../file-tree';
import { LocationListRenderer, LocationListRendererFactory } from '../location';
import { FileDialogWidget } from './file-dialog-widget';
import { FileDialogModel } from './file-dialog-model';
import { LabelProvider } from '@tart/core/lib/browser';
import URI from '@tart/core/lib/common/uri';
export declare const OpenFileDialogFactory: unique symbol;
export interface OpenFileDialogFactory {
    (props: OpenFileDialogProps): OpenFileDialog;
}
export declare const SaveFileDialogFactory: unique symbol;
export interface SaveFileDialogFactory {
    (props: SaveFileDialogProps): SaveFileDialog;
}
export declare const SAVE_DIALOG_CLASS = "tart-SaveFileDialog";
export declare const NAVIGATION_PANEL_CLASS = "tart-NavigationPanel";
export declare const NAVIGATION_BACK_CLASS = "tart-NavigationBack";
export declare const NAVIGATION_FORWARD_CLASS = "tart-NavigationForward";
export declare const NAVIGATION_HOME_CLASS = "tart-NavigationHome";
export declare const NAVIGATION_UP_CLASS = "tart-NavigationUp";
export declare const NAVIGATION_LOCATION_LIST_PANEL_CLASS = "tart-LocationListPanel";
export declare const FILTERS_PANEL_CLASS = "tart-FiltersPanel";
export declare const FILTERS_LABEL_CLASS = "tart-FiltersLabel";
export declare const FILTERS_LIST_PANEL_CLASS = "tart-FiltersListPanel";
export declare const FILENAME_PANEL_CLASS = "tart-FileNamePanel";
export declare const FILENAME_LABEL_CLASS = "tart-FileNameLabel";
export declare const FILENAME_TEXTFIELD_CLASS = "tart-FileNameTextField";
export declare const CONTROL_PANEL_CLASS = "tart-ControlPanel";
export declare const TOOLBAR_ITEM_TRANSFORM_TIMEOUT = 100;
export declare class FileDialogProps extends DialogProps {
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
    filters?: FileDialogTreeFilters;
}
export declare class OpenFileDialogProps extends FileDialogProps {
    /**
     * A human-readable string for the accept button.
     */
    openLabel?: string;
    /**
     * Allow to select files, defaults to `true`.
     */
    canSelectFiles?: boolean;
    /**
     * Allow to select folders, defaults to `false`.
     */
    canSelectFolders?: boolean;
    /**
     * Allow to select many files or folders.
     */
    canSelectMany?: boolean;
}
export declare class SaveFileDialogProps extends FileDialogProps {
    /**
     * A human-readable string for the accept button.
     */
    saveLabel?: string;
    /**
     * A human-readable value for the input.
     */
    inputValue?: string;
}
export declare abstract class FileDialog<T> extends AbstractDialog<T> {
    readonly props: FileDialogProps;
    readonly widget: FileDialogWidget;
    readonly locationListFactory: LocationListRendererFactory;
    readonly treeFiltersFactory: FileDialogTreeFiltersRendererFactory;
    protected back: HTMLSpanElement;
    protected forward: HTMLSpanElement;
    protected home: HTMLSpanElement;
    protected up: HTMLSpanElement;
    protected locationListRenderer: LocationListRenderer;
    protected treeFiltersRenderer: FileDialogTreeFiltersRenderer | undefined;
    protected treePanel: Panel;
    constructor(props: FileDialogProps);
    get model(): FileDialogModel;
    init(): void;
    protected onUpdateRequest(msg: Message): void;
    protected handleEnter(event: KeyboardEvent): boolean | void;
    protected handleEscape(event: KeyboardEvent): boolean | void;
    protected targetIsDirectoryInput(target: EventTarget | null): boolean;
    protected targetIsInputToggle(target: EventTarget | null): boolean;
    protected appendFiltersPanel(): void;
    protected onAfterAttach(msg: Message): void;
    protected addTransformEffectToIcon(element: HTMLSpanElement): void;
    protected abstract getAcceptButtonLabel(): string;
    protected onActivateRequest(msg: Message): void;
}
export declare class OpenFileDialog extends FileDialog<MaybeArray<FileStatNode>> {
    readonly props: OpenFileDialogProps;
    constructor(props: OpenFileDialogProps);
    get value(): MaybeArray<FileStatNode>;
    init(): void;
    protected getAcceptButtonLabel(): string;
    protected isValid(value: MaybeArray<FileStatNode>): string;
    protected accept(): Promise<void>;
}
export declare class SaveFileDialog extends FileDialog<URI | undefined> {
    readonly props: SaveFileDialogProps;
    protected fileNameField: HTMLInputElement | undefined;
    protected readonly labelProvider: LabelProvider;
    constructor(props: SaveFileDialogProps);
    get value(): URI | undefined;
    init(): void;
    protected getAcceptButtonLabel(): string;
    protected onUpdateRequest(msg: Message): void;
    protected isValid(value: URI | undefined): string | boolean;
    protected onAfterAttach(msg: Message): void;
}
