var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { inject, injectable } from 'inversify';
import { Event } from '@tart/core/lib/common';
import { QuickPickSeparator } from '@tart/core/lib/common/quick-pick-service';
import { KeybindingRegistry } from '@tart/core/lib/browser/keybinding';
import { MonacoResolvedKeybinding } from './monaco-resolved-keybinding';
let MonacoQuickInputImplementation = class MonacoQuickInputImplementation {
    constructor() {
        this.initContainer();
        this.initController();
        this.quickAccess = new monaco.quickInput.QuickAccessController(this, monaco.services.StaticServices.instantiationService.get());
    }
    get backButton() {
        return this.controller.backButton;
    }
    get onShow() {
        return this.controller.onShow;
    }
    get onHide() {
        return this.controller.onHide;
    }
    setContextKey(key) {
        if (key) {
            this.contextKeyService.createKey(key, undefined);
        }
    }
    createQuickPick() {
        return this.controller.createQuickPick();
    }
    createInputBox() {
        return this.controller.createInputBox();
    }
    open(filter) {
        this.quickAccess.show(filter);
        setTimeout(() => {
            this.quickInputList.focusNth(0);
        }, 300);
    }
    input(options, token) {
        return this.controller.input(options, token);
    }
    pick(picks, options = {}, token) {
        return this.controller.pick(picks, options, token);
    }
    hide() {
        this.controller.hide();
    }
    focus() {
        this.controller.focus();
    }
    toggle() {
        this.controller.toggle();
    }
    applyStyles(styles) {
        this.controller.applyStyles(styles);
    }
    layout(dimension, titleBarOffset) {
        this.controller.layout(dimension, titleBarOffset);
    }
    navigate(next, quickNavigate) {
        this.controller.navigate(next, quickNavigate);
    }
    dispose() {
        this.controller.dispose();
    }
    async cancel() {
        this.controller.cancel();
    }
    async back() {
        this.controller.back();
    }
    async accept(keyMods) {
        this.controller.accept(keyMods);
    }
    initContainer() {
        const overlayWidgets = document.createElement('div');
        overlayWidgets.classList.add('quick-input-overlay');
        document.body.appendChild(overlayWidgets);
        const container = this.container = document.createElement('quick-input-container');
        container.style.position = 'absolute';
        container.style.top = '0px';
        container.style.right = '50%';
        container.style.zIndex = '1000000';
        overlayWidgets.appendChild(container);
    }
    initController() {
        this.controller = new monaco.quickInput.QuickInputController(this.getOptions());
        this.controller.layout({ width: 600, height: 1200 }, 0);
    }
    getOptions() {
        return {
            idPrefix: 'quickInput_',
            container: this.container,
            ignoreFocusOut: () => false,
            isScreenReaderOptimized: () => true,
            backKeybindingLabel: () => undefined,
            setContextKey: (id) => this.setContextKey(id),
            returnFocus: () => this.container.focus(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            createList: (user, container, delegate, renderers, options) => {
                this.quickInputList = new monaco.list.List(user, container, delegate, renderers, options);
                return this.quickInputList;
            },
            styles: {
                widget: {},
                list: {},
                inputBox: {},
                countBadge: {},
                button: {},
                progressBar: {}
            }
        };
    }
};
__decorate([
    inject(monaco.contextKeyService.ContextKeyService)
], MonacoQuickInputImplementation.prototype, "contextKeyService", void 0);
MonacoQuickInputImplementation = __decorate([
    injectable()
], MonacoQuickInputImplementation);
export { MonacoQuickInputImplementation };
class MonacoQuickInput {
    constructor(wrapped) {
        this.wrapped = wrapped;
        this.onDidHide = this.wrapped.onDidHide;
        this.onDispose = this.wrapped.onDispose;
    }
    get title() {
        return this.wrapped.title;
    }
    set title(v) {
        this.wrapped.title = v;
    }
    get description() {
        return this.wrapped.description;
    }
    set description(v) {
        this.wrapped.description = v;
    }
    get step() {
        return this.wrapped.step;
    }
    set step(v) {
        this.wrapped.step = v;
    }
    get enabled() {
        return this.wrapped.enabled;
    }
    set enabled(v) {
        this.wrapped.enabled = v;
    }
    get totalSteps() {
        return this.wrapped.totalSteps;
    }
    set totalSteps(v) {
        this.wrapped.totalSteps = v;
    }
    get contextKey() {
        return this.wrapped.contextKey;
    }
    set contextKey(v) {
        this.wrapped.contextKey = v;
    }
    get busy() {
        return this.wrapped.busy;
    }
    set busy(v) {
        this.wrapped.busy = v;
    }
    get ignoreFocusOut() {
        return this.wrapped.ignoreFocusOut;
    }
    set ignoreFocusOut(v) {
        this.wrapped.ignoreFocusOut = v;
    }
    show() {
        this.wrapped.show();
    }
    hide() {
        this.wrapped.hide();
    }
    dispose() {
        this.wrapped.dispose();
    }
}
class MonacoQuickPick extends MonacoQuickInput {
    constructor(wrapped, keybindingRegistry) {
        super(wrapped);
        this.wrapped = wrapped;
        this.keybindingRegistry = keybindingRegistry;
        this.onDidAccept = this.wrapped.onDidAccept;
        this.onDidChangeValue = this.wrapped.onDidChangeValue;
        this.onDidTriggerButton = this.wrapped.onDidTriggerButton;
        this.onDidTriggerItemButton =
            Event.map(this.wrapped.onDidTriggerItemButton, (evt) => ({
                item: evt.item.item,
                button: evt.button
            }));
        this.onDidChangeActive = Event.map(this.wrapped.onDidChangeActive, (items) => items.map(item => item.item));
        this.onDidChangeSelection = Event.map(this.wrapped.onDidChangeSelection, (items) => items.map(item => item.item));
    }
    get value() {
        return this.wrapped.value;
    }
    ;
    set value(v) {
        this.wrapped.value = v;
    }
    get placeholder() {
        return this.wrapped.placeholder;
    }
    set placeholder(v) {
        this.wrapped.placeholder = v;
    }
    get canSelectMany() {
        return this.wrapped.canSelectMany;
    }
    set canSelectMany(v) {
        this.wrapped.canSelectMany = v;
    }
    get matchOnDescription() {
        return this.wrapped.matchOnDescription;
    }
    set matchOnDescription(v) {
        this.wrapped.matchOnDescription = v;
    }
    get matchOnDetail() {
        return this.wrapped.matchOnDetail;
    }
    set matchOnDetail(v) {
        this.wrapped.matchOnDetail = v;
    }
    get items() {
        return this.wrapped.items.map(item => QuickPickSeparator.is(item) ? item : item.item);
    }
    set items(itms) {
        this.wrapped.items = itms.map(item => QuickPickSeparator.is(item) ? item : new MonacoQuickPickItem(item, this.keybindingRegistry));
    }
    get activeItems() {
        return this.wrapped.activeItems.map(item => item.item);
    }
    set activeItems(itms) {
        this.wrapped.activeItems = itms.map(item => new MonacoQuickPickItem(item, this.keybindingRegistry));
    }
    get selectedItems() {
        return this.wrapped.selectedItems.map(item => item.item);
    }
    set selectedItems(itms) {
        this.wrapped.selectedItems = itms.map(item => new MonacoQuickPickItem(item, this.keybindingRegistry));
    }
}
let MonacoQuickInputService = class MonacoQuickInputService {
    get backButton() {
        return this.controller.backButton;
    }
    get onShow() {
        return this.monacoService.onShow;
    }
    get onHide() {
        return this.monacoService.onHide;
    }
    open(filter) {
        this.monacoService.open(filter);
    }
    createInputBox() {
        return this.monacoService.createInputBox();
    }
    input(options, token) {
        let inputOptions;
        if (options) {
            const { validateInput } = options, props = __rest(options, ["validateInput"]);
            inputOptions = Object.assign({}, props);
            if (validateInput) {
                inputOptions.validateInput = async (input) => validateInput(input);
            }
        }
        return this.monacoService.input(inputOptions, token);
    }
    pick(picks, options, token) {
        return this.monacoService.pick(picks, options, token);
    }
    showQuickPick(items, options) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            const quickPick = this.monacoService.createQuickPick();
            const wrapped = this.wrapQuickPick(quickPick);
            if (options) {
                wrapped.canSelectMany = !!options.canSelectMany;
                wrapped.contextKey = options.contextKey;
                wrapped.description = options.description;
                wrapped.enabled = (_a = options.enabled) !== null && _a !== void 0 ? _a : true;
                wrapped.ignoreFocusOut = !!options.ignoreFocusOut;
                wrapped.matchOnDescription = (_b = options.matchOnDescription) !== null && _b !== void 0 ? _b : true;
                wrapped.matchOnDetail = (_c = options.matchOnDetail) !== null && _c !== void 0 ? _c : true;
                wrapped.placeholder = options.placeholder;
                wrapped.step = options.step;
                wrapped.title = options.title;
                wrapped.totalSteps = options.totalSteps;
                if (options.activeItem) {
                    wrapped.activeItems = [options.activeItem];
                }
                wrapped.onDidAccept(() => {
                    if (options === null || options === void 0 ? void 0 : options.onDidAccept) {
                        options.onDidAccept();
                    }
                    wrapped.hide();
                    resolve(wrapped.selectedItems[0]);
                });
                wrapped.onDidHide(() => {
                    if (options.onDidHide) {
                        options.onDidHide();
                    }
                    ;
                    wrapped.dispose();
                });
                wrapped.onDidChangeValue((filter) => {
                    if (options.onDidChangeValue) {
                        options.onDidChangeValue(wrapped, filter);
                    }
                });
                wrapped.onDidChangeActive((activeItems) => {
                    if (options.onDidChangeActive) {
                        options.onDidChangeActive(wrapped, activeItems);
                    }
                });
                wrapped.onDidTriggerButton((button) => {
                    if (options.onDidTriggerButton) {
                        options.onDidTriggerButton(button);
                    }
                });
                wrapped.onDidTriggerItemButton((evt) => {
                    if (options.onDidTriggerItemButton) {
                        // https://github.com/wm-ide/vscode/blob/standalone/0.23.x/src/vs/base/parts/quickinput/browser/quickInput.ts#L1387
                        options.onDidTriggerItemButton(Object.assign(Object.assign({}, evt), { removeItem: () => {
                                wrapped.items = wrapped.items.filter(item => item !== evt.item);
                                wrapped.activeItems = wrapped.activeItems.filter(item => item !== evt.item);
                            } }));
                    }
                });
                wrapped.onDidChangeSelection((selectedItems) => {
                    if (options.onDidChangeSelection) {
                        options.onDidChangeSelection(wrapped, selectedItems);
                    }
                });
            }
            wrapped.items = items;
            wrapped.show();
        }).then(item => {
            if (item === null || item === void 0 ? void 0 : item.execute) {
                item.execute();
            }
            return item;
        });
    }
    wrapQuickPick(wrapped) {
        return new MonacoQuickPick(wrapped, this.keybindingRegistry);
    }
    createQuickPick() {
        const quickPick = this.monacoService.createQuickPick();
        return this.wrapQuickPick(quickPick);
    }
    hide() {
        return this.monacoService.hide();
    }
};
__decorate([
    inject(KeybindingRegistry)
], MonacoQuickInputService.prototype, "keybindingRegistry", void 0);
__decorate([
    inject(MonacoQuickInputImplementation)
], MonacoQuickInputService.prototype, "monacoService", void 0);
MonacoQuickInputService = __decorate([
    injectable()
], MonacoQuickInputService);
export { MonacoQuickInputService };
export class MonacoQuickPickItem {
    constructor(item, kbRegistry) {
        this.item = item;
        this.type = item.type;
        this.id = item.id;
        this.label = item.label;
        this.meta = item.meta;
        this.ariaLabel = item.ariaLabel;
        this.description = item.description;
        this.detail = item.detail;
        this.keybinding = item.keySequence ? new MonacoResolvedKeybinding(item.keySequence, kbRegistry) : undefined;
        this.iconClasses = item.iconClasses;
        this.buttons = item.buttons;
        this.alwaysShow = item.alwaysShow;
        this.highlights = item.highlights;
    }
    accept() {
        if (this.item.execute) {
            this.item.execute();
        }
    }
}

//# sourceMappingURL=../../lib/browser/monaco-quick-input-service.js.map
