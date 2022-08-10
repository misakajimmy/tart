import { ApplicationShell, CompositeTreeNode, NavigatableWidget, TabBar, Widget } from '@tart/core';
import { FileStatNode, FileTreeModel } from '@tart/filesystem';
import { FileStat } from '@tart/filesystem/lib/common/files';
import { DisposableCollection } from '@tart/core/lib/common';
export interface OpenEditorNode extends FileStatNode {
    widget: Widget;
}
export declare class OpenEditorsModel extends FileTreeModel {
    static GROUP_NODE_ID_PREFIX: string;
    static AREA_NODE_ID_PREFIX: string;
    protected readonly applicationShell: ApplicationShell;
    protected toDisposeOnPreviewWidgetReplaced: DisposableCollection;
    protected _editorWidgetsByGroup: Map<number, {
        widgets: NavigatableWidget[];
        tabbar: TabBar<Widget>;
    }>;
    protected _editorWidgetsByArea: Map<ApplicationShell.Area, NavigatableWidget[]>;
    protected _lastEditorWidgetsByArea: Map<ApplicationShell.Area, NavigatableWidget[]>;
    protected cachedFileStats: Map<string, FileStat>;
    protected updateOpenWidgets: any;
    get editorWidgets(): NavigatableWidget[];
    getTabBarForGroup(id: number): TabBar<Widget> | undefined;
    protected init(): void;
    protected setupHandlers(): void;
    protected initializeRoot(): Promise<void>;
    protected doUpdateOpenWidgets(layoutModifiedArea?: ApplicationShell.Area): Promise<void>;
    protected shouldRebuildTreeOnLayoutModified(area: ApplicationShell.Area): boolean;
    protected tryCreateWidgetGroupMap(): Map<Widget, CompositeTreeNode>;
    protected buildRootFromOpenedWidgets(widgetsByArea: Map<ApplicationShell.Area, NavigatableWidget[]>): Promise<CompositeTreeNode>;
}
