import { Container, interfaces } from 'inversify';
export declare class ContainerLoader {
    private _container;
    private _modules;
    constructor();
    get container(): Container;
    importModules(modules: string[]): Promise<void>;
    loadsAsync(jsModules: Promise<any[]>): Promise<void>;
    protected importModule(module: string): Promise<void>;
    protected loads(jsModules: any[]): Promise<void>;
    protected load(jsModule: any): Promise<void>;
    getService<T>(service: interfaces.ServiceIdentifier<T>): T;
}
/**
 * The namespace for `ApplicationShell` class statics.
 */
export declare namespace ApplicationShell {
    /**
     * The areas of the application shell where widgets can reside.
     */
    type Area = 'main' | 'top' | 'left' | 'right' | 'bottom';
}
