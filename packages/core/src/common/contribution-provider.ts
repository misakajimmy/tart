import {interfaces} from 'inversify';
import {ContributionFilterRegistry} from './contribution-filter';

export const ContributionProvider = Symbol('ContributionProvider');

export interface ContributionProvider<T extends object> {
  getContributions(recursive?: boolean): T[]
}

class ContainerBasedContributionProvider<T extends object> implements ContributionProvider<T> {
  protected services: T[] | undefined;

  constructor(
      protected readonly serviceIdentifier: interfaces.ServiceIdentifier<T>,
      protected readonly container: interfaces.Container
  ) {
  }

  getContributions(recursive?: boolean): T[] {
    if (this.services === undefined) {
      const currentServices: T[] = [];
      let filterRegistry: ContributionFilterRegistry | undefined;
      let currentContainer: interfaces.Container | null = this.container;
      while (currentContainer !== null) {
        if (currentContainer.isBound(this.serviceIdentifier)) {
          try {
            currentServices.push(...currentContainer.getAll(this.serviceIdentifier));
          } catch (error) {
            console.log(error);
          }
        }
        if (filterRegistry === undefined && currentContainer.isBound(ContributionFilterRegistry)) {
          filterRegistry = currentContainer.get(ContributionFilterRegistry);
        }
        currentContainer = recursive === true ? currentContainer.parent : null;
      }
      this.services = filterRegistry ? filterRegistry.applyFilters(currentServices, this.serviceIdentifier) : currentServices;
    }
    return this.services;
  }
}

export type Bindable = interfaces.Bind | interfaces.Container;
export namespace Bindable {
  export function isContainer(arg: Bindable): arg is interfaces.Container {
    return typeof arg !== 'function'
        // https://github.com/eclipse-wm/wm/issues/3204#issue-371029654
        // In InversifyJS `4.14.0` containers no longer have a property `guid`.
        && ('guid' in arg || 'parent' in arg);
  }
}

export function bindContributionProvider(bindable: Bindable, id: symbol): void {
  const bindingToSyntax = (Bindable.isContainer(bindable) ? bindable.bind(ContributionProvider) : bindable(ContributionProvider));
  bindingToSyntax
      .toDynamicValue(ctx => new ContainerBasedContributionProvider(id, ctx.container))
      .inSingletonScope().whenTargetNamed(id);
}
