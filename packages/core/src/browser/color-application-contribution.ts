import {inject, injectable, named} from 'inversify';
import {FrontendApplicationContribution} from './frontend-application';
import {ContributionProvider, Disposable, DisposableCollection, Emitter} from '../common';
import {ColorRegistry} from './color-registry';
import {ThemeService} from './theming';

export const ColorContribution = Symbol('ColorContribution');

export interface ColorContribution {
  registerColors(colors: ColorRegistry): void;
}

@injectable()
export class ColorApplicationContribution implements FrontendApplicationContribution {

  private static themeBackgroundId = 'theme.background';
  protected readonly onDidChangeEmitter = new Emitter<void>();
  readonly onDidChange = this.onDidChangeEmitter.event;
  @inject(ColorRegistry)
  protected readonly colors: ColorRegistry;
  @inject(ContributionProvider) @named(ColorContribution)
  protected readonly colorContributions: ContributionProvider<ColorContribution>;
  protected readonly toUpdate = new DisposableCollection();

  static initBackground(): void {
    const value = window.localStorage.getItem(this.themeBackgroundId) || '#1d1d1d';
    const documentElement = document.documentElement;
    documentElement.style.setProperty('--wm-editor-background', value);
  }

  onStart(): void {
    for (const contribution of this.colorContributions.getContributions()) {
      contribution.registerColors(this.colors);
    }

    this.updateThemeBackground();
    ThemeService.get().onDidColorThemeChange(() => this.updateThemeBackground());
    this.update();
    ThemeService.get().onDidColorThemeChange(() => this.update());
    this.colors.onDidChange(() => this.update());
  }

  protected update(): void {
    if (!document) {
      return;
    }
    this.toUpdate.dispose();
    const theme = 'wm-' + ThemeService.get().getCurrentTheme().type;
    document.body.classList.add(theme);
    this.toUpdate.push(Disposable.create(() => document.body.classList.remove(theme)));

    const documentElement = document.documentElement;
    if (documentElement) {
      for (const id of this.colors.getColors()) {
        const variable = this.colors.getCurrentCssVariable(id);
        if (variable) {
          const {name, value} = variable;
          documentElement.style.setProperty(name, value);
          this.toUpdate.push(Disposable.create(() => documentElement.style.removeProperty(name)));
        }
      }
    }
    this.onDidChangeEmitter.fire(undefined);
  }

  protected updateThemeBackground(): void {
    const color = this.colors.getCurrentColor('editor.background');
    if (color) {
      window.localStorage.setItem(ColorApplicationContribution.themeBackgroundId, color);
    } else {
      window.localStorage.removeItem(ColorApplicationContribution.themeBackgroundId);
    }
  }
}
