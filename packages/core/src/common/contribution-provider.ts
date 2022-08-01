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
