import { FrontendApplicationContribution } from '../frontend-application';
import { ContributionProvider } from '../../common';
import { QuickAccessContribution } from './quick-access';
export declare class QuickInputFrontendContribution implements FrontendApplicationContribution {
    protected readonly contributionProvider: ContributionProvider<QuickAccessContribution>;
    onStart(): void;
}
