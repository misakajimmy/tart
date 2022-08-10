/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
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
import { Disposable, DisposableCollection } from '@tart/core/lib/common/disposable';
export class MonacoDiagnosticCollection {
    constructor(name, p2m) {
        this.name = name;
        this.p2m = p2m;
        this.diagnostics = new Map();
        this.toDispose = new DisposableCollection();
    }
    dispose() {
        this.toDispose.dispose();
    }
    get(uri) {
        const diagnostics = this.diagnostics.get(uri);
        return !!diagnostics ? diagnostics.diagnostics : [];
    }
    set(uri, diagnostics) {
        const existing = this.diagnostics.get(uri);
        if (existing) {
            existing.diagnostics = diagnostics;
        }
        else {
            const modelDiagnostics = new MonacoModelDiagnostics(uri, diagnostics, this.name, this.p2m);
            this.diagnostics.set(uri, modelDiagnostics);
            this.toDispose.push(Disposable.create(() => {
                this.diagnostics.delete(uri);
                modelDiagnostics.dispose();
            }));
        }
    }
}
export class MonacoModelDiagnostics {
    constructor(uri, diagnostics, owner, p2m) {
        this.owner = owner;
        this.p2m = p2m;
        this._markers = [];
        this._diagnostics = [];
        this.uri = monaco.Uri.parse(uri);
        this.diagnostics = diagnostics;
        monaco.editor.onDidCreateModel(model => this.doUpdateModelMarkers(model));
    }
    get markers() {
        return this._markers;
    }
    get diagnostics() {
        return this._diagnostics;
    }
    set diagnostics(diagnostics) {
        this._diagnostics = diagnostics;
        this._markers = this.p2m.asDiagnostics(diagnostics);
        this.updateModelMarkers();
    }
    dispose() {
        this._markers = [];
        this.updateModelMarkers();
    }
    updateModelMarkers() {
        const model = monaco.editor.getModel(this.uri);
        this.doUpdateModelMarkers(model ? model : undefined);
    }
    doUpdateModelMarkers(model) {
        if (model && this.uri.toString() === model.uri.toString()) {
            monaco.editor.setModelMarkers(model, this.owner, this._markers);
        }
    }
}

//# sourceMappingURL=../../lib/browser/monaco-diagnostic-collection.js.map
