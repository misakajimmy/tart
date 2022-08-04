var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '../../common';
import { QuickAccessContribution } from './quick-access';
let QuickInputFrontendContribution = class QuickInputFrontendContribution {
    contributionProvider;
    onStart() {
        this.contributionProvider.getContributions().forEach(contrib => {
            contrib.registerQuickAccessProvider();
        });
    }
};
__decorate([
    inject(ContributionProvider),
    named(QuickAccessContribution)
], QuickInputFrontendContribution.prototype, "contributionProvider", void 0);
QuickInputFrontendContribution = __decorate([
    injectable()
], QuickInputFrontendContribution);
export { QuickInputFrontendContribution };

//# sourceMappingURL=../../../lib/browser/quick-input/quick-input-frontend-contribution.js.map
