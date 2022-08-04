import { FrontendApplicationContribution } from '../frontend-application';
import { ApplicationShell } from './application-shell';
import { DisposableCollection, Emitter, Event } from '../../common';
import { SplitPanel } from '@lumino/widgets';
import { Widget } from '../widgets';
export declare class ApplicationShellMouseTracker implements FrontendApplicationContribution {
    protected readonly applicationShell: ApplicationShell;
    protected readonly toDispose: DisposableCollection;
    protected readonly toDisposeOnActiveChange: DisposableCollection;
    protected readonly mouseupEmitter: Emitter<MouseEvent>;
    protected readonly mousedownEmitter: Emitter<MouseEvent>;
    get onMouseup(): Event<MouseEvent>;
    get onMousedown(): Event<MouseEvent>;
    onStart(): void;
    onStop(): void;
    protected readonly mouseupListener: (e: MouseEvent) => void;
    protected readonly mousedownListener: (e: MouseEvent) => void;
}
export declare namespace ApplicationShellMouseTracker {
    function isSplitPanel(arg: Widget): arg is SplitPanel;
}
