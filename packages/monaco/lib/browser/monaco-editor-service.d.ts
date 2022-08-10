import ICodeEditor = monaco.editor.ICodeEditor;
import CommonCodeEditor = monaco.editor.CommonCodeEditor;
import IResourceEditorInput = monaco.editor.IResourceEditorInput;
import { ApplicationShell, OpenerService, PreferenceService, WidgetOpenMode } from '@tart/core/lib/browser';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import { EditorManager, EditorOpenerOptions } from '@tart/editor/lib/browser/editor-manager';
import { EditorWidget } from '@tart/editor/lib/browser/editor-widget';
export declare class MonacoEditorService extends monaco.services.CodeEditorServiceImpl {
    static readonly ENABLE_PREVIEW_PREFERENCE: string;
    protected readonly openerService: OpenerService;
    protected readonly m2p: MonacoToProtocolConverter;
    protected readonly shell: ApplicationShell;
    protected readonly editors: EditorManager;
    protected readonly preferencesService: PreferenceService;
    constructor();
    /**
     * Monaco active editor is either focused or last focused editor.
     */
    getActiveCodeEditor(): monaco.editor.IStandaloneCodeEditor | undefined;
    openCodeEditor(input: IResourceEditorInput, source?: ICodeEditor, sideBySide?: boolean): Promise<CommonCodeEditor | undefined>;
    protected findEditorWidgetByUri(widget: object | undefined, uriAsString: string): Promise<EditorWidget | undefined>;
    protected createEditorOpenerOptions(input: IResourceEditorInput, source?: ICodeEditor, sideBySide?: boolean): EditorOpenerOptions;
    protected getEditorOpenMode(input: IResourceEditorInput): WidgetOpenMode;
    protected getWidgetOptions(source?: ICodeEditor, sideBySide?: boolean): ApplicationShell.WidgetOptions | undefined;
}
