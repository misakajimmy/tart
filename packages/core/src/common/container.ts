import {Container, interfaces} from 'inversify';

export class ContainerLoader {
  private _container: Container = new Container();
  private _modules: any[] = [];

  constructor() {
  }

  get container() {
    return this._container;
  }

  async importModules(modules: string[]) {
    await modules.map(async module => {
      await this.importModule(module);
    });
  }

  protected async importModule(module: string) {
    const m = await import(`@tart_module/${module}`);
    await this.load(m);
  }

  protected async load(jsModule: any) {
    const module = await jsModule.default;
    if (!this._modules.includes(module)) {
      this._modules.push(module);
      this._container.load(module);
    }
  }

  getService<T>(service: interfaces.ServiceIdentifier<T>): T {
    return this._container.get(service);
  }
}

/**
 * The namespace for `ApplicationShell` class statics.
 */
export namespace ApplicationShell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'left' | 'right' | 'bottom';
}
