var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { ColorRegistry } from '@tart/core/lib/browser/color-registry';
import { Disposable } from '@tart/core/lib/common';
let MonacoColorRegistry = class MonacoColorRegistry extends ColorRegistry {
    constructor() {
        super(...arguments);
        this.monacoThemeService = monaco.services.StaticServices.standaloneThemeService.get();
        this.monacoColorRegistry = monaco.color.getColorRegistry();
    }
    *getColors() {
        for (const { id } of this.monacoColorRegistry.getColors()) {
            yield id;
        }
    }
    getCurrentColor(id) {
        const color = this.monacoThemeService.getColorTheme().getColor(id);
        return color && color.toString();
    }
    doRegister(definition) {
        let defaults;
        if (definition.defaults) {
            defaults = {};
            defaults.dark = this.toColor(definition.defaults.dark);
            defaults.light = this.toColor(definition.defaults.light);
            defaults.hc = this.toColor(definition.defaults.hc);
        }
        const identifier = this.monacoColorRegistry.registerColor(definition.id, defaults, definition.description);
        return Disposable.create(() => this.monacoColorRegistry.deregisterColor(identifier));
    }
    toColor(value) {
        if (!value || typeof value === 'string') {
            // @ts-ignore
            return value;
        }
        if ('kind' in value) {
            return monaco.color[value.kind](value.v, value.f);
        }
        else if ('r' in value) {
            const { r, g, b, a } = value;
            return new monaco.color.Color(new monaco.color.RGBA(r, g, b, a));
        }
        else {
            const { h, s, l, a } = value;
            return new monaco.color.Color(new monaco.color.HSLA(h, s, l, a));
        }
    }
};
MonacoColorRegistry = __decorate([
    injectable()
], MonacoColorRegistry);
export { MonacoColorRegistry };

//# sourceMappingURL=../../lib/browser/monaco-color-registry.js.map
