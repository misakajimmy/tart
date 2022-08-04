var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApplicationShellMouseTracker_1;
/**
 * Contribution that tracks `mouseup` and `mousedown` events.
 *
 * This is required to be able to track the `TabBar`, `DockPanel`, and `SidePanel` resizing and drag and drop events correctly
 * all over the application. By default, when the mouse is over an `iframe` we lose the mouse tracking ability, so whenever
 * we click (`mousedown`), we overlay a transparent `div` over the `iframe` in the Mini Browser, then we set the `display` of
 * the transparent `div` to `none` on `mouseup` events.
 */
import { inject, injectable } from 'inversify';
import { ApplicationShell } from './application-shell';
import { Disposable, DisposableCollection, Emitter } from '../../common';
import { PanelLayout, SplitPanel } from '@lumino/widgets';
import { addEventListener } from '../widgets';
let ApplicationShellMouseTracker = ApplicationShellMouseTracker_1 = class ApplicationShellMouseTracker {
    applicationShell;
    toDispose = new DisposableCollection();
    toDisposeOnActiveChange = new DisposableCollection();
    mouseupEmitter = new Emitter();
    mousedownEmitter = new Emitter();
    get onMouseup() {
        return this.mouseupEmitter.event;
    }
    get onMousedown() {
        return this.mousedownEmitter.event;
    }
    onStart() {
        // Here we need to attach a `mousedown` listener to the `TabBar`s, `DockPanel`s and the `SidePanel`s. Otherwise, Phosphor handles the event and stops the propagation.
        // Track the `mousedown` on the `TabBar` for the currently active widget.
        this.applicationShell.activeChanged.connect((shell, args) => {
            this.toDisposeOnActiveChange.dispose();
            if (args.newValue) {
                const tabBar = shell.getTabBarFor(args.newValue);
                if (tabBar) {
                    this.toDisposeOnActiveChange.push(addEventListener(tabBar.node, 'mousedown', this.mousedownListener, true));
                }
            }
        });
        // Track the `mousedown` events for the `SplitPanel`s, if any.
        const { layout } = this.applicationShell;
        if (layout instanceof PanelLayout) {
            this.toDispose.pushAll(layout.widgets.filter(ApplicationShellMouseTracker_1.isSplitPanel).map(splitPanel => addEventListener(splitPanel.node, 'mousedown', this.mousedownListener, true)));
        }
        // Track the `mousedown` on each `DockPanel`.
        const { mainPanel, bottomPanel, leftPanelHandler, rightPanelHandler } = this.applicationShell;
        this.toDispose.pushAll([mainPanel, bottomPanel, leftPanelHandler.dockPanel, rightPanelHandler.dockPanel]
            .map(panel => addEventListener(panel.node, 'mousedown', this.mousedownListener, true)));
        // The `mouseup` event has to be tracked on the `document`. Phosphor attaches to there.
        document.addEventListener('mouseup', this.mouseupListener, true);
        // Make sure it is disposed in the end.
        this.toDispose.pushAll([
            this.mousedownEmitter,
            this.mouseupEmitter,
            Disposable.create(() => document.removeEventListener('mouseup', this.mouseupListener, true))
        ]);
    }
    onStop() {
        this.toDispose.dispose();
        this.toDisposeOnActiveChange.dispose();
    }
    mouseupListener = e => this.mouseupEmitter.fire(e);
    mousedownListener = e => this.mousedownEmitter.fire(e);
};
__decorate([
    inject(ApplicationShell)
], ApplicationShellMouseTracker.prototype, "applicationShell", void 0);
ApplicationShellMouseTracker = ApplicationShellMouseTracker_1 = __decorate([
    injectable()
], ApplicationShellMouseTracker);
export { ApplicationShellMouseTracker };
(function (ApplicationShellMouseTracker) {
    function isSplitPanel(arg) {
        return arg instanceof SplitPanel;
    }
    ApplicationShellMouseTracker.isSplitPanel = isSplitPanel;
})(ApplicationShellMouseTracker || (ApplicationShellMouseTracker = {}));

//# sourceMappingURL=../../../lib/browser/shell/application-shell-mouse-tracker.js.map
