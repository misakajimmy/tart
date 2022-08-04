import { Emitter } from './emitter';
export var Disposable;
(function (Disposable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && typeof arg === 'object' && 'dispose' in arg && typeof arg['dispose'] === 'function';
    }
    Disposable.is = is;
    function create(func) {
        return {
            dispose: func
        };
    }
    Disposable.create = create;
    Disposable.NULL = create(() => {
    });
})(Disposable || (Disposable = {}));
export class DisposableCollection {
    disposables = [];
    onDisposeEmitter = new Emitter();
    disposingElements = false;
    constructor(...toDispose) {
        toDispose.forEach(d => this.push(d));
    }
    /**
     * This event is fired only once
     * on first dispose of not empty collection.
     */
    get onDispose() {
        return this.onDisposeEmitter.event;
    }
    get disposed() {
        return this.disposables.length === 0;
    }
    dispose() {
        if (this.disposed || this.disposingElements) {
            return;
        }
        this.disposingElements = true;
        while (!this.disposed) {
            try {
                this.disposables.pop().dispose();
            }
            catch (e) {
                console.error(e);
            }
        }
        this.disposingElements = false;
        this.checkDisposed();
    }
    push(disposable) {
        const disposables = this.disposables;
        disposables.push(disposable);
        const originalDispose = disposable.dispose.bind(disposable);
        const toRemove = Disposable.create(() => {
            const index = disposables.indexOf(disposable);
            if (index !== -1) {
                disposables.splice(index, 1);
            }
            this.checkDisposed();
        });
        disposable.dispose = () => {
            toRemove.dispose();
            disposable.dispose = originalDispose;
            originalDispose();
        };
        return toRemove;
    }
    pushAll(disposables) {
        return disposables.map(disposable => this.push(disposable));
    }
    checkDisposed() {
        if (this.disposed && !this.disposingElements) {
            this.onDisposeEmitter.fire(undefined);
            this.onDisposeEmitter.dispose();
        }
    }
}

//# sourceMappingURL=../../lib/common/disposable.js.map
