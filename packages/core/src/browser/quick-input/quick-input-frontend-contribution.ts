import {inject, injectable, named} from 'inversify';
import {FrontendApplicationContribution} from '../frontend-application';
import {ContributionProvider} from '../../common';
import {QuickAccessContribution} from './quick-access';

@injectable()
export class QuickInputFrontendContribution implements FrontendApplicationContribution {

  @inject(ContributionProvider) @named(QuickAccessContribution)
  protected readonly contributionProvider: ContributionProvider<QuickAccessContribution>;

  onStart(): void {
    this.contributionProvider.getContributions().forEach(contrib => {
      contrib.registerQuickAccessProvider();
    });
  }
}
