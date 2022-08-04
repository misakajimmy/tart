import { FrontendApplicationContribution } from './frontend-application';
import { ContributionProvider, DisposableCollection, Emitter } from '../common';
import { ColorRegistry } from './color-registry';
export declare const ColorContribution: unique symbol;
export interface ColorContribution {
    registerColors(colors: ColorRegistry): void;
}
export declare class ColorApplicationContribution implements FrontendApplicationContribution {
    private static themeBackgroundId;
    protected readonly onDidChangeEmitter: Emitter<void>;
    readonly onDidChange: import("../common").Event<void>;
    protected readonly colors: ColorRegistry;
    protected readonly colorContributions: ContributionProvider<ColorContribution>;
    protected readonly toUpdate: DisposableCollection;
    static initBackground(): void;
    onStart(): void;
    protected update(): void;
    protected updateThemeBackground(): void;
}
