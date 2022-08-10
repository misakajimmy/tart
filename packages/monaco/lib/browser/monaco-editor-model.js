import { TextDocumentSaveReason } from 'vscode-languageserver-protocol';
import { CancellationTokenSource, Disposable, DisposableCollection, Emitter, Resource, ResourceError } from '@tart/core/lib/common';
import { Range } from 'vscode-languageserver-types';
export { TextDocumentSaveReason };
export class MonacoEditorModel {
    constructor(resource, m2p, p2m, editorPreferences) {
        this.resource = resource;
        this.m2p = m2p;
        this.p2m = p2m;
        this.editorPreferences = editorPreferences;
        this.autoSave = 'on';
        this.autoSaveDelay = 500;
        this.suppressOpenEditorWhenDirty = false;
        this.lineNumbersMinChars = 3;
        /* @deprecated there is no general save timeout, each participant should introduce a sensible timeout  */
        this.onWillSaveLoopTimeOut = 1500;
        this.toDispose = new DisposableCollection();
        this.toDisposeOnAutoSave = new DisposableCollection();
        this.onDidChangeContentEmitter = new Emitter();
        this.onDidChangeContent = this.onDidChangeContentEmitter.event;
        this.onDidSaveModelEmitter = new Emitter();
        this.onDidSaveModel = this.onDidSaveModelEmitter.event;
        this.onWillSaveModelEmitter = new Emitter();
        this.onWillSaveModel = this.onWillSaveModelEmitter.event;
        this.onDidChangeValidEmitter = new Emitter();
        this.onDidChangeValid = this.onDidChangeValidEmitter.event;
        this.onDidChangeEncodingEmitter = new Emitter();
        this.onDidChangeEncoding = this.onDidChangeEncodingEmitter.event;
        this.onDirtyChangedEmitter = new Emitter();
        this.pendingOperation = Promise.resolve();
        this.syncCancellationTokenSource = new CancellationTokenSource();
        this.ignoreDirtyEdits = false;
        this.saveCancellationTokenSource = new CancellationTokenSource();
        this.ignoreContentChanges = false;
        this.contentChanges = [];
        /**
         * Use `valid` to access it.
         * Use `setValid` to mutate it.
         */
        this._valid = false;
        this._dirty = false;
        // this.toDispose.push(resource);
        this.toDispose.push(this.toDisposeOnAutoSave);
        this.toDispose.push(this.onDidChangeContentEmitter);
        this.toDispose.push(this.onDidSaveModelEmitter);
        this.toDispose.push(this.onWillSaveModelEmitter);
        this.toDispose.push(this.onDirtyChangedEmitter);
        this.toDispose.push(this.onDidChangeValidEmitter);
        this.toDispose.push(Disposable.create(() => this.cancelSave()));
        this.toDispose.push(Disposable.create(() => this.cancelSync()));
        this.resolveModel = this.readContents().then(content => this.initialize(content || ''));
    }
    /**
     * Whether it is possible to load content from the underlying resource.
     */
    get valid() {
        return this._valid;
    }
    get dirty() {
        return this._dirty;
    }
    get onDirtyChanged() {
        return this.onDirtyChangedEmitter.event;
    }
    get uri() {
        return '';
        // return this.resource.uri.toString();
    }
    get languageId() {
        return this._languageId !== undefined ? this._languageId : this.model.getModeId();
    }
    get version() {
        return this.model.getVersionId();
    }
    get lineCount() {
        return this.model.getLineCount();
    }
    get readOnly() {
        return this.resource.saveContents === undefined;
    }
    get onDispose() {
        return this.toDispose.onDispose;
    }
    get textEditorModel() {
        return this.model;
    }
    dispose() {
        this.toDispose.dispose();
    }
    setEncoding(encoding, mode) {
        if (mode === 1 /* EncodingMode.Decode */ && this.dirty) {
            return Promise.resolve();
        }
        if (!this.setPreferredEncoding(encoding)) {
            return Promise.resolve();
        }
        if (mode === 1 /* EncodingMode.Decode */) {
            return this.sync();
        }
        return this.scheduleSave(TextDocumentSaveReason.Manual, this.cancelSave(), true);
    }
    getEncoding() {
        return this.preferredEncoding || this.contentEncoding;
    }
    /**
     * It's a hack to dispatch close notification with an old language id, don't use it.
     */
    setLanguageId(languageId) {
        this._languageId = languageId;
    }
    /**
     * Return selected text by Range or all text by default
     */
    getText(range) {
        if (!range) {
            return this.model.getValue();
        }
        else {
            return this.model.getValueInRange(this.p2m.asRange(range));
        }
    }
    positionAt(offset) {
        const { lineNumber, column } = this.model.getPositionAt(offset);
        return this.m2p.asPosition(lineNumber, column);
    }
    offsetAt(position) {
        return this.model.getOffsetAt(this.p2m.asPosition(position));
    }
    /**
     * Retrieves a line in a text document expressed as a one-based position.
     */
    getLineContent(lineNumber) {
        return this.model.getLineContent(lineNumber);
    }
    getLineMaxColumn(lineNumber) {
        return this.model.getLineMaxColumn(lineNumber);
    }
    /**
     * Find all matches in an editor for the given options.
     * @param options the options for finding matches.
     *
     * @returns the list of matches.
     */
    findMatches(options) {
        const wordSeparators = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';
        const results = this.model.findMatches(options.searchString, false, options.isRegex, options.matchCase, 
        // eslint-disable-next-line no-null/no-null
        options.matchWholeWord ? wordSeparators : null, true, options.limitResultCount);
        const extractedMatches = [];
        results.forEach(r => {
            if (r.matches) {
                extractedMatches.push({
                    matches: r.matches,
                    range: Range.create(r.range.startLineNumber, r.range.startColumn, r.range.endLineNumber, r.range.endColumn)
                });
            }
        });
        return extractedMatches;
    }
    async load() {
        await this.resolveModel;
        return this;
    }
    save(options) {
        return this.scheduleSave(TextDocumentSaveReason.Manual, undefined, undefined, options);
    }
    async sync() {
        const token = this.cancelSync();
        return this.run(() => this.doSync(token));
    }
    async revert(options) {
        //this.trace(log => log('MonacoEditorModel.revert - enter'));
        this.cancelSave();
        const soft = options && options.soft;
        if (soft !== true) {
            const dirty = this._dirty;
            this._dirty = false;
            try {
                await this.sync();
            }
            finally {
                this._dirty = dirty;
            }
        }
        this.setDirty(false);
        //this.trace('MonacoEditorModel.revert - exit');
    }
    createSnapshot() {
        return {
            value: this.getText()
        };
    }
    applySnapshot(snapshot) {
        this.model.setValue(snapshot.value);
    }
    setPreferredEncoding(encoding) {
        if (encoding === this.preferredEncoding || (!this.preferredEncoding && encoding === this.contentEncoding)) {
            return false;
        }
        this.preferredEncoding = encoding;
        this.onDidChangeEncodingEmitter.fire(encoding);
        return true;
    }
    updateContentEncoding() {
        const contentEncoding = this.resource.encoding;
        if (!contentEncoding || this.contentEncoding === contentEncoding) {
            return;
        }
        this.contentEncoding = contentEncoding;
        if (!this.preferredEncoding) {
            this.onDidChangeEncodingEmitter.fire(contentEncoding);
        }
    }
    /**
     * #### Important
     * Only this method can create an instance of `monaco.editor.IModel`,
     * there should not be other calls to `monaco.editor.createModel`.
     */
    initialize(value) {
        if (!this.toDispose.disposed) {
            const uri = monaco.Uri.parse(this.resource.uri.toString());
            let firstLine;
            if (typeof value === 'string') {
                firstLine = value;
                const firstLF = value.indexOf('\n');
                if (firstLF !== -1) {
                    firstLine = value.substring(0, firstLF);
                }
            }
            else {
                firstLine = value.getFirstLineText(1000);
            }
            const languageSelection = monaco.services.StaticServices.modeService.get().createByFilepathOrFirstLine(uri, firstLine);
            this.model = monaco.services.StaticServices.modelService.get().createModel(value, languageSelection, uri);
            this.resourceVersion = this.resource.version;
            this.updateSavedVersionId();
            this.toDispose.push(this.model);
            this.toDispose.push(this.model.onDidChangeContent(event => this.fireDidChangeContent(event)));
            if (this.resource.onDidChangeContents) {
                this.toDispose.push(this.resource.onDidChangeContents(() => this.sync()));
            }
        }
    }
    setValid(valid) {
        if (valid === this._valid) {
            return;
        }
        this._valid = valid;
        this.onDidChangeValidEmitter.fire(undefined);
    }
    setDirty(dirty) {
        if (dirty === this._dirty) {
            return;
        }
        this._dirty = dirty;
        if (dirty === false) {
            this.updateSavedVersionId();
        }
        this.onDirtyChangedEmitter.fire(undefined);
    }
    async run(operation) {
        if (this.toDispose.disposed) {
            return;
        }
        return this.pendingOperation = this.pendingOperation.then(async () => {
            try {
                await operation();
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    cancelSync() {
        //this.trace(log => log('MonacoEditorModel.cancelSync'));
        this.syncCancellationTokenSource.cancel();
        this.syncCancellationTokenSource = new CancellationTokenSource();
        return this.syncCancellationTokenSource.token;
    }
    async doSync(token) {
        //this.trace(log => log('MonacoEditorModel.doSync - enter'));
        if (token.isCancellationRequested) {
            //this.trace(log => log('MonacoEditorModel.doSync - exit - cancelled'));
            return;
        }
        const value = await this.readContents();
        if (value === undefined) {
            //this.trace(log => log('MonacoEditorModel.doSync - exit - resource not found'));
            return;
        }
        if (token.isCancellationRequested) {
            //this.trace(log => log('MonacoEditorModel.doSync - exit - cancelled while looking for a resource'));
            return;
        }
        if (this._dirty) {
            //this.trace(log => log('MonacoEditorModel.doSync - exit - pending dirty changes'));
            return;
        }
        this.resourceVersion = this.resource.version;
        this.updateModel(() => monaco.services.StaticServices.modelService.get().updateModel(this.model, value), {
            ignoreDirty: true,
            ignoreContentChanges: true
        });
        //this.trace(log => log('MonacoEditorModel.doSync - exit'));
    }
    async readContents() {
        try {
            const options = { encoding: this.getEncoding() };
            const content = await (this.resource.readStream ? this.resource.readStream(options) : this.resource.readContents(options));
            let value;
            if (typeof content === 'string') {
                value = content;
            }
            else {
                value = monaco.textModel.createTextBufferFactoryFromStream(content);
            }
            this.updateContentEncoding();
            this.setValid(true);
            return value;
        }
        catch (e) {
            this.setValid(false);
            if (ResourceError.NotFound.is(e)) {
                return undefined;
            }
            throw e;
        }
    }
    markAsDirty() {
        //this.trace(log => log('MonacoEditorModel.markAsDirty - enter'));
        if (this.ignoreDirtyEdits) {
            //this.trace(log => log('MonacoEditorModel.markAsDirty - exit - ignoring dirty changes enabled'));
            return;
        }
        this.cancelSync();
        this.setDirty(true);
        this.doAutoSave();
        //this.trace(log => log('MonacoEditorModel.markAsDirty - exit'));
    }
    doAutoSave() {
        if (this.autoSave === 'on') {
            const token = this.cancelSave();
            this.toDisposeOnAutoSave.dispose();
            const handle = window.setTimeout(() => {
                this.scheduleSave(TextDocumentSaveReason.AfterDelay, token);
            }, this.autoSaveDelay);
            this.toDisposeOnAutoSave.push(Disposable.create(() => window.clearTimeout(handle)));
        }
    }
    cancelSave() {
        //this.trace(log => log('MonacoEditorModel.cancelSave'));
        this.saveCancellationTokenSource.cancel();
        this.saveCancellationTokenSource = new CancellationTokenSource();
        return this.saveCancellationTokenSource.token;
    }
    scheduleSave(reason, token = this.cancelSave(), overwriteEncoding, options) {
        return this.run(() => this.doSave(reason, token, overwriteEncoding, options));
    }
    pushContentChanges(contentChanges) {
        if (!this.ignoreContentChanges) {
            this.contentChanges.push(...contentChanges);
        }
    }
    fireDidChangeContent(event) {
        //this.trace(log => log(`MonacoEditorModel.fireDidChangeContent - enter - ${JSON.stringify(event, undefined, 2)}`));
        if (this.model.getAlternativeVersionId() === this.bufferSavedVersionId) {
            this.setDirty(false);
        }
        else {
            this.markAsDirty();
        }
        const changeContentEvent = this.asContentChangedEvent(event);
        this.onDidChangeContentEmitter.fire(changeContentEvent);
        this.pushContentChanges(changeContentEvent.contentChanges);
        //this.trace(log => log('MonacoEditorModel.fireDidChangeContent - exit'));
    }
    asContentChangedEvent(event) {
        const contentChanges = event.changes.map(change => this.asTextDocumentContentChangeEvent(change));
        return { model: this, contentChanges };
    }
    asTextDocumentContentChangeEvent(change) {
        const range = this.m2p.asRange(change.range);
        const rangeLength = change.rangeLength;
        const text = change.text;
        return { range, rangeLength, text };
    }
    applyEdits(operations, options) {
        return this.updateModel(() => this.model.applyEdits(operations), options);
    }
    updateModel(doUpdate, options) {
        const resolvedOptions = Object.assign({ ignoreDirty: false, ignoreContentChanges: false }, options);
        const { ignoreDirtyEdits, ignoreContentChanges } = this;
        this.ignoreDirtyEdits = resolvedOptions.ignoreDirty;
        this.ignoreContentChanges = resolvedOptions.ignoreContentChanges;
        try {
            return doUpdate();
        }
        finally {
            this.ignoreDirtyEdits = ignoreDirtyEdits;
            this.ignoreContentChanges = ignoreContentChanges;
        }
    }
    async doSave(reason, token, overwriteEncoding, options) {
        if (token.isCancellationRequested || !this.resource.saveContents) {
            return;
        }
        await this.fireWillSaveModel(reason, token, options);
        if (token.isCancellationRequested) {
            return;
        }
        const changes = [...this.contentChanges];
        if (changes.length === 0 && !overwriteEncoding && reason !== TextDocumentSaveReason.Manual) {
            return;
        }
        const contentLength = this.model.getValueLength();
        const content = this.model.createSnapshot() || this.model.getValue();
        try {
            const encoding = this.getEncoding();
            const version = this.resourceVersion;
            await Resource.save(this.resource, {
                changes,
                content,
                contentLength,
                options: { encoding, overwriteEncoding, version }
            }, token);
            this.contentChanges.splice(0, changes.length);
            this.resourceVersion = this.resource.version;
            this.updateContentEncoding();
            this.setValid(true);
            if (token.isCancellationRequested) {
                return;
            }
            this.setDirty(false);
            this.fireDidSaveModel();
        }
        catch (e) {
            if (!ResourceError.OutOfSync.is(e)) {
                throw e;
            }
        }
    }
    async fireWillSaveModel(reason, token, options) {
        const firing = this.onWillSaveModelEmitter.sequence(async (listener) => {
            if (token.isCancellationRequested) {
                return false;
            }
            const waitables = [];
            const { version } = this;
            const event = {
                model: this, reason, options,
                waitUntil: (thenable) => {
                    if (Object.isFrozen(waitables)) {
                        throw new Error('waitUntil cannot be called asynchronously.');
                    }
                    waitables.push(thenable);
                }
            };
            // Fire.
            try {
                listener(event);
            }
            catch (err) {
                console.error(err);
                return true;
            }
            // Asynchronous calls to `waitUntil` should fail.
            Object.freeze(waitables);
            // Wait for all promises.
            const edits = await Promise.all(waitables).then(allOperations => [].concat(...allOperations));
            if (token.isCancellationRequested) {
                return false;
            }
            // In a perfect world, we should only apply edits if document is clean.
            if (version !== this.version) {
                console.error('onWillSave listeners should provide edits, not directly alter the document.');
            }
            // Finally apply edits provided by this listener before firing the next.
            if (edits && edits.length > 0) {
                this.applyEdits(edits, {
                    ignoreDirty: true,
                });
            }
            return true;
        });
        try {
            await firing;
        }
        catch (e) {
            console.error(e);
        }
    }
    fireDidSaveModel() {
        this.onDidSaveModelEmitter.fire(this.model);
    }
    trace() {
        console.log(this.resource.uri.toString(true));
    }
    updateSavedVersionId() {
        this.bufferSavedVersionId = this.model.getAlternativeVersionId();
    }
}

//# sourceMappingURL=../../lib/browser/monaco-editor-model.js.map
