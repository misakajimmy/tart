var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MonacoEditorService_1;
import { MonacoEditor } from './monaco-editor';
import { decorate, inject, injectable } from 'inversify';
import { MonacoEditorModel } from './monaco-editor-model';
import { ApplicationShell, open, OpenerService, PreferenceService } from '@tart/core/lib/browser';
import { MonacoToProtocolConverter } from './monaco-to-protocol-converter';
import URI from '@tart/core/lib/common/uri';
import { EditorManager } from '@tart/editor/lib/browser/editor-manager';
import { CustomEditorWidget } from '@tart/editor/lib/browser/editor';
import { EditorWidget } from '@tart/editor/lib/browser/editor-widget';
decorate(injectable(), monaco.services.CodeEditorServiceImpl);
let MonacoEditorService = MonacoEditorService_1 = class MonacoEditorService extends monaco.services.CodeEditorServiceImpl {
    constructor() {
        super(undefined, monaco.services.StaticServices.standaloneThemeService.get());
    }
    /**
     * Monaco active editor is either focused or last focused editor.
     */
    getActiveCodeEditor() {
        let editor = MonacoEditor.getCurrent(this.editors);
        if (!editor && CustomEditorWidget.is(this.shell.activeWidget)) {
            const model = this.shell.activeWidget.modelRef.object;
            if (model.editorTextModel instanceof MonacoEditorModel) {
                editor = MonacoEditor.findByDocument(this.editors, model.editorTextModel)[0];
            }
        }
        return editor && editor.getControl();
    }
    async openCodeEditor(input, source, sideBySide) {
        const uri = new URI(input.resource.toString());
        const openerOptions = this.createEditorOpenerOptions(input, source, sideBySide);
        const widget = await open(this.openerService, uri, openerOptions);
        const editorWidget = await this.findEditorWidgetByUri(widget, uri.toString());
        if (editorWidget && editorWidget.editor instanceof MonacoEditor) {
            return editorWidget.editor.getControl();
        }
        return undefined;
    }
    async findEditorWidgetByUri(widget, uriAsString) {
        if (widget instanceof EditorWidget) {
            if (widget.editor.uri.toString() === uriAsString) {
                return widget;
            }
            return undefined;
        }
        if (ApplicationShell.TrackableWidgetProvider.is(widget)) {
            for (const childWidget of widget.getTrackableWidgets()) {
                const editorWidget = await this.findEditorWidgetByUri(childWidget, uriAsString);
                if (editorWidget) {
                    return editorWidget;
                }
            }
        }
        return undefined;
    }
    createEditorOpenerOptions(input, source, sideBySide) {
        const mode = this.getEditorOpenMode(input);
        const selection = input.options && this.m2p.asRange(input.options.selection);
        const widgetOptions = this.getWidgetOptions(source, sideBySide);
        const preview = !!this.preferencesService.get(MonacoEditorService_1.ENABLE_PREVIEW_PREFERENCE, false);
        return { mode: mode, selection, widgetOptions, preview };
    }
    getEditorOpenMode(input) {
        const options = Object.assign({ preserveFocus: false, revealIfVisible: true }, input.options);
        if (options.preserveFocus) {
            return 'reveal';
        }
        return options.revealIfVisible ? 'activate' : 'open';
    }
    getWidgetOptions(source, sideBySide) {
        const ref = MonacoEditor.getWidgetFor(this.editors, source);
        if (!ref) {
            return undefined;
        }
        const area = (ref && this.shell.getAreaFor(ref)) || 'main';
        const mode = ref && sideBySide ? 'split-right' : undefined;
        return { area, mode, ref };
    }
};
MonacoEditorService.ENABLE_PREVIEW_PREFERENCE = 'editor.enablePreview';
__decorate([
    inject(OpenerService)
], MonacoEditorService.prototype, "openerService", void 0);
__decorate([
    inject(MonacoToProtocolConverter)
], MonacoEditorService.prototype, "m2p", void 0);
__decorate([
    inject(ApplicationShell)
], MonacoEditorService.prototype, "shell", void 0);
__decorate([
    inject(EditorManager)
], MonacoEditorService.prototype, "editors", void 0);
__decorate([
    inject(PreferenceService)
], MonacoEditorService.prototype, "preferencesService", void 0);
MonacoEditorService = MonacoEditorService_1 = __decorate([
    injectable()
], MonacoEditorService);
export { MonacoEditorService };

//# sourceMappingURL=../../lib/browser/monaco-editor-service.js.map
