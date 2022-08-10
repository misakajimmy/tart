/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import URI from '@tart/core/lib/common/uri';
import { MonacoEditor } from './monaco-editor';
import { DiffUris } from '@tart/core/lib/browser/diff-uris';
export class MonacoDiffEditor extends MonacoEditor {
    constructor(uri, node, originalModel, modifiedModel, services, diffNavigatorFactory, options, override) {
        super(uri, modifiedModel, node, services, options, override);
        this.uri = uri;
        this.node = node;
        this.originalModel = originalModel;
        this.modifiedModel = modifiedModel;
        this.diffNavigatorFactory = diffNavigatorFactory;
        this.documents.add(originalModel);
        const original = originalModel.textEditorModel;
        const modified = modifiedModel.textEditorModel;
        this._diffNavigator = diffNavigatorFactory.createdDiffNavigator(this._diffEditor, options);
        this._diffEditor.setModel({ original, modified });
    }
    get diffEditor() {
        return this._diffEditor;
    }
    get diffNavigator() {
        return this._diffNavigator;
    }
    isActionSupported(id) {
        const action = this._diffEditor.getSupportedActions().find(a => a.id === id);
        return !!action && action.isSupported() && super.isActionSupported(id);
    }
    deltaDecorations(params) {
        console.warn('`deltaDecorations` should be called on either the original, or the modified editor.');
        return [];
    }
    getResourceUri() {
        return new URI(this.originalModel.uri);
    }
    createMoveToUri(resourceUri) {
        const [left, right] = DiffUris.decode(this.uri);
        return DiffUris.encode(left.withPath(resourceUri.path), right.withPath(resourceUri.path));
    }
    create(options, override) {
        this._diffEditor = monaco.editor.createDiffEditor(this.node, Object.assign(Object.assign({}, options), { fixedOverflowWidgets: true }), override);
        this.editor = this._diffEditor.getModifiedEditor();
        return this._diffEditor;
    }
    resize(dimension) {
        if (this.node) {
            const layoutSize = this.computeLayoutSize(this.node, dimension);
            this._diffEditor.layout(layoutSize);
        }
    }
}

//# sourceMappingURL=../../lib/browser/monaco-diff-editor.js.map
