import '../assets/style/index.css';
import { ContainerModule, interfaces } from 'inversify';
export declare const MonacoFrontendModule: ContainerModule;
export declare const MonacoConfigurationService: unique symbol;
export declare function createMonacoConfigurationService(container: interfaces.Container): monaco.services.IConfigurationService;
