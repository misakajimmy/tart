var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EditorWidgetFactory_1;
import { inject, injectable } from 'inversify';
import URI from '@tart/core/lib/common/uri';
import { LabelProvider } from '@tart/core';
import { TextEditorProvider } from './editor';
import { SelectionService } from '@tart/core/lib/common';
import { EditorWidget } from './editor-widget';
let EditorWidgetFactory = EditorWidgetFactory_1 = class EditorWidgetFactory {
    constructor() {
        this.id = EditorWidgetFactory_1.ID;
    }
    static createID(uri, counter) {
        return EditorWidgetFactory_1.ID
            + `:${uri.toString()}`
            + (counter !== undefined ? `:${counter}` : '');
    }
    createWidget(options) {
        const uri = new URI(options.uri);
        return this.createEditor(uri, options);
    }
    async createEditor(uri, options) {
        const newEditor = await this.constructEditor(uri);
        this.setLabels(newEditor, uri);
        const labelListener = this.labelProvider.onDidChange(event => {
            if (event.affects(uri)) {
                this.setLabels(newEditor, uri);
            }
        });
        newEditor.onDispose(() => labelListener.dispose());
        newEditor.id = EditorWidgetFactory_1.createID(uri, options === null || options === void 0 ? void 0 : options.counter);
        newEditor.title.closable = true;
        return newEditor;
    }
    async constructEditor(uri) {
        console.log('constructEditor');
        const textEditor = await this.editorProvider(uri);
        return new EditorWidget(textEditor, this.selectionService);
    }
    setLabels(editor, uri) {
        editor.title.caption = uri.path.toString();
        const icon = this.labelProvider.getIcon(uri);
        editor.title.label = this.labelProvider.getName(uri);
        editor.title.iconClass = icon + ' file-icon';
    }
};
EditorWidgetFactory.ID = 'code-editor-opener';
__decorate([
    inject(LabelProvider)
], EditorWidgetFactory.prototype, "labelProvider", void 0);
__decorate([
    inject(TextEditorProvider)
], EditorWidgetFactory.prototype, "editorProvider", void 0);
__decorate([
    inject(SelectionService)
], EditorWidgetFactory.prototype, "selectionService", void 0);
EditorWidgetFactory = EditorWidgetFactory_1 = __decorate([
    injectable()
], EditorWidgetFactory);
export { EditorWidgetFactory };

//# sourceMappingURL=../../lib/browser/editor-widget-factory.js.map
