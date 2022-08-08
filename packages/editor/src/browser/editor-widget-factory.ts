import {inject, injectable} from 'inversify';
import {WidgetFactory} from '@tart/core/lib/browser/widget-manager';
import URI from '@tart/core/lib/common/uri';
import {LabelProvider, NavigatableWidgetOptions} from '@tart/core';
import {TextEditorProvider} from './editor';
import {SelectionService} from '@tart/core/lib/common';
import {EditorWidget} from './editor-widget';

@injectable()
export class EditorWidgetFactory implements WidgetFactory {

  static ID = 'code-editor-opener';
  readonly id = EditorWidgetFactory.ID;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(TextEditorProvider)
  protected readonly editorProvider: TextEditorProvider;
  @inject(SelectionService)
  protected readonly selectionService: SelectionService;

  static createID(uri: URI, counter?: number): string {
    return EditorWidgetFactory.ID
        + `:${uri.toString()}`
        + (counter !== undefined ? `:${counter}` : '');
  }

  createWidget(options: NavigatableWidgetOptions): Promise<EditorWidget> {
    const uri = new URI(options.uri);
    return this.createEditor(uri, options);
  }

  protected async createEditor(uri: URI, options?: NavigatableWidgetOptions): Promise<EditorWidget> {
    const newEditor = await this.constructEditor(uri);

    this.setLabels(newEditor, uri);
    const labelListener = this.labelProvider.onDidChange(event => {
      if (event.affects(uri)) {
        this.setLabels(newEditor, uri);
      }
    });
    newEditor.onDispose(() => labelListener.dispose());

    newEditor.id = EditorWidgetFactory.createID(uri, options?.counter);

    newEditor.title.closable = true;
    return newEditor;
  }

  protected async constructEditor(uri: URI): Promise<EditorWidget> {
    console.log('constructEditor');
    const textEditor = await this.editorProvider(uri);
    return new EditorWidget(textEditor, this.selectionService);
  }

  private setLabels(editor: EditorWidget, uri: URI): void {
    editor.title.caption = uri.path.toString();
    const icon = this.labelProvider.getIcon(uri);
    editor.title.label = this.labelProvider.getName(uri);
    editor.title.iconClass = icon + ' file-icon';
  }
}
