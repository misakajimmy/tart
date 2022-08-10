import { WidgetFactory } from '@tart/core/lib/browser/widget-manager';
import URI from '@tart/core/lib/common/uri';
import { LabelProvider, NavigatableWidgetOptions } from '@tart/core';
import { TextEditorProvider } from './editor';
import { SelectionService } from '@tart/core/lib/common';
import { EditorWidget } from './editor-widget';
export declare class EditorWidgetFactory implements WidgetFactory {
    static ID: string;
    readonly id: string;
    protected readonly labelProvider: LabelProvider;
    protected readonly editorProvider: TextEditorProvider;
    protected readonly selectionService: SelectionService;
    static createID(uri: URI, counter?: number): string;
    createWidget(options: NavigatableWidgetOptions): Promise<EditorWidget>;
    protected createEditor(uri: URI, options?: NavigatableWidgetOptions): Promise<EditorWidget>;
    protected constructEditor(uri: URI): Promise<EditorWidget>;
    private setLabels;
}
