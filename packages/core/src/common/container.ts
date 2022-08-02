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
    console.log(this._container);
    return this._container.get(service);
  }
}
