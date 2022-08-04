import { Container } from 'inversify';
export class ContainerLoader {
    _container = new Container();
    _modules = [];
    constructor() {
    }
    get container() {
        return this._container;
    }
    async importModules(modules) {
        console.log(modules);
        await modules.map(async (module) => {
            await this.importModule(module);
        });
        console.log('over');
    }
    async loadsAsync(jsModules) {
        const modules = (await jsModules).map(jsModule => {
            return jsModule.default;
        });
        console.log(modules);
        await this.loads(modules);
    }
    async importModule(module) {
        console.log('start');
        // const m = await import(`@tart_module/${module}`);
        // await this.load(m.default);
    }
    async loads(jsModules) {
        await jsModules.map(async (jsModule) => {
            await this.load(jsModule);
        });
    }
    async load(jsModule) {
        if (!this._modules.includes(jsModule)) {
            this._modules.push(jsModule);
            this._container.load(jsModule);
        }
    }
    getService(service) {
        return this._container.get(service);
    }
}

//# sourceMappingURL=../../lib/common/container.js.map
