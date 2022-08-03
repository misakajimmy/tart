import {inject, injectable, interfaces, named} from 'inversify';
import URI from '../../common/uri';
import {bindContributionProvider, ContributionProvider} from '../../common/contribution-provider';

export const PreferenceConfiguration = Symbol('PreferenceConfiguration');

export interface PreferenceConfiguration {
  name: string;
}

export function bindPreferenceConfigurations(bind: interfaces.Bind): void {
  bindContributionProvider(bind, PreferenceConfiguration);
  bind(PreferenceConfigurations).toSelf().inSingletonScope();
}

@injectable()
export class PreferenceConfigurations {
  @inject(ContributionProvider) @named(PreferenceConfiguration)
  protected readonly provider: ContributionProvider<PreferenceConfiguration>;
  protected sectionNames: string[] | undefined;

  /* prefer Tart over VS Code by default */
  getPaths(): string[] {
    return ['.tart', '.vscode'];
  }

  getConfigName(): string {
    return 'settings';
  }

  getSectionNames(): string[] {
    if (!this.sectionNames) {
      this.sectionNames = this.provider.getContributions().map(p => p.name);
    }
    return this.sectionNames;
  }

  isSectionName(name: string): boolean {
    return this.getSectionNames().indexOf(name) !== -1;
  }

  isAnyConfig(name: string): boolean {
    return [...this.getSectionNames(), this.getConfigName()].includes(name);
  }

  isSectionUri(configUri: URI | undefined): boolean {
    return !!configUri && this.isSectionName(this.getName(configUri));
  }

  isConfigUri(configUri: URI | undefined): boolean {
    return !!configUri && this.getName(configUri) === this.getConfigName();
  }

  getName(configUri: URI): string {
    return configUri.path.name;
  }

  getPath(configUri: URI): string {
    return configUri.parent.path.base;
  }

  createUri(folder: URI, configPath: string = this.getPaths()[0], configName: string = this.getConfigName()): URI {
    return folder.resolve(configPath).resolve(configName + '.json');
  }

}
