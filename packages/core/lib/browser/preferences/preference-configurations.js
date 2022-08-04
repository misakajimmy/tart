var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named } from 'inversify';
import { bindContributionProvider, ContributionProvider } from '../../common/contribution-provider';
export const PreferenceConfiguration = Symbol('PreferenceConfiguration');
export function bindPreferenceConfigurations(bind) {
    bindContributionProvider(bind, PreferenceConfiguration);
    bind(PreferenceConfigurations).toSelf().inSingletonScope();
}
let PreferenceConfigurations = class PreferenceConfigurations {
    provider;
    sectionNames;
    /* prefer Tart over VS Code by default */
    getPaths() {
        return ['.tart', '.vscode'];
    }
    getConfigName() {
        return 'settings';
    }
    getSectionNames() {
        if (!this.sectionNames) {
            this.sectionNames = this.provider.getContributions().map(p => p.name);
        }
        return this.sectionNames;
    }
    isSectionName(name) {
        return this.getSectionNames().indexOf(name) !== -1;
    }
    isAnyConfig(name) {
        return [...this.getSectionNames(), this.getConfigName()].includes(name);
    }
    isSectionUri(configUri) {
        return !!configUri && this.isSectionName(this.getName(configUri));
    }
    isConfigUri(configUri) {
        return !!configUri && this.getName(configUri) === this.getConfigName();
    }
    getName(configUri) {
        return configUri.path.name;
    }
    getPath(configUri) {
        return configUri.parent.path.base;
    }
    createUri(folder, configPath = this.getPaths()[0], configName = this.getConfigName()) {
        return folder.resolve(configPath).resolve(configName + '.json');
    }
};
__decorate([
    inject(ContributionProvider),
    named(PreferenceConfiguration)
], PreferenceConfigurations.prototype, "provider", void 0);
PreferenceConfigurations = __decorate([
    injectable()
], PreferenceConfigurations);
export { PreferenceConfigurations };

//# sourceMappingURL=../../../lib/browser/preferences/preference-configurations.js.map
