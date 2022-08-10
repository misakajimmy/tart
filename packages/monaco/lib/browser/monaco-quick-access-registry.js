var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import { KeybindingRegistry } from '@tart/core';
import { QuickPickSeparator } from '@tart/core/lib/common/quick-pick-service';
import { MonacoQuickPickItem } from './monaco-quick-input-service';
class MonacoPickerAccessProvider extends monaco.quickInput.PickerQuickAccessProvider {
    constructor(prefix, options) {
        super(prefix, options);
    }
}
class WmQuickAccessDescriptor {
    constructor(wmDescriptor, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctor, prefix, helpEntries, placeholder) {
        this.wmDescriptor = wmDescriptor;
        this.ctor = ctor;
        this.prefix = prefix;
        this.helpEntries = helpEntries;
        this.placeholder = placeholder;
    }
}
let MonacoQuickAccessRegistry = class MonacoQuickAccessRegistry {
    get monacoRegistry() {
        return monaco.platform.Registry.as('workbench.contributions.quickaccess');
    }
    registerQuickAccessProvider(descriptor) {
        const toMonacoPick = (item) => {
            if (QuickPickSeparator.is(item)) {
                return item;
            }
            else {
                return new MonacoQuickPickItem(item, this.keybindingRegistry);
            }
        };
        const inner = class extends MonacoPickerAccessProvider {
            constructor() {
                super(descriptor.prefix);
            }
            getDescriptor() {
                return descriptor;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getPicks(filter, disposables, token) {
                const result = descriptor.getInstance().getPicks(filter, token);
                if (result instanceof Promise) {
                    return result.then(picks => picks.map(toMonacoPick));
                }
                else {
                    return result.map(toMonacoPick);
                }
            }
        };
        return this.monacoRegistry.registerQuickAccessProvider(new WmQuickAccessDescriptor(descriptor, inner, descriptor.prefix, descriptor.helpEntries, descriptor.placeholder));
    }
    getQuickAccessProviders() {
        return this.monacoRegistry.getQuickAccessProviders()
            .filter(provider => provider instanceof WmQuickAccessDescriptor)
            .map(provider => provider.wmDescriptor);
    }
    getQuickAccessProvider(prefix) {
        const monacoDescriptor = this.monacoRegistry.getQuickAccessProvider(prefix);
        return monacoDescriptor ? monacoDescriptor.wmDescriptor : undefined;
    }
    clear() {
        this.monacoRegistry.clear();
    }
};
__decorate([
    inject(KeybindingRegistry)
], MonacoQuickAccessRegistry.prototype, "keybindingRegistry", void 0);
MonacoQuickAccessRegistry = __decorate([
    injectable()
], MonacoQuickAccessRegistry);
export { MonacoQuickAccessRegistry };

//# sourceMappingURL=../../lib/browser/monaco-quick-access-registry.js.map
