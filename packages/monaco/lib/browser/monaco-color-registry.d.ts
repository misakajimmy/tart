import { Color, ColorRegistry } from '@tart/core/lib/browser/color-registry';
import { ColorDefinition } from '@tart/core/lib/common/color';
import { Disposable } from '@tart/core/lib/common';
export declare class MonacoColorRegistry extends ColorRegistry {
    protected readonly monacoThemeService: monaco.services.IStandaloneThemeService;
    protected readonly monacoColorRegistry: monaco.color.IColorRegistry;
    getColors(): IterableIterator<string>;
    getCurrentColor(id: string): string | undefined;
    protected doRegister(definition: ColorDefinition): Disposable;
    protected toColor(value: Color | undefined): monaco.color.ColorValue | undefined;
}
