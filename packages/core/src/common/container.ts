import {Container, interfaces} from 'inversify';

export class ContainerLoader {
  private _container: Container = new Container();
  private _modules: any[] = [];

  constructor() {
  }

  async importModules(modules: string[]) {
    await modules.map(async module => {
      await this.importModule(module);
    });
  }

  protected async importModule(module: string) {
    console.log(module);
    const m = await import(`@tart/core/${module}`);
    console.log(m);
    // const n = await import(module);
    // console.log(n);
    // await this.load(m);
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
