import {injectable} from 'inversify';
import {Color, ColorRegistry} from '@tart/core/lib/browser/color-registry';
import {ColorDefinition} from '@tart/core/lib/common/color';
import {Disposable} from '@tart/core/lib/common';

@injectable()
export class MonacoColorRegistry extends ColorRegistry {

    protected readonly monacoThemeService = monaco.services.StaticServices.standaloneThemeService.get();
    protected readonly monacoColorRegistry = monaco.color.getColorRegistry();

    * getColors(): IterableIterator<string> {
        for (const {id} of this.monacoColorRegistry.getColors()) {
            yield id;
        }
    }

    getCurrentColor(id: string): string | undefined {
        const color = this.monacoThemeService.getColorTheme().getColor(id);
        return color && color.toString();
    }

    protected doRegister(definition: ColorDefinition): Disposable {
        let defaults: monaco.color.ColorDefaults | undefined;
        if (definition.defaults) {
            defaults = {};
            defaults.dark = this.toColor(definition.defaults.dark);
            defaults.light = this.toColor(definition.defaults.light);
            defaults.hc = this.toColor(definition.defaults.hc);
        }
        const identifier = this.monacoColorRegistry.registerColor(definition.id, defaults, definition.description);
        return Disposable.create(() => this.monacoColorRegistry.deregisterColor(identifier));
    }

    protected toColor(value: Color | undefined): monaco.color.ColorValue | undefined {
        if (!value || typeof value === 'string') {
            // @ts-ignore
            return value;
        }
        if ('kind' in value) {
            return monaco.color[value.kind](value.v, value.f);
        } else if ('r' in value) {
            const {r, g, b, a} = value;
            return new monaco.color.Color(new monaco.color.RGBA(r, g, b, a));
        } else {
            const {h, s, l, a} = value;
            return new monaco.color.Color(new monaco.color.HSLA(h, s, l, a));
        }
    }
}
