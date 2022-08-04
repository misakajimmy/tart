var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ColorApplicationContribution_1;
import { inject, injectable, named } from 'inversify';
import { ContributionProvider, Disposable, DisposableCollection, Emitter } from '../common';
import { ColorRegistry } from './color-registry';
import { ThemeService } from './theming';
export const ColorContribution = Symbol('ColorContribution');
let ColorApplicationContribution = ColorApplicationContribution_1 = class ColorApplicationContribution {
    static themeBackgroundId = 'theme.background';
    onDidChangeEmitter = new Emitter();
    onDidChange = this.onDidChangeEmitter.event;
    colors;
    colorContributions;
    toUpdate = new DisposableCollection();
    static initBackground() {
        const value = window.localStorage.getItem(this.themeBackgroundId) || '#1d1d1d';
        const documentElement = document.documentElement;
        documentElement.style.setProperty('--tart-editor-background', value);
    }
    onStart() {
        for (const contribution of this.colorContributions.getContributions()) {
            contribution.registerColors(this.colors);
        }
        this.updateThemeBackground();
        ThemeService.get().onDidColorThemeChange(() => this.updateThemeBackground());
        this.update();
        ThemeService.get().onDidColorThemeChange(() => this.update());
        this.colors.onDidChange(() => this.update());
    }
    update() {
        if (!document) {
            return;
        }
        this.toUpdate.dispose();
        const theme = 'tart-' + ThemeService.get().getCurrentTheme().type;
        document.body.classList.add(theme);
        this.toUpdate.push(Disposable.create(() => document.body.classList.remove(theme)));
        const documentElement = document.documentElement;
        if (documentElement) {
            for (const id of this.colors.getColors()) {
                const variable = this.colors.getCurrentCssVariable(id);
                if (variable) {
                    const { name, value } = variable;
                    documentElement.style.setProperty(name, value);
                    this.toUpdate.push(Disposable.create(() => documentElement.style.removeProperty(name)));
                }
            }
        }
        this.onDidChangeEmitter.fire(undefined);
    }
    updateThemeBackground() {
        const color = this.colors.getCurrentColor('editor.background');
        if (color) {
            window.localStorage.setItem(ColorApplicationContribution_1.themeBackgroundId, color);
        }
        else {
            window.localStorage.removeItem(ColorApplicationContribution_1.themeBackgroundId);
        }
    }
};
__decorate([
    inject(ColorRegistry)
], ColorApplicationContribution.prototype, "colors", void 0);
__decorate([
    inject(ContributionProvider),
    named(ColorContribution)
], ColorApplicationContribution.prototype, "colorContributions", void 0);
ColorApplicationContribution = ColorApplicationContribution_1 = __decorate([
    injectable()
], ColorApplicationContribution);
export { ColorApplicationContribution };

//# sourceMappingURL=../../lib/browser/color-application-contribution.js.map
