import {inject, injectable} from 'inversify';
import {KeybindingRegistry, QuickAccessProviderDescriptor, QuickAccessRegistry} from '@tart/core';
import {CancellationToken, Disposable} from '@tart/core/lib/common';
import {QuickPickItem, QuickPickSeparator} from '@tart/core/lib/common/quick-pick-service';
import {MonacoQuickPickItem} from './monaco-quick-input-service';

abstract class MonacoPickerAccessProvider extends monaco.quickInput.PickerQuickAccessProvider<QuickPickItem> {
    constructor(prefix: string, options?: monaco.quickInput.IPickerQuickAccessProviderOptions<QuickPickItem>) {
        super(prefix, options);
    }

    abstract getDescriptor(): QuickAccessProviderDescriptor;
}

class WmQuickAccessDescriptor implements monaco.quickInput.IQuickAccessProviderDescriptor {
    constructor(
        public readonly wmDescriptor: QuickAccessProviderDescriptor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly ctor: { new(...services: any /* TS BrandedService but no clue how to type this properly */[]): monaco.quickInput.IQuickAccessProvider },
        readonly prefix: string,
        readonly helpEntries: monaco.quickInput.IQuickAccessProviderHelp[],
        readonly placeholder?: string) {
    }
}

@injectable()
export class MonacoQuickAccessRegistry implements QuickAccessRegistry {
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry: KeybindingRegistry;

  private get monacoRegistry(): monaco.quickInput.IQuickAccessRegistry {
    return monaco.platform.Registry.as<monaco.quickInput.IQuickAccessRegistry>('workbench.contributions.quickaccess');
  }

  registerQuickAccessProvider(descriptor: QuickAccessProviderDescriptor): Disposable {
    const toMonacoPick = (item: QuickPickItem): monaco.quickInput.Pick<monaco.quickInput.IAnythingQuickPickItem> => {
      if (QuickPickSeparator.is(item)) {
        return item;
      } else {
        return new MonacoQuickPickItem(item, this.keybindingRegistry);
      }
    };

    const inner =
        class extends MonacoPickerAccessProvider {
          constructor() {
            super(descriptor.prefix);
          }

          getDescriptor(): QuickAccessProviderDescriptor {
            return descriptor;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getPicks(filter: string, disposables: any, token: CancellationToken): monaco.quickInput.Picks<QuickPickItem> | Promise<monaco.quickInput.Picks<QuickPickItem>> {
            const result = descriptor.getInstance().getPicks(filter, token);
            if (result instanceof Promise) {
              return result.then(picks => picks.map(toMonacoPick));
            } else {
              return result.map(toMonacoPick);
            }
          }
        };

    return this.monacoRegistry.registerQuickAccessProvider(new WmQuickAccessDescriptor(
        descriptor,
        inner,
        descriptor.prefix,
        descriptor.helpEntries,
        descriptor.placeholder
    ));
  }

  getQuickAccessProviders(): QuickAccessProviderDescriptor[] {
    return this.monacoRegistry.getQuickAccessProviders()
        .filter(provider => provider instanceof WmQuickAccessDescriptor)
        .map(provider => (provider as WmQuickAccessDescriptor).wmDescriptor);
  }

  getQuickAccessProvider(prefix: string): QuickAccessProviderDescriptor | undefined {
    const monacoDescriptor = this.monacoRegistry.getQuickAccessProvider(prefix);
    return monacoDescriptor ? (monacoDescriptor as WmQuickAccessDescriptor).wmDescriptor : undefined;
  }

  clear(): void {
    this.monacoRegistry.clear();
  }
}
