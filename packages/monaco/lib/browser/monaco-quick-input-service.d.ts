/// <reference types="@theia/monaco-editor-core/monaco" />
import { CancellationToken, Event } from '@tart/core/lib/common';
import { InputBox, InputOptions, PickOptions, QuickInputService, QuickPick, QuickPickItem, QuickPickItemHighlights, QuickPickOptions } from '@tart/core/lib/common/quick-pick-service';
import { KeybindingRegistry } from '@tart/core/lib/browser/keybinding';
export declare class MonacoQuickInputImplementation implements monaco.quickInput.IQuickInputService {
    controller: monaco.quickInput.QuickInputController;
    quickAccess: monaco.quickInput.IQuickAccessController;
    protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService;
    protected container: HTMLElement;
    private quickInputList;
    constructor();
    get backButton(): monaco.quickInput.IQuickInputButton;
    get onShow(): Event<void>;
    get onHide(): Event<void>;
    setContextKey(key: string | undefined): void;
    createQuickPick<T extends monaco.quickInput.IQuickPickItem>(): monaco.quickInput.IQuickPick<T>;
    createInputBox(): monaco.quickInput.IInputBox;
    open(filter: string): void;
    input(options?: monaco.quickInput.IInputOptions, token?: CancellationToken): Promise<string | undefined>;
    pick<T extends monaco.quickInput.IQuickPickItem, O extends monaco.quickInput.IPickOptions<T>>(picks: Promise<T[]> | T[], options?: O, token?: CancellationToken): Promise<(O extends {
        canPickMany: true;
    } ? T[] : T) | undefined>;
    hide(): void;
    focus(): void;
    toggle(): void;
    applyStyles(styles: monaco.quickInput.IQuickInputStyles): void;
    layout(dimension: monaco.editor.IDimension, titleBarOffset: number): void;
    navigate?(next: boolean, quickNavigate?: monaco.quickInput.IQuickNavigateConfiguration): void;
    dispose(): void;
    cancel(): Promise<void>;
    back(): Promise<void>;
    accept?(keyMods?: monaco.quickInput.IKeyMods): Promise<void>;
    private initContainer;
    private initController;
    private getOptions;
}
export declare class MonacoQuickInputService implements QuickInputService {
    controller: monaco.quickInput.QuickInputController;
    protected readonly keybindingRegistry: KeybindingRegistry;
    private monacoService;
    get backButton(): monaco.quickInput.IQuickInputButton;
    get onShow(): Event<void>;
    get onHide(): Event<void>;
    open(filter: string): void;
    createInputBox(): InputBox;
    input(options?: InputOptions, token?: CancellationToken): Promise<string | undefined>;
    pick<T extends QuickPickItem, O extends PickOptions<T>>(picks: T[] | Promise<T[]>, options?: O, token?: CancellationToken): Promise<(O extends {
        canPickMany: true;
    } ? T[] : T) | undefined>;
    showQuickPick<T extends QuickPickItem>(items: T[], options?: QuickPickOptions<T>): Promise<T>;
    wrapQuickPick<T extends QuickPickItem>(wrapped: monaco.quickInput.IQuickPick<MonacoQuickPickItem<T>>): QuickPick<T>;
    createQuickPick<T extends QuickPickItem>(): QuickPick<T>;
    hide(): void;
}
export declare class MonacoQuickPickItem<T extends QuickPickItem> implements monaco.quickInput.IQuickPickItem {
    readonly item: T;
    readonly type?: 'item' | 'separator';
    readonly id?: string;
    readonly label: string;
    readonly meta?: string;
    readonly ariaLabel?: string;
    readonly description?: string;
    readonly detail?: string;
    readonly keybinding?: monaco.keybindings.ResolvedKeybinding;
    readonly iconClasses?: string[];
    buttons?: monaco.quickInput.IQuickInputButton[];
    readonly alwaysShow?: boolean;
    readonly highlights?: QuickPickItemHighlights;
    constructor(item: T, kbRegistry: KeybindingRegistry);
    accept(): void;
}
