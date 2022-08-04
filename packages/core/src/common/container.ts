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
    console.log(modules);
    await modules.map(async module => {
      await this.importModule(module);
    });
    console.log('over');
  }

  async loadsAsync(jsModules: Promise<any[]>) {
    const modules = (await jsModules).map(jsModule => {
      return jsModule.default;
    });
    console.log(modules);
    await this.loads(modules);
  }

  protected async importModule(module: string) {
    console.log('start');
    // const m = await import(`@tart_module/${module}`);
    // await this.load(m.default);
  }

  protected async loads(jsModules: any[]) {
    await jsModules.map(async (jsModule) => {
      await this.load(jsModule);
    });
  }

  protected async load(jsModule: any) {
    if (!this._modules.includes(jsModule)) {
      this._modules.push(jsModule);
      this._container.load(jsModule);
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
